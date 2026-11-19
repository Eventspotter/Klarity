"""Security, bot defense, rate limiting, and request protection for Klarity."""

from __future__ import annotations

import re
import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Known vulnerability scanners, automated exploitation tools, and malicious scrapers
MALICIOUS_BOT_PATTERN = re.compile(
    r"(sqlmap|nikto|nuclei|masscan|acunetix|dirbuster|nmap|zgrab|censys|shodan|gobuster|wpscan|openvas)",
    re.IGNORECASE,
)

# Common probe / exploit scanner paths to drop immediately before routing or DB work
EXPLOIT_PROBE_PREFIXES = (
    "/.env",
    "/.git",
    "/wp-admin",
    "/wp-login",
    "/xmlrpc.php",
    "/phpmyadmin",
    "/cgi-bin",
    "/setup.php",
    "/.aws",
    "/.ssh",
    "/config.json",
    "/server-status",
    "/actuator",
)

# Maximum allowed Content-Length (15 MB) to prevent memory exhaustion DoS
MAX_CONTENT_LENGTH = 15 * 1024 * 1024


class SlidingWindowRateLimiter:
    """High-performance sliding-window in-memory rate limiter per IP."""

    def __init__(self, window_seconds: float = 60.0):
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.last_cleanup = time.monotonic()

    def _cleanup_expired(self, now: float) -> None:
        # Periodic cleanup every 30 seconds to prevent unbounded memory growth
        if now - self.last_cleanup > 30.0:
            cutoff = now - self.window_seconds
            for ip in list(self.requests.keys()):
                valid = [ts for ts in self.requests[ip] if ts > cutoff]
                if valid:
                    self.requests[ip] = valid
                else:
                    self.requests.pop(ip, None)
            self.last_cleanup = now

    def check(self, key: str, max_requests: int) -> tuple[bool, int, int]:
        now = time.monotonic()
        self._cleanup_expired(now)
        cutoff = now - self.window_seconds

        timestamps = [ts for ts in self.requests[key] if ts > cutoff]
        remaining = max_requests - len(timestamps)

        if remaining <= 0:
            retry_after = int(self.window_seconds - (now - timestamps[0])) if timestamps else int(self.window_seconds)
            return False, 0, max(1, retry_after)

        timestamps.append(now)
        self.requests[key] = timestamps
        return True, remaining - 1, 0


# Separate rate limiters for sensitive auth and general API
_auth_limiter = SlidingWindowRateLimiter(window_seconds=60.0)      # 20 attempts/min
_general_limiter = SlidingWindowRateLimiter(window_seconds=60.0)   # 180 requests/min


def _get_client_ip(request: Request) -> str:
    """Extract real client IP safely, accounting for standard proxy headers."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


class BotShieldMiddleware(BaseHTTPMiddleware):
    """Protects against automated malicious bots, scanners, and DoS payloads."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path.lower()

        # 1. Block common exploit probes immediately with 404 (no DB or routing overhead)
        for prefix in EXPLOIT_PROBE_PREFIXES:
            if path.startswith(prefix):
                return JSONResponse(status_code=404, content={"detail": "Not found"})

        # 2. Block known malicious vulnerability scanner User-Agents
        user_agent = request.headers.get("user-agent", "")
        if user_agent and MALICIOUS_BOT_PATTERN.search(user_agent):
            return JSONResponse(
                status_code=403,
                content={"detail": "Access forbidden: automated vulnerability scanner detected"},
            )

        # 3. Payload size enforcement to prevent memory bombing attacks
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > MAX_CONTENT_LENGTH:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": f"Payload too large. Maximum permitted request size is {MAX_CONTENT_LENGTH // (1024 * 1024)}MB."},
                    )
            except ValueError:
                pass

        # 4. Rate Limiting for API routes
        if path.startswith("/api/"):
            client_ip = _get_client_ip(request)

            # Strict bucket for login / register to mitigate brute force & credential stuffing
            if path.startswith(("/api/auth/login", "/api/auth/register")):
                max_req = 20
                allowed, remaining, retry_after = _auth_limiter.check(client_ip, max_requests=max_req)
            else:
                max_req = 180
                allowed, remaining, retry_after = _general_limiter.check(client_ip, max_requests=max_req)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Bot traffic mitigation active. Please try again shortly."},
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(max_req),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(max_req)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            # Ensure API responses aren't cached by intermediate proxy bots
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Server"] = "Klarity-Gateway"
            return response

        return await call_next(request)

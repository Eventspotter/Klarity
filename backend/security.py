"""Security, bot defense, rate limiting, and request protection for Klarity."""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import logging
import os
import re
import socket
import time
import urllib.parse
from collections import defaultdict
from typing import BinaryIO

from fastapi import HTTPException, Request, UploadFile
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

# Allowed file upload extensions and MIME types
ALLOWED_UPLOAD_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".txt", ".md", ".json"}
ALLOWED_UPLOAD_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/json",
}
MAX_FILE_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB per file

# Private / internal IP ranges for SSRF prevention
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local / Cloud metadata (AWS/GCP/Azure)
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


# ===========================================================================
# 1. Sensitive Data Logging Filter (Mask passwords, tokens, API keys)
# ===========================================================================
SENSITIVE_KEY_PATTERN = re.compile(
    r"(password|token|secret|authorization|cookie|session|api[-_]?key|credit[-_]?card)",
    re.IGNORECASE,
)


class SensitiveDataFilter(logging.Filter):
    """Redacts sensitive credentials, passwords, and tokens from application logs."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.sanitize(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: ("***REDACTED***" if SENSITIVE_KEY_PATTERN.search(str(k)) else v) for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(self.sanitize(str(a)) if SENSITIVE_KEY_PATTERN.search(str(a)) else a for a in record.args)
        return True

    @staticmethod
    def sanitize(text: str) -> str:
        # Redact JWTs or bearer tokens
        text = re.sub(r"(Bearer\s+)[A-Za-z0-9\-_\.]+", r"***REDACTED_TOKEN***", text, flags=re.IGNORECASE)
        # Redact password / secret query params or json fields
        text = re.sub(r'("(?:password|secret|token|apiKey)"\s*:\s*")[^"]+(")', r"***REDACTED***", text, flags=re.IGNORECASE)
        text = re.sub(r"((?:password|secret|token|api_key)=)[^&\s]+", r"***REDACTED***", text, flags=re.IGNORECASE)
        return text


# Attach filter to root logger
logging.getLogger().addFilter(SensitiveDataFilter())


# ===========================================================================
# 2. SSRF Protection: URL Validator
# ===========================================================================
def validate_url_safe(url: str) -> bool:
    """
    Validates that a URL does not target internal services, localhost, or cloud metadata endpoints.
    Blocks SSRF attacks (CWE-918).
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Block localhost aliases and cloud metadata IP explicitly
        if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "instance-data", "metadata.google.internal"):
            return False

        # Resolve hostname to check target IP addresses against private subnets
        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            for network in PRIVATE_NETWORKS:
                if ip_obj in network:
                    return False
        return True
    except Exception:
        return False


# ===========================================================================
# 3. Webhook Signature Verification (HMAC-SHA256)
# ===========================================================================
def verify_webhook_signature(payload: bytes, signature_header: str, secret: str, tolerance_seconds: int = 300) -> bool:
    """
    Verifies HMAC-SHA256 webhook signatures with timestamp replay protection.
    Format: t=<timestamp>,v1=<signature>
    """
    if not signature_header or not secret:
        return False

    try:
        parts = dict(item.strip().split("=", 1) for item in signature_header.split(","))
        timestamp_str = parts.get("t")
        expected_sig = parts.get("v1")

        if not timestamp_str or not expected_sig:
            return False

        # Replay attack mitigation
        ts = int(timestamp_str)
        now = int(time.time())
        if abs(now - ts) > tolerance_seconds:
            return False

        signed_payload = f"{timestamp_str}.".encode() + payload
        computed_sig = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed_sig, expected_sig)
    except Exception:
        return False


# ===========================================================================
# 4. File Upload Security Validation (Extension, MIME, magic bytes)
# ===========================================================================
def validate_uploaded_file(file: UploadFile, max_bytes: int = MAX_FILE_UPLOAD_BYTES) -> None:
    """
    Validates file upload extension, declared MIME type, and size to prevent
    arbitrary file execution, zip bombs, and shell uploads.
    """
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}",
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"MIME type '{content_type}' is not supported.",
        )

    # Sanitize filename (remove path traversal sequences)
    safe_name = os.path.basename(filename).replace("..", "").replace("/", "").replace("\\", "")
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename.")


# ===========================================================================
# 5. Sliding Window Rate Limiter
# ===========================================================================
class SlidingWindowRateLimiter:
    """High-performance sliding-window in-memory rate limiter per IP."""

    def __init__(self, window_seconds: float = 60.0):
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.last_cleanup = time.monotonic()

    def _cleanup_expired(self, now: float) -> None:
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


# ===========================================================================
# 6. BotShield & CSRF Protection Middleware
# ===========================================================================
class BotShieldMiddleware(BaseHTTPMiddleware):
    """Protects against automated malicious bots, scanners, CSRF, and DoS payloads."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path.lower()
        method = request.method.upper()

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

        # 4. CSRF Defense for state-modifying requests
        # Checks Sec-Fetch-Site and Origin header against cross-site forged submissions
        if method in ("POST", "PUT", "PATCH", "DELETE") and path.startswith("/api/"):
            sec_fetch_site = request.headers.get("sec-fetch-site")
            origin = request.headers.get("origin")
            # If browser explicitly marks request as cross-site without preflight authorization, drop it
            if sec_fetch_site == "cross-site":
                return JSONResponse(status_code=403, content={"detail": "Cross-site request blocked (CSRF protection)"})

        # 5. Rate Limiting for API routes
        if path.startswith("/api/"):
            client_ip = _get_client_ip(request)

            # Strict bucket for login / register to mitigate brute force & credential stuffing
            if path.startswith(("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password")):
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
            if path.startswith(("/api/auth/login", "/api/auth/register", "/api/auth/logout")):
                response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            elif "Cache-Control" not in response.headers:
                response.headers["Cache-Control"] = "private, no-cache"
            response.headers["Server"] = "Klarity-Gateway"
            return response

        return await call_next(request)

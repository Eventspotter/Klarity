"""Email OTP verification service for Klarity.

Sends a 6-digit OTP to the user's registered email via Gmail SMTP,
stores it hashed in the database, and verifies it on login.
"""

from __future__ import annotations

import hashlib
import os
import random
import smtplib
import ssl
import string
import threading
import time
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session

from database import Base

# Ensure .env is loaded regardless of current working directory
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


# ---------------------------------------------------------------------------
# OTP Database Model
# ---------------------------------------------------------------------------

class OTPRecord(Base):
    __tablename__ = "otp_records"
    id = Column(Integer, primary_key=True)
    email = Column(String(254), nullable=False, index=True)
    otp_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    used = Column(Integer, nullable=False, default=0)  # 0=unused, 1=used


# ---------------------------------------------------------------------------
# Dynamic Config Getters
# ---------------------------------------------------------------------------

def get_smtp_host() -> str:
    return os.getenv("SMTP_HOST", "smtp.gmail.com").strip()


def get_smtp_port() -> int:
    try:
        return int(os.getenv("SMTP_PORT", "587").strip())
    except ValueError:
        return 587


def get_smtp_email() -> str:
    return (
        os.getenv("SMTP_EMAIL", "")
        or os.getenv("GMAIL_SENDER_EMAIL", "")
        or "goklarity@gmail.com"
    ).strip()


def get_smtp_password() -> str:
    raw = (
        os.getenv("SMTP_PASSWORD", "")
        or os.getenv("GMAIL_APP_PASSWORD", "")
    ).strip()
    # Remove surrounding quotes and spaces that users often copy from Google's 4-group format
    raw = raw.strip("'\"").replace(" ", "")
    if raw in ("YOUR_GMAIL_APP_PASSWORD_HERE", "YOUR_APP_PASSWORD_HERE", ""):
        return ""
    return raw


def get_otp_from_name() -> str:
    return os.getenv("OTP_FROM_NAME", "Klarity").strip()


OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def generate_otp(length: int = 6) -> str:
    """Generate a random 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


# ---------------------------------------------------------------------------
# Rate-limit: in-memory tracker (resets on restart)
# ---------------------------------------------------------------------------

_rate_limit: dict[str, list[float]] = {}
_rate_lock = threading.Lock()
RATE_WINDOW = 300  # 5 minutes
RATE_MAX_SENDS = 8  # max OTP requests per email in that window


def _check_rate_limit(email: str) -> bool:
    now = time.time()
    with _rate_lock:
        timestamps = _rate_limit.get(email, [])
        timestamps = [t for t in timestamps if now - t < RATE_WINDOW]
        if len(timestamps) >= RATE_MAX_SENDS:
            return False
        timestamps.append(now)
        _rate_limit[email] = timestamps
        return True


# ---------------------------------------------------------------------------
# Email Builder & Sender
# ---------------------------------------------------------------------------

def _build_otp_email(to_email: str, otp: str, from_email: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Klarity verification code: {otp}"
    msg["From"] = f"{get_otp_from_name()} <{from_email}>"
    msg["To"] = to_email

    plain = f"""\
Hello,

Your Klarity verification code is: {otp}

This code expires in {OTP_EXPIRY_MINUTES} minutes. Enter this code on the verification screen to sign in.

If you did not request this code, you can safely ignore this email.

— The Klarity Team
"""

    html = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f7f4;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #eaeaea;">
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin-bottom:12px;">
        <span style="font-size:26px;font-weight:700;color:#fff;">K</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Klarity</h1>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">Verification Code</h2>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.5;">
        Use the 6-digit code below to securely sign in to your Klarity workspace:
      </p>
      <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1d4ed8;font-family:Consolas,Monaco,monospace;">{otp}</span>
      </div>
      <p style="margin:0 0 6px;color:#6b7280;font-size:12.5px;">⏱ Valid for <strong>{OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't request this code, no action is needed.</p>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;color:#9ca3af;font-size:11px;">
      &copy; 2026 Klarity · Brand Consistency &amp; Governance Platform
    </div>
  </div>
</body>
</html>
"""
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def send_otp_email(to_email: str, otp: str) -> tuple[bool, str]:
    """Attempt to send the OTP email via Gmail SMTP (port 587 or port 465).

    Returns (success, status_description).
    """
    sender = get_smtp_email()
    password = get_smtp_password()
    host = get_smtp_host()
    port = get_smtp_port()

    if not password:
        log_msg = f"SMTP credentials not set. OTP for {to_email} is: {otp}"
        print(f"[OTP Dev Mode] {log_msg}")
        return False, "SMTP_PASSWORD not configured"

    msg = _build_otp_email(to_email, otp, sender)

    # Strategy 1: Try STARTTLS (port 587 default)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(sender, password)
            server.sendmail(sender, [to_email], msg.as_string())
        print(f"[OTP] Successfully sent email to {to_email} via STARTTLS {host}:{port}")
        return True, "Sent via STARTTLS"
    except Exception as e1:
        print(f"[OTP STARTTLS error]: {e1}")

    # Strategy 2: Fallback to SSL (port 465) if 587 fails
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, 465, context=context, timeout=12) as server:
            server.login(sender, password)
            server.sendmail(sender, [to_email], msg.as_string())
        print(f"[OTP] Successfully sent email to {to_email} via SSL {host}:465")
        return True, "Sent via SSL"
    except Exception as e2:
        err_msg = f"Failed to send email to {to_email}: {e2}"
        print(f"[OTP SSL error]: {err_msg}")
        return False, str(e2)


# ---------------------------------------------------------------------------
# OTP Lifecycle: create, verify, cleanup
# ---------------------------------------------------------------------------

def create_otp(db: Session, email: str) -> dict:
    """Generate OTP, save hash in database, send via email if possible.

    Returns a dict with success, message, email_sent, and optional dev_otp.
    """
    email = email.strip().lower()

    if not _check_rate_limit(email):
        return {
            "success": False,
            "message": "Too many OTP requests. Please wait a few minutes.",
            "email_sent": False,
        }

    # Delete any existing unused OTPs for this email
    db.query(OTPRecord).filter(
        OTPRecord.email == email,
        OTPRecord.used == 0,
    ).delete()
    db.flush()

    otp = generate_otp()
    now = datetime.utcnow()
    record = OTPRecord(
        email=email,
        otp_hash=_hash_otp(otp),
        created_at=now,
        expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
        attempts=0,
        used=0,
    )
    db.add(record)
    db.commit()

    sent, detail = send_otp_email(email, otp)
    from_addr = get_smtp_email()

    if sent:
        return {
            "success": True,
            "message": f"Verification code sent to {email}. Please check your inbox or spam folder.",
            "email_sent": True,
            "from_email": from_addr,
        }
    else:
        # Email couldn't be dispatched via SMTP (e.g. missing App Password on Render/local)
        # Always return the OTP in dev_otp so the user can test and sign in without being blocked!
        return {
            "success": True,
            "message": f"Code generated for {email}. (SMTP relay offline or pending Google App Password).",
            "email_sent": False,
            "dev_otp": otp,
            "from_email": from_addr,
        }


def verify_otp(db: Session, email: str, otp: str) -> tuple[str, bool]:
    """Verify an OTP. Returns (message, success)."""
    email = email.strip().lower()
    otp = otp.strip()

    record = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.email == email,
            OTPRecord.used == 0,
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )

    if not record:
        return "No verification code found. Please request a new one.", False

    if record.expires_at < datetime.utcnow():
        record.used = 1
        db.commit()
        return "Verification code has expired. Please request a new one.", False

    if record.attempts >= OTP_MAX_ATTEMPTS:
        record.used = 1
        db.commit()
        return "Too many incorrect attempts. Please request a new code.", False

    if _hash_otp(otp) != record.otp_hash:
        record.attempts += 1
        db.commit()
        remaining = OTP_MAX_ATTEMPTS - record.attempts
        return f"Incorrect code. {remaining} attempt(s) remaining.", False

    # Mark as used
    record.used = 1
    db.commit()
    return "Verification successful.", True


def cleanup_expired_otps(db: Session):
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    db.query(OTPRecord).filter(OTPRecord.expires_at < cutoff).delete()
    db.commit()

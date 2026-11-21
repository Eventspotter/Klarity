"""Email OTP verification service for Klarity.

Sends a 6-digit OTP to the user's registered email via Gmail SMTP,
stores it hashed in the database, and verifies it on login.
"""

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

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session

from database import Base


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
# Config — reads from environment or .env
# ---------------------------------------------------------------------------

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")       # e.g. goklarity@gmail.com
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # Gmail App Password (16-char)
OTP_FROM_NAME = os.getenv("OTP_FROM_NAME", "Klarity")
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


# ---------------------------------------------------------------------------
# Rate-limit: in-memory tracker (simple, resets on restart)
# ---------------------------------------------------------------------------

_rate_limit: dict[str, list[float]] = {}
_rate_lock = threading.Lock()
RATE_WINDOW = 300  # 5 minutes
RATE_MAX_SENDS = 5  # max OTPs per email in that window


def _check_rate_limit(email: str) -> bool:
    """Return True if the email is within rate limits."""
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
# Email sending
# ---------------------------------------------------------------------------

def _build_otp_email(to_email: str, otp: str) -> MIMEMultipart:
    """Build a nicely formatted HTML email with the OTP code."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Klarity verification code: {otp}"
    msg["From"] = f"{OTP_FROM_NAME} <{SMTP_EMAIL}>"
    msg["To"] = to_email

    plain = f"""\
Your Klarity verification code is: {otp}

This code expires in {OTP_EXPIRY_MINUTES} minutes.

If you didn't request this, please ignore this email.

— Klarity Team
"""

    html = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f7f4;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#2d5a3d,#3a7a52);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px;">
        <span style="font-size:24px;font-weight:700;color:#fff;">K</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">Klarity</h1>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">Enter Verification Code</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5;">
        Use the 6-digit code below to sign in to your Klarity workspace.
      </p>
      <div style="background:#f0faf4;border:2px dashed #2d5a3d;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#2d5a3d;font-family:monospace;">{otp}</span>
      </div>
      <p style="margin:0 0 4px;color:#999;font-size:12px;">⏱ This code expires in <strong>{OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="margin:0;color:#999;font-size:12px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div style="border-top:1px solid #eee;padding:16px 24px;text-align:center;color:#bbb;font-size:11px;">
      &copy; 2026 Klarity · Brand Governance Platform
    </div>
  </div>
</body>
</html>
"""
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def send_otp_email(to_email: str, otp: str) -> bool:
    """Send OTP email via Gmail SMTP. Returns True on success."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[OTP] SMTP not configured. OTP for {to_email}: {otp}")
        return False

    try:
        msg = _build_otp_email(to_email, otp)
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"[OTP] Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[OTP] Failed to send email to {to_email}: {e}")
        return False


# ---------------------------------------------------------------------------
# OTP lifecycle (create, verify, cleanup)
# ---------------------------------------------------------------------------

def create_otp(db: Session, email: str) -> tuple[str, bool]:
    """Generate OTP, store in DB, send via email.

    Returns (message, success).
    """
    email = email.strip().lower()

    if not _check_rate_limit(email):
        return "Too many OTP requests. Please wait a few minutes.", False

    # Invalidate any existing unused OTPs for this email
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

    sent = send_otp_email(email, otp)
    if not sent and SMTP_EMAIL and SMTP_PASSWORD:
        return "Failed to send verification email. Please try again.", False
    if not sent:
        return f"SMTP not configured. OTP (dev): {otp}", True  # dev fallback

    return "Verification code sent to your email.", True


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

    # Success — mark as used
    record.used = 1
    db.commit()
    return "Verification successful.", True


def cleanup_expired_otps(db: Session):
    """Remove expired OTP records (call periodically)."""
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    db.query(OTPRecord).filter(OTPRecord.expires_at < cutoff).delete()
    db.commit()

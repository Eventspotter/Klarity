"""Server configuration; credentials stay outside the frontend."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///" + (Path(__file__).resolve().parent / "klarity.db").as_posix()
)
# Automatically resolve IPv6-only Supabase direct host to IPv4 connection pooler (Render is IPv4 only)
if "db.fldqzetudzkzutwftvmn.supabase.co" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace(
        "db.fldqzetudzkzutwftvmn.supabase.co", "aws-0-ap-northeast-1.pooler.supabase.com"
    )
    if "postgres:" in DATABASE_URL and "postgres.fldqzetudzkzutwftvmn" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgres:", "postgres.fldqzetudzkzutwftvmn:", 1)

# Normalize Postgres URI for SQLAlchemy (e.g. postgres:// or postgresql:// to postgresql+psycopg2://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000,https://klarity-frontend.onrender.com",
    ).split(",")
    if origin.strip()
]

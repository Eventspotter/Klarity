"""SQLite persistence for the standalone Klarity server."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import DATABASE_URL

is_sqlite = "sqlite" in DATABASE_URL
connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)
engine_kwargs = {"connect_args": connect_args, "pool_pre_ping": True}
if not is_sqlite:
    engine_kwargs.update({"pool_size": 10, "max_overflow": 15, "pool_recycle": 300, "pool_timeout": 15})

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def warm_pool():
    if is_sqlite:
        return
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        pass


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import models  # Register all models before creating tables.
    import auth
    import services.email_otp  # Register OTP model
    from sqlalchemy import text

    Base.metadata.create_all(bind=engine)

    # Automatic schema & index migration for existing databases
    index_ddl = [
        "CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON content_submissions (submitted_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_submissions_status ON content_submissions (status)",
        "CREATE INDEX IF NOT EXISTS idx_review_reports_submission_id ON review_reports (submission_id)",
        "CREATE INDEX IF NOT EXISTS idx_review_issues_report_id ON review_issues (report_id)",
        "CREATE INDEX IF NOT EXISTS idx_review_actions_report_id ON review_actions (report_id)",
        "CREATE INDEX IF NOT EXISTS idx_login_sessions_expires_at ON login_sessions (expires_at)",
        "CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts (username)",
        "CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts (email)",
        "CREATE INDEX IF NOT EXISTS idx_accounts_brand ON accounts (brand_name)",
        "CREATE INDEX IF NOT EXISTS idx_login_sessions_account_id ON login_sessions (account_id)",
    ]
    with engine.connect() as conn:
        try:
            if is_sqlite:
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(accounts)")).fetchall()]
                if cols:
                    if "role" not in cols:
                        conn.execute(text("ALTER TABLE accounts ADD COLUMN role VARCHAR(30) DEFAULT 'owner'"))
                    if "is_approved" not in cols:
                        conn.execute(text("ALTER TABLE accounts ADD COLUMN is_approved BOOLEAN DEFAULT 1"))
                    if "brand_name" not in cols:
                        conn.execute(text("ALTER TABLE accounts ADD COLUMN brand_name VARCHAR(120)"))
                    if "is_demo" not in cols:
                        conn.execute(text("ALTER TABLE accounts ADD COLUMN is_demo BOOLEAN DEFAULT 0"))
                    if "full_name" not in cols:
                        conn.execute(text("ALTER TABLE accounts ADD COLUMN full_name VARCHAR(120)"))

                bg_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(brand_guidelines)")).fetchall()]
                if bg_cols and "brand_name" not in bg_cols:
                    conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN brand_name VARCHAR(120) DEFAULT 'Aster & Oak'"))

                cs_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(content_submissions)")).fetchall()]
                if cs_cols and "brand_name" not in cs_cols:
                    conn.execute(text("ALTER TABLE content_submissions ADD COLUMN brand_name VARCHAR(120) DEFAULT 'Aster & Oak'"))
            else:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'owner'"))
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE"))
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS brand_name VARCHAR(120)"))
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE"))
                conn.execute(text("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS full_name VARCHAR(120)"))
                conn.execute(text("ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS brand_name VARCHAR(120) DEFAULT 'Aster & Oak'"))
                conn.execute(text("ALTER TABLE content_submissions ADD COLUMN IF NOT EXISTS brand_name VARCHAR(120) DEFAULT 'Aster & Oak'"))
            for stmt in index_ddl:
                try:
                    conn.execute(text(stmt))
                except Exception:
                    pass
            conn.commit()
        except Exception:
            pass

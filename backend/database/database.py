from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# ============================================================
# DATABASE
# ============================================================

DATABASE_URL = "sqlite:///./clipforge.db"


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# INIT DATABASE
# ============================================================

def init_db():

    # ========================================================
    # IMPORT MODELS
    # ========================================================

    from backend.models.user import User
    from backend.models.project import Project
    from backend.models.production import ProductionJob
    from backend.models.plan import Plan
    from backend.models.credit_transaction import CreditTransaction

    # ========================================================
    # CREATE TABLES
    # ========================================================

    Base.metadata.create_all(
        bind=engine
    )

    # ========================================================
    # SQLITE MIGRATIONS
    # ========================================================

    migrations = [

        # ----------------------------------------------------
        # PLANS
        # ----------------------------------------------------

        (
            "plans",
            "monthly_ai_credits",
            """
            ALTER TABLE plans
            ADD COLUMN monthly_ai_credits INTEGER
            NOT NULL DEFAULT 100
            """,
        ),

        (
            "plans",
            "storage_limit_gb",
            """
            ALTER TABLE plans
            ADD COLUMN storage_limit_gb FLOAT
            NOT NULL DEFAULT 1.0
            """,
        ),

        # ----------------------------------------------------
        # YEARLY PRICING
        # ----------------------------------------------------

        (
            "plans",
            "yearly_price",
            """
            ALTER TABLE plans
            ADD COLUMN yearly_price FLOAT
            NOT NULL DEFAULT 0
            """,
        ),

        (
            "plans",
            "yearly_discount",
            """
            ALTER TABLE plans
            ADD COLUMN yearly_discount INTEGER
            NOT NULL DEFAULT 0
            """,
        ),

        # ----------------------------------------------------
        # USERS
        # ----------------------------------------------------

        (
            "users",
            "ai_credits",
            """
            ALTER TABLE users
            ADD COLUMN ai_credits INTEGER
            NOT NULL DEFAULT 100
            """,
        ),

        (
            "users",
            "credits_reset_at",
            """
            ALTER TABLE users
            ADD COLUMN credits_reset_at DATETIME
            """,
        ),

        (
    "credit_transactions",
    "job_id",
    """
    ALTER TABLE credit_transactions
    ADD COLUMN job_id INTEGER
    """,
),

    ]


    # ========================================================
    # RUN MIGRATIONS
    # ========================================================

    with engine.connect() as conn:

        for (
            table_name,
            column_name,
            sql,
        ) in migrations:

            try:

                conn.exec_driver_sql(sql)

                conn.commit()

                print(
                    f"MIGRATION ADDED: "
                    f"{table_name}.{column_name}"
                )

            except Exception:

                # Column already exists.
                pass
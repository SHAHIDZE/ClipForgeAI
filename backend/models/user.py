from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
)
from sqlalchemy.sql import func

from backend.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String,
        unique=True,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    password = Column(
        String,
        nullable=False,
        default="",
    )

    google_id = Column(
        String,
        unique=True,
        nullable=True,
    )

    auth_provider = Column(
        String,
        default="local",
        nullable=False,
    )

    # ========================================================
    # PLAN
    # ========================================================

    plan = Column(
        String,
        default="free",
        nullable=False,
    )

    # ========================================================
    # AI CREDITS
    # ========================================================

    ai_credits = Column(
        Integer,
        default=100,
        nullable=False,
    )

    credits_reset_at = Column(
        DateTime,
        nullable=True,
    )

    # ========================================================
    # ROLE
    # ========================================================

    role = Column(
        String,
        default="user",
        nullable=False,
    )

    # ========================================================
    # STATUS
    # ========================================================

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )
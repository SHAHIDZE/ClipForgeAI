from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
)
from sqlalchemy.sql import func

from backend.database.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # IDENTITY
    # ========================================================

    name = Column(
        String(50),
        nullable=False,
        index=True,
    )

    display_name = Column(
        String(100),
        nullable=False,
    )

    # ========================================================
    # BILLING
    # ========================================================

    billing_interval = Column(
        String(20),
        nullable=False,
        default="monthly",
    )

    price = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    # ========================================================
    # AI CREDITS
    # ========================================================

    monthly_ai_credits = Column(
        Integer,
        nullable=False,
        default=100,
    )

    # ========================================================
    # VIDEO LIMITS
    # ========================================================

    monthly_video_limit = Column(
        Integer,
        nullable=False,
        default=10,
    )

    max_video_duration = Column(
        Integer,
        nullable=False,
        default=15,
    )

    max_shorts_per_video = Column(
        Integer,
        nullable=False,
        default=10,
    )

    # ========================================================
    # STORAGE
    # ========================================================

    storage_limit_gb = Column(
        Float,
        nullable=False,
        default=1.0,
    )

    # ========================================================
    # FEATURES
    # ========================================================

    features = Column(
        Text,
        nullable=False,
        default="[]",
    )

    # ========================================================
    # STATUS
    # ========================================================

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
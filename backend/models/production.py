from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)

from datetime import datetime

from backend.database.database import Base


class ProductionJob(Base):
    __tablename__ = "production_jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )

    task_id = Column(
        String,
        nullable=True,
        index=True,
    )

    status = Column(
        String,
        default="queued",
        nullable=False,
    )

    step = Column(
        String,
        default="queued",
        nullable=False,
    )

    progress = Column(
        Float,
        default=0,
        nullable=False,
    )

    generated = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total = Column(
        Integer,
        default=10,
        nullable=False,
    )

    start_time = Column(
        Float,
        default=0,
        nullable=False,
    )

    end_time = Column(
        Float,
        default=0,
        nullable=False,
    )

    error = Column(
        Text,
        nullable=True,
    )

    files = Column(
        Text,
        nullable=True,
        default="[]",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
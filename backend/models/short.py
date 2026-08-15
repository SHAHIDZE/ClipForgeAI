from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Float,
)

from datetime import datetime

from backend.database.database import Base


class Short(Base):

    __tablename__ = "shorts"

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

    production_job_id = Column(
        Integer,
        ForeignKey("production_jobs.id"),
        nullable=True,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    title = Column(
        String,
        nullable=True,
    )

    duration = Column(
        Float,
        default=0,
        nullable=False,
    )

    status = Column(
        String,
        default="completed",
        nullable=False,
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
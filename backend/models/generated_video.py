from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from datetime import datetime

from backend.database.database import Base


class GeneratedVideo(Base):

    __tablename__ = "generated_videos"

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

    production_id = Column(
        Integer,
        ForeignKey("production_jobs.id"),
        nullable=True,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    duration = Column(
        Float,
        default=0,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
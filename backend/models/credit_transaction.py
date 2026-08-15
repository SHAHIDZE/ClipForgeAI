from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
)

from backend.database.database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    job_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    amount = Column(
        Integer,
        nullable=False,
    )

    transaction_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
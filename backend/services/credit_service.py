import math
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.models.user import User
from backend.models.plan import Plan
from backend.models.credit_transaction import CreditTransaction


# ============================================================
# CREDIT RULE
# ============================================================

SECONDS_PER_CREDIT = 60


# ============================================================
# GENERATION CREDIT CALCULATOR
# ============================================================

def calculate_generation_credits(
    duration_seconds: float,
) -> int:

    if duration_seconds <= 0:
        raise ValueError(
            "Video duration must be greater than 0."
        )

    return max(
        1,
        math.ceil(
            duration_seconds / SECONDS_PER_CREDIT
        ),
    )


# ============================================================
# GET USER PLAN
# ============================================================

def get_user_plan(
    db: Session,
    user: User,
) -> Plan:

    plan_name = (
        user.plan or "free"
    ).strip().lower()

    plan = (
        db.query(Plan)
        .filter(
            Plan.name == plan_name,
            Plan.is_active == True,
        )
        .first()
    )

    if not plan:

        plan = (
            db.query(Plan)
            .filter(
                Plan.name == "free",
                Plan.is_active == True,
            )
            .first()
        )

    if not plan:
        raise ValueError(
            "Free plan is not configured."
        )

    return plan


# ============================================================
# RESET MONTHLY CREDITS
# ============================================================

def reset_user_credits_if_needed(
    db: Session,
    user: User,
) -> bool:

    now = datetime.utcnow()

    if (
        user.credits_reset_at
        and user.credits_reset_at > now
    ):
        return False

    plan = get_user_plan(
        db,
        user,
    )

    credits = int(
        plan.monthly_ai_credits or 0
    )

    user.ai_credits = credits

    user.credits_reset_at = (
        now + timedelta(days=30)
    )

    db.add(
        CreditTransaction(
            user_id=user.id,
            job_id=None,
            amount=credits,
            transaction_type="monthly_reset",
            description=(
                f"Monthly {plan.name} plan "
                f"credit reset"
            ),
        )
    )

    db.commit()
    db.refresh(user)

    return True


# ============================================================
# GET CURRENT BALANCE
# ============================================================

def get_user_credits(
    db: Session,
    user: User,
) -> int:

    reset_user_credits_if_needed(
        db,
        user,
    )

    return max(
        0,
        int(user.ai_credits or 0),
    )


# ============================================================
# CHECK CREDITS
# ============================================================

def has_enough_credits(
    db: Session,
    user: User,
    amount: int,
) -> bool:

    if amount < 0:
        raise ValueError(
            "Credit amount cannot be negative."
        )

    current = get_user_credits(
        db,
        user,
    )

    return current >= amount


# ============================================================
# SPEND GENERATION CREDITS
# ============================================================

def spend_generation_credits(
    db: Session,
    user: User,
    amount: int,
    job_id: int,
    duration_seconds: float,
) -> int:

    if amount <= 0:
        raise ValueError(
            "Credit amount must be greater than 0."
        )

    reset_user_credits_if_needed(
        db,
        user,
    )

    current = int(
        user.ai_credits or 0
    )

    if current < amount:

        raise ValueError(
            f"Not enough AI credits. "
            f"Required: {amount}. "
            f"Available: {current}."
        )

    user.ai_credits = (
        current - amount
    )

    db.add(
        CreditTransaction(
            user_id=user.id,
            job_id=job_id,
            amount=-amount,
            transaction_type="generation_charge",
            description=(
                f"AI generation | "
                f"{duration_seconds:.1f}s | "
                f"{amount} credits"
            ),
        )
    )

    db.commit()
    db.refresh(user)

    print(
        f"CREDIT CHARGE | "
        f"user={user.id} | "
        f"job={job_id} | "
        f"amount={amount} | "
        f"remaining={user.ai_credits}"
    )

    return user.ai_credits


# ============================================================
# REFUND GENERATION CREDITS
# ============================================================

def refund_generation_credits(
    db: Session,
    user_id: int,
    job_id: int,
    reason: str = "Generation failed",
) -> int:

    # --------------------------------------------------------
    # PREVENT DOUBLE REFUND
    # --------------------------------------------------------

    existing_refund = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.job_id == job_id,
            CreditTransaction.transaction_type
            == "generation_refund",
        )
        .first()
    )

    if existing_refund:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        return int(
            user.ai_credits or 0
        )

    # --------------------------------------------------------
    # FIND ORIGINAL CHARGE
    # --------------------------------------------------------

    charge = (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.job_id == job_id,
            CreditTransaction.transaction_type
            == "generation_charge",
        )
        .first()
    )

    if not charge:
        raise ValueError(
            f"Generation charge for job "
            f"{job_id} not found."
        )

    refund_amount = abs(
        int(charge.amount)
    )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ValueError(
            f"User {user_id} not found."
        )

    plan = get_user_plan(
        db,
        user,
    )

    maximum = int(
        plan.monthly_ai_credits or 0
    )

    user.ai_credits = min(
        maximum,
        int(user.ai_credits or 0)
        + refund_amount,
    )

    db.add(
        CreditTransaction(
            user_id=user.id,
            job_id=job_id,
            amount=refund_amount,
            transaction_type="generation_refund",
            description=reason,
        )
    )

    db.commit()
    db.refresh(user)

    print(
        f"CREDIT REFUND | "
        f"user={user.id} | "
        f"job={job_id} | "
        f"amount={refund_amount} | "
        f"remaining={user.ai_credits} | "
        f"reason={reason}"
    )

    return user.ai_credits
from datetime import datetime, timedelta

from backend.database.database import SessionLocal
from backend.models.user import User
from backend.models.plan import Plan


def sync_user_credits():
    db = SessionLocal()

    try:
        users = (
            db.query(User)
            .order_by(User.id)
            .all()
        )

        print()
        print("========================================")
        print("SYNC USER CREDITS")
        print("========================================")
        print()

        for user in users:

            plan_name = (
                user.plan or "free"
            ).strip().lower()

            plan = (
                db.query(Plan)
                .filter(
                    Plan.name == plan_name
                )
                .first()
            )

            if not plan:
                plan = (
                    db.query(Plan)
                    .filter(
                        Plan.name == "free"
                    )
                    .first()
                )

            if not plan:
                print(
                    f"SKIPPED USER {user.id}: "
                    "Free plan not found"
                )
                continue

            user.ai_credits = (
                plan.monthly_ai_credits
            )

            user.credits_reset_at = (
                datetime.utcnow()
                + timedelta(days=30)
            )

            print(
                f"USER {user.id} | "
                f"{user.username} | "
                f"{plan.display_name} | "
                f"{user.ai_credits} credits"
            )

        db.commit()

        print()
        print("========================================")
        print("USER CREDITS SYNCED")
        print("========================================")

    except Exception as error:

        db.rollback()

        print(
            "SYNC ERROR:",
            error,
        )

        raise

    finally:
        db.close()


if __name__ == "__main__":
    sync_user_credits()
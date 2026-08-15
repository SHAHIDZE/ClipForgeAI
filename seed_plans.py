from datetime import datetime

from backend.database.database import SessionLocal, init_db
from backend.models.plan import Plan


init_db()

db = SessionLocal()

try:
    plans = [
        Plan(
            name="free",
            display_name="Free",
            price=0.0,
            monthly_video_limit=10,
            max_video_duration=15 * 60,
            max_shorts_per_video=10,
            features='["10 AI Shorts / month", "1 GB storage", "Max video 15 min"]',
            storage_limit_gb=1.0,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ),
        Plan(
            name="pro",
            display_name="Pro",
            price=9.0,
            monthly_video_limit=100,
            max_video_duration=60 * 60,
            max_shorts_per_video=10,
            features='["100 AI Shorts / month", "25 GB storage", "Max video 60 min"]',
            storage_limit_gb=25.0,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ),
        Plan(
            name="business",
            display_name="Business",
            price=29.0,
            monthly_video_limit=500,
            max_video_duration=120 * 60,
            max_shorts_per_video=10,
            features='["500 AI Shorts / month", "100 GB storage", "Max video 120 min"]',
            storage_limit_gb=100.0,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ),
        Plan(
            name="enterprise",
            display_name="Enterprise",
            price=99.0,
            monthly_video_limit=2000,
            max_video_duration=240 * 60,
            max_shorts_per_video=10,
            features='["2,000 AI Shorts / month", "500 GB storage", "Max video 240 min"]',
            storage_limit_gb=500.0,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ),
    ]

    for plan in plans:
        existing = db.query(Plan).filter(Plan.name == plan.name).first()

        if existing:
            print(f"Already exists: {plan.name}")
        else:
            db.add(plan)
            print(f"Added: {plan.name}")

    db.commit()

    print("\nPlans successfully seeded!")

    for plan in db.query(Plan).order_by(Plan.id).all():
        print(
            f"ID={plan.id} | "
            f"{plan.display_name} | "
            f"${plan.price} | "
            f"{plan.monthly_video_limit} shorts/month | "
            f"{plan.storage_limit_gb} GB | "
            f"{plan.max_video_duration // 60} min"
        )

except Exception:
    db.rollback()
    raise

finally:
    db.close()
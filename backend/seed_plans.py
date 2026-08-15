import json

from backend.database.database import SessionLocal
from backend.models.plan import Plan


# ============================================================
# CLIPFORGE PLANS
# ============================================================

PLANS = [

    # ========================================================
    # FREE
    # ========================================================

    {
        "name": "free",
        "display_name": "Free",
        "billing_interval": "monthly",
        "price": 0.0,

        "monthly_ai_credits": 100,

        "monthly_video_limit": 10,
        "max_video_duration": 15,
        "max_shorts_per_video": 10,

        "storage_limit_gb": 1.0,

        "features": [
            "100 AI credits per month",
            "1 credit = 1 minute AI processing",
            "AI highlight detection",
            "Basic AI captions",
            "720p export",
            "Basic AI editor",
            "Limited projects",
            "ClipForge watermark",
        ],
    },

    # ========================================================
    # PRO MONTHLY
    # ========================================================

    {
        "name": "pro_monthly",
        "display_name": "Pro",
        "billing_interval": "monthly",
        "price": 9.99,

        "monthly_ai_credits": 500,

        "monthly_video_limit": 100,
        "max_video_duration": 60,
        "max_shorts_per_video": 20,

        "storage_limit_gb": 25.0,

        "features": [
            "500 AI credits per month",
            "1 credit = 1 minute AI processing",
            "Advanced AI clipping",
            "Advanced captions",
            "1080p export",
            "No watermark",
            "Multiple aspect ratios",
            "Advanced AI editor",
            "Priority processing",
            "Custom fonts",
        ],
    },

    # ========================================================
    # PRO YEARLY
    # ========================================================

    {
        "name": "pro_yearly",
        "display_name": "Pro",
        "billing_interval": "yearly",
        "price": 99.0,

        "monthly_ai_credits": 500,

        "monthly_video_limit": 100,
        "max_video_duration": 60,
        "max_shorts_per_video": 20,

        "storage_limit_gb": 25.0,

        "features": [
            "500 AI credits per month",
            "1 credit = 1 minute AI processing",
            "Advanced AI clipping",
            "Advanced captions",
            "1080p export",
            "No watermark",
            "Multiple aspect ratios",
            "Advanced AI editor",
            "Priority processing",
            "Custom fonts",
            "Yearly billing discount",
        ],
    },

    # ========================================================
    # BUSINESS MONTHLY
    # ========================================================

    {
        "name": "business_monthly",
        "display_name": "Business",
        "billing_interval": "monthly",
        "price": 24.99,

        "monthly_ai_credits": 2000,

        "monthly_video_limit": 500,
        "max_video_duration": 120,
        "max_shorts_per_video": 50,

        "storage_limit_gb": 100.0,

        "features": [
            "2,000 AI credits per month",
            "1 credit = 1 minute AI processing",
            "Everything in Pro",
            "Priority project processing",
            "Team workspace",
            "Brand templates",
            "Custom fonts",
            "Advanced exports",
            "100 GB storage",
            "Social media tools",
        ],
    },

    # ========================================================
    # BUSINESS YEARLY
    # ========================================================

    {
        "name": "business_yearly",
        "display_name": "Business",
        "billing_interval": "yearly",
        "price": 249.0,

        "monthly_ai_credits": 2000,

        "monthly_video_limit": 500,
        "max_video_duration": 120,
        "max_shorts_per_video": 50,

        "storage_limit_gb": 100.0,

        "features": [
            "2,000 AI credits per month",
            "1 credit = 1 minute AI processing",
            "Everything in Pro",
            "Priority project processing",
            "Team workspace",
            "Brand templates",
            "Custom fonts",
            "Advanced exports",
            "100 GB storage",
            "Social media tools",
            "Yearly billing discount",
        ],
    },

    # ========================================================
    # ENTERPRISE
    # ========================================================

    {
        "name": "enterprise",
        "display_name": "Enterprise",
        "billing_interval": "custom",
        "price": 0.0,

        "monthly_ai_credits": 10000,

        "monthly_video_limit": 2000,
        "max_video_duration": 240,
        "max_shorts_per_video": 100,

        "storage_limit_gb": 500.0,

        "features": [
            "10,000+ AI credits per month",
            "1 credit = 1 minute AI processing",
            "Everything in Business",
            "Priority processing",
            "Custom credits",
            "Custom team seats",
            "Dedicated storage",
            "API access",
            "Custom integrations",
            "Custom brand assets",
            "Enterprise security",
            "Priority support",
        ],
    },
]


# ============================================================
# SEED
# ============================================================

def seed_plans():

    db = SessionLocal()

    try:

        print()
        print("=" * 60)
        print("CLIPFORGE PLAN SEED")
        print("=" * 60)

        for plan_data in PLANS:

            plan = (
                db.query(Plan)
                .filter(
                    Plan.name
                    == plan_data["name"]
                )
                .first()
            )

            features = json.dumps(
                plan_data["features"]
            )

            if plan:

                plan.display_name = (
                    plan_data["display_name"]
                )

                plan.billing_interval = (
                    plan_data["billing_interval"]
                )

                plan.price = (
                    plan_data["price"]
                )

                plan.monthly_ai_credits = (
                    plan_data[
                        "monthly_ai_credits"
                    ]
                )

                plan.monthly_video_limit = (
                    plan_data[
                        "monthly_video_limit"
                    ]
                )

                plan.max_video_duration = (
                    plan_data[
                        "max_video_duration"
                    ]
                )

                plan.max_shorts_per_video = (
                    plan_data[
                        "max_shorts_per_video"
                    ]
                )

                plan.storage_limit_gb = (
                    plan_data[
                        "storage_limit_gb"
                    ]
                )

                plan.features = features
                plan.is_active = True

                print(
                    f"UPDATED | "
                    f"{plan.name} | "
                    f"${plan.price} | "
                    f"{plan.monthly_ai_credits} credits"
                )

            else:

                plan = Plan(
                    name=plan_data["name"],
                    display_name=(
                        plan_data[
                            "display_name"
                        ]
                    ),
                    billing_interval=(
                        plan_data[
                            "billing_interval"
                        ]
                    ),
                    price=plan_data["price"],
                    monthly_ai_credits=(
                        plan_data[
                            "monthly_ai_credits"
                        ]
                    ),
                    monthly_video_limit=(
                        plan_data[
                            "monthly_video_limit"
                        ]
                    ),
                    max_video_duration=(
                        plan_data[
                            "max_video_duration"
                        ]
                    ),
                    max_shorts_per_video=(
                        plan_data[
                            "max_shorts_per_video"
                        ]
                    ),
                    storage_limit_gb=(
                        plan_data[
                            "storage_limit_gb"
                        ]
                    ),
                    features=features,
                    is_active=True,
                )

                db.add(plan)

                print(
                    f"CREATED | "
                    f"{plan.name} | "
                    f"${plan.price} | "
                    f"{plan.monthly_ai_credits} credits"
                )

        db.commit()

        print()
        print("=" * 60)
        print("PLANS SEEDED SUCCESSFULLY")
        print("=" * 60)
        print()

    except Exception:

        db.rollback()
        raise

    finally:

        db.close()


if __name__ == "__main__":
    seed_plans()
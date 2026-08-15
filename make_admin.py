from backend.database.database import SessionLocal
from backend.models.user import User

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == "test@gmail.com").first()

    if not user:
        print("User topilmadi!")
    else:
        user.role = "admin"
        db.commit()
        db.refresh(user)

        print(f"Admin qilindi: {user.email}")
        print(f"Role: {user.role}")

finally:
    db.close()
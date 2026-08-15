from backend.database.database import SessionLocal
from backend.models.production import ProductionJob
from backend.models.project import Project


db = SessionLocal()

try:
    jobs = (
        db.query(ProductionJob)
        .filter(
            ProductionJob.status.in_(
                ["queued", "processing"]
            )
        )
        .all()
    )

    print(f"Found {len(jobs)} active jobs.")

    for job in jobs:
        print(
            f"Job {job.id}: "
            f"{job.status} -> error"
        )

        job.status = "error"
        job.step = "error"
        job.progress = 0
        job.error = (
            "Processing was interrupted "
            "or the job became stale."
        )

        project = (
            db.query(Project)
            .filter(Project.id == job.project_id)
            .first()
        )

        if project:
            project.status = "error"

    db.commit()

    print("Cleanup completed successfully.")

except Exception as e:
    db.rollback()
    print("Cleanup error:", e)
    raise

finally:
    db.close()
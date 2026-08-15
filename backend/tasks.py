from celery import Celery
import json
import os
import traceback

import whisper
from celery.exceptions import Ignore

from backend.services.ai_service import process_video
from backend.database.database import SessionLocal, Base, engine
from backend.models.production import ProductionJob
from backend.models.project import Project
from backend.models.generated_video import GeneratedVideo

from backend.services.credit_service import (
    refund_generation_credits,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# CELERY
# ============================================================

celery_app = Celery(
    "clipforge",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

# IMPORTANT:
# This worker is intended to process ONE AI video at a time.
# Start the worker with:
# celery -A backend.tasks.celery_app worker --loglevel=info --concurrency=1
celery_app.conf.update(
    task_track_started=True,
    result_expires=86400,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_concurrency=1,
)


# ============================================================
# WHISPER
# ============================================================

print("Loading Whisper model for Celery worker...")
model = whisper.load_model("base")
print("Whisper model loaded for Celery worker.")


# ============================================================
# CUSTOM CANCEL EXCEPTION
# ============================================================

class JobCancelled(Exception):
    """Raised when the user cancels a production job."""


# ============================================================
# DATABASE HELPERS
# ============================================================

def save_job(job_id: int, **values):
    db = SessionLocal()

    try:
        job = (
            db.query(ProductionJob)
            .filter(ProductionJob.id == job_id)
            .first()
        )

        if not job:
            print(f"ProductionJob {job_id} not found.")
            return

        # Cancelled jobni qayta processingga o'tkazma
        if (
            job.status == "cancelled"
            and values.get("status") in {
                "queued",
                "processing",
            }
        ):
            return

        for key, value in values.items():
            if hasattr(job, key):
                setattr(job, key, value)

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"save_job error: {e}")
        raise

    finally:
        db.close()


def get_job(job_id: int):
    db = SessionLocal()

    try:
        return (
            db.query(ProductionJob)
            .filter(ProductionJob.id == job_id)
            .first()
        )
    finally:
        db.close()


def get_job_status(job_id: int):
    db = SessionLocal()

    try:
        job = (
            db.query(ProductionJob.status)
            .filter(ProductionJob.id == job_id)
            .first()
        )
        return job[0] if job else None
    finally:
        db.close()


def is_job_cancelled(job_id: int) -> bool:
    return get_job_status(job_id) == "cancelled"


# ============================================================
# PROJECT STATUS
# ============================================================

def update_project_status(project_id: int):
    db = SessionLocal()

    try:
        project = (
            db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )

        if not project:
            return

        active_count = (
            db.query(ProductionJob)
            .filter(
                ProductionJob.project_id == project_id,
                ProductionJob.status.in_(["queued", "processing"]),
            )
            .count()
        )

        if active_count > 0:
            project.status = "processing"
        else:
            latest_job = (
                db.query(ProductionJob)
                .filter(ProductionJob.project_id == project_id)
                .order_by(ProductionJob.id.desc())
                .first()
            )

            if latest_job and latest_job.status == "completed":
                project.status = "completed"
            elif latest_job and latest_job.status == "cancelled":
                project.status = "uploaded"
            elif latest_job and latest_job.status == "error":
                project.status = "error"
            else:
                project.status = "uploaded"

        db.commit()

    except Exception as e:
        db.rollback()
        print("update_project_status error:", e)

    finally:
        db.close()


# ============================================================
# SAVE GENERATED VIDEOS
# ============================================================

def save_generated_videos(job_id: int, files: list[str]):
    db = SessionLocal()

    try:
        job = (
            db.query(ProductionJob)
            .filter(ProductionJob.id == job_id)
            .first()
        )

        if not job:
            raise RuntimeError(
                f"ProductionJob {job_id} topilmadi."
            )

        if job.status == "cancelled":
            print(
                f"Job {job_id} cancelled. "
                "Generated videos database'ga yozilmadi."
            )
            return

        db.query(GeneratedVideo).filter(
            GeneratedVideo.production_id == job.id
        ).delete(synchronize_session=False)

        for filename in files:
            if not filename:
                continue

            db.add(
                GeneratedVideo(
                    user_id=job.user_id,
                    project_id=job.project_id,
                    production_id=job.id,
                    filename=os.path.basename(filename),
                    duration=0,
                )
            )

        db.commit()

        print(
            f"{len(files)} ta generated video "
            f"database'ga saqlandi."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# TEST TASK
# ============================================================

@celery_app.task(name="backend.tasks.test_task")
def test_task(message: str):
    print(f"CELERY TASK: {message}")

    return {
        "status": "success",
        "message": message,
    }


# ============================================================
# REAL VIDEO PROCESSING
# ============================================================

@celery_app.task(
    bind=True,
    name="backend.tasks.process_video_task",
)
def process_video_task(
    self,
    video_path: str,
    start_time: float = 0.0,
    end_time: float | None = None,
    job_id: int | None = None,
):
    try:
        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING STARTED")
        print("=" * 70)
        print(f"Video: {video_path}")
        print(f"Range: {start_time} -> {end_time}")
        print(f"Job ID: {job_id}")
        print()

        if not os.path.isfile(video_path):
            raise FileNotFoundError(
                f"Video topilmadi: {video_path}"
            )

        if job_id is not None and is_job_cancelled(job_id):
            self.update_state(
                state="REVOKED",
                meta={
                    "status": "cancelled",
                    "job_id": job_id,
                },
            )
            raise JobCancelled(
                f"Job {job_id} cancelled before processing."
            )

        if job_id is not None:
            save_job(
                job_id,
                status="processing",
                step="starting",
                progress=5,
                generated=0,
                total=10,
                files=json.dumps([]),
                error=None,
            )

        self.update_state(
            state="PROGRESS",
            meta={
                "status": "processing",
                "step": "starting",
                "progress": 5,
                "generated": 0,
                "total": 10,
                "files": [],
            },
        )

        # ----------------------------------------------------
        # CANCELLATION CHECK
        # ----------------------------------------------------

        def cancel_check():
            if job_id is not None and is_job_cancelled(job_id):
                raise JobCancelled(
                    f"Job {job_id} cancelled by user."
                )

        # ----------------------------------------------------
        # PROGRESS CALLBACK
        # ----------------------------------------------------

        def progress_callback(
            progress,
            generated=0,
            total=0,
        ):
            cancel_check()

            try:
                progress = int(float(progress))
            except (TypeError, ValueError):
                progress = 40

            progress = max(5, min(95, progress))

            generated = int(generated or 0)
            total = int(total or 10)

            meta = {
                "status": "processing",
                "step": "generating_shorts",
                "progress": progress,
                "generated": generated,
                "total": total,
                "files": [],
            }

            self.update_state(
                state="PROGRESS",
                meta=meta,
            )

            if job_id is not None:
                save_job(
                    job_id,
                    status="processing",
                    step="generating_shorts",
                    progress=progress,
                    generated=generated,
                    total=total,
                    error=None,
                )

            print(
                "CELERY PROGRESS:",
                f"{progress}%",
                "|",
                f"{generated}/{total}",
            )

        cancel_check()

        if job_id is not None:
            save_job(
                job_id,
                status="processing",
                step="generating_shorts",
                progress=20,
                generated=0,
                total=10,
                error=None,
            )

        self.update_state(
            state="PROGRESS",
            meta={
                "status": "processing",
                "step": "generating_shorts",
                "progress": 20,
                "generated": 0,
                "total": 10,
                "files": [],
            },
        )

        print("Starting process_video()...")

        # ----------------------------------------------------
        # AI PROCESSING
        # ----------------------------------------------------

        files = process_video(
            video_path,
            range_start=start_time,
            range_end=end_time,
            model=model,
            progress_callback=progress_callback,
            cancel_check=cancel_check,
            job_id=job_id,
        )

        cancel_check()

        files = files or []

        final_files = [
            os.path.basename(file)
            for file in files
            if isinstance(file, str)
        ]

        if not final_files:
            raise RuntimeError(
                "Hech qanday short yaratilmadi."
            )

        print()
        print("Generated files:")

        for filename in final_files:
            print(f"  - {filename}")

        # ----------------------------------------------------
        # SAVE GENERATED VIDEOS
        # ----------------------------------------------------

        cancel_check()

        if job_id is not None:
            save_generated_videos(
                job_id,
                final_files,
            )

        cancel_check()

        files_json = json.dumps(final_files)

        if job_id is not None:
            save_job(
                job_id,
                status="processing",
                step="finishing",
                progress=95,
                generated=len(final_files),
                total=len(final_files),
                files=files_json,
                error=None,
            )

        self.update_state(
            state="PROGRESS",
            meta={
                "status": "processing",
                "step": "finishing",
                "progress": 95,
                "generated": len(final_files),
                "total": len(final_files),
                "files": final_files,
            },
        )

        cancel_check()

        # ----------------------------------------------------
        # COMPLETE
        # ----------------------------------------------------

        if job_id is not None:
            save_job(
                job_id,
                status="completed",
                step="completed",
                progress=100,
                generated=len(final_files),
                total=len(final_files),
                files=files_json,
                error=None,
            )

            update_project_status(
                get_job(job_id).project_id
            )

        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING COMPLETED")
        print(f"Generated: {len(final_files)}")
        print("=" * 70)
        print()

        return {
            "status": "completed",
            "progress": 100,
            "generated": len(final_files),
            "total": len(final_files),
            "files": final_files,
            "job_id": job_id,
        }

    except JobCancelled as e:
        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING CANCELLED")
        print(str(e))
        print("=" * 70)

        if job_id is not None:
            # Do not overwrite a newer completed/error state.
            current_status = get_job_status(job_id)

            if current_status not in {"completed", "error"}:
                if job_id is not None:
    try:
        job = get_job(job_id)

        if job:
            refund_generation_credits(
                user_id=job.user_id,
                job_id=job.id,
                reason=f"Generation failed: {str(e)}",
            )

    except Exception as refund_error:
        print(
            "CREDIT REFUND ERROR:",
            refund_error,
        )
                save_job(
                    job_id,
                    status="cancelled",
                    step="cancelled",
                    progress=0,
                    error="Cancelled by user",
                )

                job = get_job(job_id)
                if job:
                    update_project_status(job.project_id)

        self.update_state(
            state="REVOKED",
            meta={
                "status": "cancelled",
                "job_id": job_id,
            },
        )

        # Ignore prevents Celery from storing this as a normal failure.
        raise Ignore()

    except Exception as e:
        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING ERROR")
        print(f"Error: {e}")
        print("=" * 70)

        traceback.print_exc()

        if job_id is not None:
            try:
                save_job(
                    job_id,
                    status="error",
                    step="error",
                    progress=0,
                    error=str(e),
                )

                job = get_job(job_id)
                if job:
                    update_project_status(job.project_id)

            except Exception as db_error:
                print(
                    "Could not save error to database:",
                    db_error,
                )

        raise

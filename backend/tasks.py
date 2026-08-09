from celery import Celery
import os
import traceback
import whisper

from backend.services.ai_service import process_video


# ============================================================
# CELERY
# ============================================================

celery_app = Celery(
    "clipforge",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)


# ============================================================
# WHISPER
# ============================================================

print("Loading Whisper model for Celery worker...")

model = whisper.load_model("base")

print("Whisper model loaded for Celery worker.")


# ============================================================
# TEST
# ============================================================

@celery_app.task(
    name="backend.tasks.test_task"
)
def test_task(message: str):

    print(
        f"CELERY TASK: {message}"
    )

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
):

    try:

        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING STARTED")
        print("=" * 70)
        print(
            f"Video: {video_path}"
        )
        print(
            f"Range: {start_time} -> {end_time}"
        )
        print()

        # ====================================================
        # CHECK VIDEO
        # ====================================================

        if not os.path.isfile(
            video_path
        ):

            raise FileNotFoundError(
                f"Video topilmadi: {video_path}"
            )

        # ====================================================
        # INITIAL PROGRESS
        # ====================================================

        self.update_state(
            state="PROGRESS",
            meta={
                "status": "processing",
                "step": "starting",
                "progress": 5,
                "generated": 0,
                "total": 0,
                "files": [],
            },
        )

        # ====================================================
        # CALLBACK
        # ====================================================

        def progress_callback(
            progress,
            generated=0,
            total=0,
        ):

            try:

                progress = int(
                    float(progress)
                )

            except (
                TypeError,
                ValueError,
            ):

                progress = 40

            progress = max(
                5,
                min(
                    95,
                    progress,
                ),
            )

            self.update_state(
                state="PROGRESS",
                meta={
                    "status": "processing",
                    "step": "generating_shorts",
                    "progress": progress,
                    "generated": generated,
                    "total": total,
                    "files": [],
                },
            )

            print(
                f"CELERY PROGRESS: "
                f"{progress}% | "
                f"{generated}/{total}"
            )

        # ====================================================
        # PROCESS
        # ====================================================

        self.update_state(
            state="PROGRESS",
            meta={
                "status": "processing",
                "step": "generating_shorts",
                "progress": 20,
                "generated": 0,
                "total": 0,
                "files": [],
            },
        )

        print(
            "Starting process_video()..."
        )

        files = process_video(
            video_path,
            range_start=start_time,
            range_end=end_time,
            model=model,
            progress_callback=progress_callback,
        )

        # ====================================================
        # NORMALIZE RESULT
        # ====================================================

        if files is None:

            files = []

        final_files = []

        for file in files:

            if isinstance(
                file,
                str,
            ):

                final_files.append(
                    os.path.basename(file)
                )

        # ====================================================
        # CHECK RESULT
        # ====================================================

        if not final_files:

            raise RuntimeError(
                "Hech qanday short yaratilmadi."
            )

        # ====================================================
        # FINISH
        # ====================================================

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

        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING COMPLETED")
        print(
            f"Generated: {len(final_files)}"
        )
        print("=" * 70)
        print()

        return {
            "status": "completed",
            "progress": 100,
            "generated": len(final_files),
            "total": len(final_files),
            "files": final_files,
        }

    except Exception as e:

        print()
        print("=" * 70)
        print("CELERY VIDEO PROCESSING ERROR")
        print(
            f"Error: {e}"
        )
        print("=" * 70)

        traceback.print_exc()

        raise
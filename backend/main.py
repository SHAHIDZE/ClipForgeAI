from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
    BackgroundTasks,
    Query,
)
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
)

from jose import jwt, JWTError
from datetime import datetime, timedelta

import os
import shutil
import ffmpeg
import whisper
import threading

from pydantic import BaseModel

from backend.services.whisper_service import transcribe_video
from backend.services.highlight_service import get_best_segments
from backend.services.video_cut_service import cut_video
from backend.services.youtube_service import download_youtube
from backend.services.subtitle_service import create_subtitles
from backend.services.ai_service import process_video

from backend.models.schemas import (
    UserRegister,
    UserLogin,
)

from backend.models.user import User
from backend.database.database import SessionLocal

from backend.auth.security import (
    hash_password,
    verify_password,
)

from backend.celery_app import celery_app


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="ClipForge AI API",
    description="AI powered Shorts generator",
    version="1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# WHISPER
# ============================================================

print("Loading Whisper model...")

model = whisper.load_model("base")

print("Whisper model loaded.")


# ============================================================
# AUTH SETTINGS
# ============================================================

SECRET_KEY = "clipforge_super_secret_key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_DIR = os.path.dirname(BASE_DIR)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
)

EXPORT_FOLDER = os.path.join(
    PROJECT_DIR,
    "exports",
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True,
)

os.makedirs(
    EXPORT_FOLDER,
    exist_ok=True,
)


# ============================================================
# PROCESSING STATUS
# ============================================================

PROCESSING_STATUS = {}

PROCESSING_LOCK = threading.Lock()


# ============================================================
# REQUEST MODELS
# ============================================================

class ProcessRequest(BaseModel):
    start_time: float = 0.0
    end_time: float | None = None


class YouTubeRequest(BaseModel):
    url: str


# ============================================================
# HELPERS
# ============================================================

def get_short_files():
    """
    exports papkasidagi final short videolarni qaytaradi.
    """

    try:
        files = os.listdir(EXPORT_FOLDER)
    except Exception:
        return []

    short_files = []

    for filename in files:

        if not filename.endswith(".mp4"):
            continue

        if not filename.startswith("short_"):
            continue

        if filename.endswith("_raw.mp4"):
            continue

        short_files.append(filename)

    short_files.sort()

    return short_files


def cleanup_old_shorts():
    """
    Eski short video va subtitle fayllarini o'chiradi.
    """

    try:
        files = os.listdir(EXPORT_FOLDER)
    except Exception:
        return

    for filename in files:

        if not filename.startswith("short_"):
            continue

        if not filename.endswith(
            (".mp4", ".ass")
        ):
            continue

        path = os.path.join(
            EXPORT_FOLDER,
            filename,
        )

        try:

            if os.path.isfile(path):
                os.remove(path)

        except Exception as e:

            print(
                f"Old file delete error: {e}"
            )


def update_status(
    filename,
    **values,
):
    """
    Processing statusni thread-safe yangilaydi.
    """

    with PROCESSING_LOCK:

        if filename not in PROCESSING_STATUS:

            PROCESSING_STATUS[
                filename
            ] = {}

        PROCESSING_STATUS[
            filename
        ].update(values)


def get_video_duration(
    video_path: str,
):
    """
    Video davomiyligini ffprobe orqali oladi.
    """

    try:

        probe = ffmpeg.probe(
            video_path
        )

        duration = probe[
            "format"
        ].get("duration")

        if duration is None:

            raise ValueError(
                "Video duration topilmadi."
            )

        return float(duration)

    except Exception as e:

        raise ValueError(
            f"Video duration olishda xato: {e}"
        )


# ============================================================
# LOCAL BACKGROUND PROCESSING
# ============================================================

def process_video_background(
    filename: str,
    video_path: str,
    start_time: float,
    end_time: float,
):
    """
    Celery ishlamagan holatda local fallback processing.
    """

    try:

        print()
        print("=" * 60)
        print("LOCAL BACKGROUND PROCESSING STARTED")
        print(f"Filename: {filename}")
        print(
            f"Range: {start_time:.2f}s -> "
            f"{end_time:.2f}s"
        )
        print("=" * 60)
        print()

        update_status(
            filename,
            status="processing",
            step="analyzing",
            progress=10,
            generated=0,
            total=10,
            files=[],
            error=None,
            start_time=start_time,
            end_time=end_time,
        )

        print(
            "STEP 1: Analyzing selected range..."
        )

        update_status(
            filename,
            step="finding_highlights",
            progress=25,
            generated=0,
            total=10,
        )

        print(
            "STEP 2: Finding quality highlights..."
        )

        def progress_callback(
            progress,
            generated=0,
            total=0,
        ):

            try:

                progress = int(
                    round(float(progress))
                )

            except (
                TypeError,
                ValueError,
            ):

                progress = 40

            progress = max(
                40,
                min(90, progress),
            )

            update_status(
                filename,
                status="processing",
                step="generating_shorts",
                progress=progress,
                generated=generated,
                total=total or 10,
                files=get_short_files(),
            )

            print(
                f"PROGRESS: {progress}% | "
                f"Generated: "
                f"{generated}/{total}"
            )

        update_status(
            filename,
            step="generating_shorts",
            progress=40,
            generated=0,
            total=10,
        )

        print(
            "STEP 3: Generating shorts..."
        )

        files = process_video(
            video_path,
            range_start=start_time,
            range_end=end_time,
            model=model,
            progress_callback=progress_callback,
        )

        if files is None:
            files = []

        final_files = []

        for file in files:

            if isinstance(file, str):

                final_files.append(
                    os.path.basename(file)
                )

        if not final_files:

            final_files = get_short_files()

        if len(final_files) == 0:

            raise RuntimeError(
                "Hech qanday short yaratilmadi."
            )

        update_status(
            filename,
            step="finishing",
            progress=95,
            generated=len(final_files),
            total=len(final_files),
            files=final_files,
        )

        update_status(
            filename,
            status="completed",
            step="completed",
            progress=100,
            generated=len(final_files),
            total=len(final_files),
            files=final_files,
            error=None,
        )

        print()
        print("=" * 60)
        print("LOCAL VIDEO PROCESSING COMPLETED")
        print(
            f"Generated: {len(final_files)}"
        )
        print("=" * 60)
        print()

    except Exception as e:

        print()
        print("=" * 60)
        print("LOCAL BACKGROUND PROCESSING ERROR")
        print(f"Error: {e}")
        print("=" * 60)
        print()

        update_status(
            filename,
            status="error",
            step="error",
            progress=0,
            generated=0,
            total=10,
            files=[],
            error=str(e),
        )


# ============================================================
# AUTH
# ============================================================

def create_access_token(
    data: dict,
):

    to_encode = data.copy()

    expire = (
        datetime.utcnow()
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str = Depends(
        oauth2_scheme
    ),
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = payload.get(
            "sub"
        )

        if user_id is None:
            return None

        db = SessionLocal()

        try:

            user = (
                db.query(User)
                .filter(
                    User.id
                    == int(user_id)
                )
                .first()
            )

            return user

        finally:

            db.close()

    except (
        JWTError,
        ValueError,
        TypeError,
    ):

        return None


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to ClipForge AI 🚀",
        "status": "running",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "ClipForge AI",
    }


# ============================================================
# CELERY HEALTH
# ============================================================

@app.get("/celery-health")
def celery_health():

    try:

        inspector = (
            celery_app.control.inspect()
        )

        ping = inspector.ping()

        if ping:

            return {
                "status": "ok",
                "celery": "running",
                "workers": list(
                    ping.keys()
                ),
            }

        return {
            "status": "error",
            "celery": "worker_not_found",
        }

    except Exception as e:

        return {
            "status": "error",
            "celery": str(e),
        }


# ============================================================
# UPLOAD
# ============================================================

@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Fayl nomi topilmadi.",
        )

    filename = os.path.basename(
        file.filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    try:

        with open(
            file_path,
            "wb",
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer,
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Video upload failed: "
                f"{str(e)}"
            ),
        )

    finally:

        await file.close()

    if not os.path.isfile(
        file_path
    ):

        raise HTTPException(
            status_code=500,
            detail="Video saqlanmadi.",
        )

    return {
        "status": "success",
        "filename": filename,
    }


# ============================================================
# ANALYZE
# ============================================================

@app.get("/analyze/{filename}")
def analyze_video(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    path = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    if not os.path.isfile(path):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    try:

        probe = ffmpeg.probe(
            path
        )

        video_stream = next(
            (
                stream
                for stream in probe["streams"]
                if stream["codec_type"]
                == "video"
            ),
            None,
        )

        duration = probe[
            "format"
        ].get("duration")

        return {
            "filename": filename,
            "duration": (
                float(duration)
                if duration is not None
                else None
            ),
            "size": probe[
                "format"
            ].get("size"),
            "format": probe[
                "format"
            ].get("format_name"),
            "width": (
                video_stream.get("width")
                if video_stream
                else None
            ),
            "height": (
                video_stream.get("height")
                if video_stream
                else None
            ),
            "fps": (
                video_stream.get(
                    "r_frame_rate"
                )
                if video_stream
                else None
            ),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# EXTRACT AUDIO
# ============================================================

@app.post("/extract-audio/{filename}")
def extract_audio(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    video_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.isfile(
        video_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    audio_name = (
        filename.rsplit(
            ".",
            1,
        )[0]
        + ".mp3"
    )

    audio_path = os.path.join(
        UPLOAD_FOLDER,
        audio_name,
    )

    try:

        (
            ffmpeg
            .input(video_path)
            .output(
                audio_path,
                format="mp3",
                acodec="libmp3lame",
            )
            .run(
                overwrite_output=True
            )
        )

        return {
            "status": "success",
            "audio_file": audio_name,
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e),
        }


# ============================================================
# TRANSCRIBE
# ============================================================

@app.post("/transcribe/{filename}")
def transcribe_audio(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    audio_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.isfile(
        audio_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Fayl topilmadi.",
        )

    try:

        result = transcribe_video(
            audio_path
        )

        return {
            "status": "success",
            "language": result.get(
                "language"
            ),
            "segments": result.get(
                "segments",
                [],
            ),
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e),
        }


# ============================================================
# HIGHLIGHTS
# ============================================================

@app.post("/highlights/{filename}")
def highlights(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    path = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    if not os.path.isfile(path):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    try:

        result = transcribe_video(
            path
        )

        best = get_best_segments(
            result["segments"]
        )

        return {
            "status": "success",
            "count": len(best),
            "highlights": best,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# TEST CUT
# ============================================================

@app.post("/test-cut/{filename}")
def test_cut(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    input_file = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    if not os.path.isfile(
        input_file
    ):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    try:

        output = cut_video(
            input_file=input_file,
            start=20,
            end=40,
            output_name="test_short.mp4",
        )

        return {
            "status": "success",
            "file": output,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# GENERATE SHORTS - LEGACY
# ============================================================

@app.post("/generate-shorts/{filename}")
def generate_shorts(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    video_path = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    if not os.path.isfile(
        video_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    try:

        files = process_video(
            video_path,
            model=model,
        )

        if files is None:
            files = []

        return {
            "status": "success",
            "generated": len(files),
            "files": files,
        }

    except Exception as e:

        print(
            "GENERATE SHORTS ERROR:"
        )

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# START PROCESSING
# ============================================================

@app.post("/process/{filename}")
def process_video_endpoint(
    filename: str,
    background_tasks: BackgroundTasks,
    body: ProcessRequest | None = None,
    range_start: float | None = Query(None),
    range_end: float | None = Query(None),
):

    filename = os.path.basename(
        filename
    )

    video_path = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    # --------------------------------------------------------
    # CHECK VIDEO
    # --------------------------------------------------------

    if not os.path.isfile(
        video_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    # --------------------------------------------------------
    # GET DURATION
    # --------------------------------------------------------

    try:

        total_duration = (
            get_video_duration(
                video_path
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    # --------------------------------------------------------
    # GET RANGE
    # --------------------------------------------------------

    if range_start is not None:

        start_time = float(
            range_start
        )

    elif body is not None:

        start_time = float(
            body.start_time
        )

    else:

        start_time = 0.0

    if range_end is not None:

        end_time = float(
            range_end
        )

    elif body is not None:

        if body.end_time is None:

            end_time = total_duration

        else:

            end_time = float(
                body.end_time
            )

    else:

        end_time = total_duration

    # --------------------------------------------------------
    # NORMALIZE
    # --------------------------------------------------------

    start_time = max(
        0.0,
        start_time,
    )

    end_time = min(
        total_duration,
        end_time,
    )

    selected_duration = (
        end_time - start_time
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if selected_duration <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Start time va end time "
                "noto'g'ri."
            ),
        )

    if selected_duration > 3600:

        raise HTTPException(
            status_code=400,
            detail=(
                "Tanlangan video oralig'i "
                "maksimum 60 daqiqa "
                "bo'lishi kerak."
            ),
        )

    # --------------------------------------------------------
    # CURRENT STATUS
    # --------------------------------------------------------

    with PROCESSING_LOCK:

        current_status = (
            PROCESSING_STATUS.get(
                filename
            )
        )

    if current_status:

        current_state = (
            current_status.get(
                "status"
            )
        )

        # ----------------------------------------------------
        # ALREADY QUEUED / PROCESSING
        # ----------------------------------------------------

        if current_state in (
            "queued",
            "processing",
        ):

            return {
                "status": current_state,
                "filename": filename,
                "progress": current_status.get(
                    "progress",
                    0,
                ),
                "step": current_status.get(
                    "step",
                    "processing",
                ),
                "generated": current_status.get(
                    "generated",
                    0,
                ),
                "total": current_status.get(
                    "total",
                    10,
                ),
                "files": current_status.get(
                    "files",
                    [],
                ),
                "task_id": current_status.get(
                    "task_id"
                ),
                "start_time": current_status.get(
                    "start_time",
                    start_time,
                ),
                "end_time": current_status.get(
                    "end_time",
                    end_time,
                ),
                "message": (
                    "Video allaqachon "
                    "qayta ishlanmoqda."
                ),
            }

        # ----------------------------------------------------
        # COMPLETED
        # ----------------------------------------------------

        if current_state == "completed":

            return {
                "status": "completed",
                "filename": filename,
                "progress": 100,
                "generated": current_status.get(
                    "generated",
                    0,
                ),
                "total": current_status.get(
                    "total",
                    10,
                ),
                "files": current_status.get(
                    "files",
                    [],
                ),
                "task_id": current_status.get(
                    "task_id"
                ),
                "start_time": current_status.get(
                    "start_time",
                    start_time,
                ),
                "end_time": current_status.get(
                    "end_time",
                    end_time,
                ),
                "error": None,
            }

        # ----------------------------------------------------
        # ERROR
        # ----------------------------------------------------

        if current_state == "error":

            with PROCESSING_LOCK:

                PROCESSING_STATUS.pop(
                    filename,
                    None,
                )

    # --------------------------------------------------------
    # CLEAN OLD SHORTS
    # --------------------------------------------------------

    cleanup_old_shorts()

    # --------------------------------------------------------
    # INITIAL STATUS
    # --------------------------------------------------------

    update_status(
        filename,
        status="queued",
        step="queued",
        progress=0,
        generated=0,
        total=10,
        files=[],
        error=None,
        task_id=None,
        start_time=start_time,
        end_time=end_time,
    )

    # --------------------------------------------------------
    # SEND TO CELERY
    # --------------------------------------------------------

    try:

        print()
        print("=" * 60)
        print("SENDING VIDEO TO CELERY")
        print(f"Filename: {filename}")
        print(
            f"Range: {start_time:.2f}s -> "
            f"{end_time:.2f}s"
        )
        print("=" * 60)
        print()

        task = celery_app.send_task(
            "backend.tasks.process_video_task",
            args=[
                video_path,
                start_time,
                end_time,
            ],
        )

        update_status(
            filename,
            status="queued",
            step="queued",
            progress=0,
            generated=0,
            total=10,
            files=[],
            task_id=task.id,
            start_time=start_time,
            end_time=end_time,
            error=None,
        )

        print(
            f"Celery task created: {task.id}"
        )

        return {
            "status": "queued",
            "filename": filename,
            "task_id": task.id,
            "progress": 0,
            "step": "queued",
            "generated": 0,
            "total": 10,
            "files": [],
            "start_time": start_time,
            "end_time": end_time,
            "video_duration": total_duration,
            "message": (
                "Video Celery worker "
                "queue'ga yuborildi."
            ),
        }

    except Exception as celery_error:

        print()
        print("=" * 60)
        print("CELERY ERROR")
        print(celery_error)
        print(
            "Starting local BackgroundTasks fallback..."
        )
        print("=" * 60)
        print()

        update_status(
            filename,
            status="processing",
            step="background_fallback",
            progress=5,
            generated=0,
            total=10,
            files=[],
            task_id=None,
            start_time=start_time,
            end_time=end_time,
            error=None,
        )

        background_tasks.add_task(
            process_video_background,
            filename,
            video_path,
            start_time,
            end_time,
        )

        return {
            "status": "processing",
            "filename": filename,
            "task_id": None,
            "progress": 5,
            "step": "background_fallback",
            "generated": 0,
            "total": 10,
            "files": [],
            "start_time": start_time,
            "end_time": end_time,
            "video_duration": total_duration,
            "message": (
                "Celery ishlamadi. "
                "Local BackgroundTasks "
                "ishga tushdi."
            ),
        }


# ============================================================
# PROCESS STATUS
# ============================================================

@app.get("/process-status/{filename}")
def process_status(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    # --------------------------------------------------------
    # GET LOCAL STATUS
    # --------------------------------------------------------

    with PROCESSING_LOCK:

        local_status = (
            PROCESSING_STATUS.get(
                filename,
                {}
            ).copy()
        )

    if not local_status:

        return {
            "status": "not_found",
            "filename": filename,
            "progress": 0,
            "step": "not_found",
            "generated": 0,
            "total": 0,
            "files": [],
            "error": None,
        }

    # --------------------------------------------------------
    # CELERY STATUS
    # --------------------------------------------------------

    task_id = local_status.get(
        "task_id"
    )

    if task_id:

        try:

            result = (
                celery_app.AsyncResult(
                    task_id
                )
            )

            # =================================================
            # CELERY PROGRESS
            # =================================================

            if result.state == "PROGRESS":

                meta = result.info

                if not isinstance(
                    meta,
                    dict,
                ):

                    meta = {}

                progress = meta.get(
                    "progress",
                    local_status.get(
                        "progress",
                        0,
                    ),
                )

                generated = meta.get(
                    "generated",
                    local_status.get(
                        "generated",
                        0,
                    ),
                )

                total = meta.get(
                    "total",
                    local_status.get(
                        "total",
                        10,
                    ),
                )

                step = meta.get(
                    "step",
                    local_status.get(
                        "step",
                        "processing",
                    ),
                )

                files = meta.get(
                    "files",
                    local_status.get(
                        "files",
                        [],
                    ),
                )

                update_status(
                    filename,
                    status="processing",
                    step=step,
                    progress=progress,
                    generated=generated,
                    total=total,
                    files=files,
                    error=None,
                )

            # =================================================
            # SUCCESS
            # =================================================

            elif result.successful():

                result_data = (
                    result.result
                )

                if isinstance(
                    result_data,
                    dict,
                ):

                    final_files = (
                        result_data.get(
                            "files",
                            [],
                        )
                    )

                    if not final_files:

                        final_files = (
                            get_short_files()
                        )

                    update_status(
                        filename,
                        status="completed",
                        step="completed",
                        progress=100,
                        generated=len(
                            final_files
                        ),
                        total=len(
                            final_files
                        ),
                        files=final_files,
                        error=None,
                    )

            # =================================================
            # FAILURE
            # =================================================

            elif result.failed():

                error_text = str(
                    result.result
                )

                update_status(
                    filename,
                    status="error",
                    step="error",
                    progress=0,
                    error=error_text,
                )

            # =================================================
            # STARTED
            # =================================================

            elif result.state == "STARTED":

                update_status(
                    filename,
                    status="processing",
                    step="starting",
                    progress=max(
                        local_status.get(
                            "progress",
                            5,
                        ),
                        5,
                    ),
                )

            # =================================================
            # PENDING
            # =================================================

            elif result.state == "PENDING":

                update_status(
                    filename,
                    status="queued",
                    step="queued",
                    progress=local_status.get(
                        "progress",
                        0,
                    ),
                )

        except Exception as e:

            print(
                f"Celery status error: {e}"
            )

    # --------------------------------------------------------
    # FINAL STATUS
    # --------------------------------------------------------

    with PROCESSING_LOCK:

        final_status = (
            PROCESSING_STATUS.get(
                filename,
                {}
            ).copy()
        )

    return {
        "filename": filename,
        **final_status,
    }


# ============================================================
# DOWNLOAD
# ============================================================

@app.get("/download/{filename}")
def download(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    path = os.path.join(
        EXPORT_FOLDER,
        filename,
    )

    if not os.path.isfile(path):

        raise HTTPException(
            status_code=404,
            detail="File topilmadi.",
        )

    return FileResponse(
        path,
        media_type="video/mp4",
        filename=filename,
    )


# ============================================================
# EXPORTS
# ============================================================

@app.get("/exports")
def exports():

    try:

        files = os.listdir(
            EXPORT_FOLDER
        )

    except Exception:

        files = []

    files = [
        file
        for file in files
        if file.endswith(".mp4")
        and file.startswith("short_")
        and not file.endswith(
            "_raw.mp4"
        )
    ]

    files.sort()

    return {
        "count": len(files),
        "files": files,
    }


# ============================================================
# YOUTUBE
# ============================================================

@app.post("/youtube")
def youtube(
    request: YouTubeRequest,
):

    url = request.url.strip()

    if not url:

        raise HTTPException(
            status_code=400,
            detail="Video URL kiritilmadi.",
        )

    try:

        filename = download_youtube(
            url
        )

        return {
            "status": "success",
            "filename": filename,
        }

    except Exception as e:

        print()
        print(
            "YOUTUBE DOWNLOAD ERROR:"
        )
        print(e)
        print()

        error_text = str(e)

        if (
            "429" in error_text
            or "bot" in error_text.lower()
            or "sign in" in error_text.lower()
            or "confirm you're not a bot"
            in error_text.lower()
        ):

            raise HTTPException(
                status_code=429,
                detail=(
                    "YouTube hozir bu "
                    "so'rovni blokladi "
                    "(429/bot verification). "
                    "Keyinroq qayta urinib "
                    "ko'ring yoki videoni "
                    "fayl sifatida yuklang."
                ),
            )

        raise HTTPException(
            status_code=500,
            detail=error_text,
        )


# ============================================================
# SUBTITLE
# ============================================================

@app.post("/subtitle/{filename}")
def subtitle(
    filename: str,
):

    filename = os.path.basename(
        filename
    )

    video = os.path.join(
        UPLOAD_FOLDER,
        filename,
    )

    if not os.path.isfile(video):

        raise HTTPException(
            status_code=404,
            detail="Video topilmadi.",
        )

    try:

        result = transcribe_video(
            video
        )

        segments = result.get(
            "segments",
            [],
        )

        subtitle_path = os.path.join(
            UPLOAD_FOLDER,
            filename.rsplit(
                ".",
                1,
            )[0]
            + ".ass"
        )

        create_subtitles(
            segments,
            subtitle_path,
        )

        return {
            "status": "success",
            "subtitle": subtitle_path,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    user: UserRegister,
):

    db = SessionLocal()

    try:

        existing_email = (
            db.query(User)
            .filter(
                User.email
                == user.email
            )
            .first()
        )

        if existing_email:

            return {
                "status": "error",
                "message": (
                    "Email already exists"
                ),
            }

        existing_username = (
            db.query(User)
            .filter(
                User.username
                == user.username
            )
            .first()
        )

        if existing_username:

            return {
                "status": "error",
                "message": (
                    "Username already exists"
                ),
            }

        new_user = User(
            username=user.username,
            email=user.email,
            password=hash_password(
                user.password
            ),
        )

        db.add(
            new_user
        )

        db.commit()

        db.refresh(
            new_user
        )

        return {
            "status": "success",
            "message": (
                "Account created successfully"
            ),
        }

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):

    db = SessionLocal()

    try:

        db_user = (
            db.query(User)
            .filter(
                User.email
                == form_data.username
            )
            .first()
        )

        if (
            not db_user
            or not verify_password(
                form_data.password,
                db_user.password,
            )
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid email "
                    "or password"
                ),
            )

        token = create_access_token(
            {
                "sub": str(
                    db_user.id
                ),
                "email": db_user.email,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    finally:

        db.close()


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me")
def me(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user is None:

        return {
            "status": "error",
            "message": "Not authenticated",
        }

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "plan": current_user.plan,
    }


# ============================================================
# STATIC EXPORTS
# ============================================================

app.mount(
    "/exports",
    StaticFiles(
        directory=EXPORT_FOLDER
    ),
    name="exports",
)
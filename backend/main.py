from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import shutil
import ffmpeg
from backend.services.whisper_service import transcribe_video
from backend.services.highlight_service import get_best_segments
from backend.services.video_cut_service import cut_video
from fastapi.responses import FileResponse
from backend.services.youtube_service import download_youtube
from fastapi import HTTPException
from backend.services.subtitle_service import generate_srt
from backend.models.schemas import UserRegister
from backend.models.user import User
from backend.database.database import SessionLocal
from backend.auth.security import hash_password
from backend.models.schemas import UserLogin
from backend.auth.security import verify_password
from jose import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
from jose import JWTError
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from backend.services.audio_service import get_audio_energy


SECRET_KEY = "clipforge_super_secret_key"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        db = SessionLocal()

        user = db.query(User).filter(
            User.id == int(user_id)
        ).first()

        db.close()

        return user

    except JWTError:
        return None


app = FastAPI(
    title="ClipForge AI API",
    description="AI powered Shorts generator",
    version="1.0"
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "Welcome to ClipForge AI 🚀",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return JSONResponse({
        "message": "Video uploaded successfully",
        "filename": file.filename,
        "path": file_path
    })


@app.get("/analyze/{filename}")
def analyze_video(filename: str):

    path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        probe = ffmpeg.probe(path)

        video_stream = next(
            (
                stream
                for stream in probe["streams"]
                if stream["codec_type"] == "video"
            ),
            None
        )

        return {
            "filename": filename,
            "duration": probe["format"].get("duration"),
            "size": probe["format"].get("size"),
            "format": probe["format"].get("format_name"),
            "width": video_stream.get("width") if video_stream else None,
            "height": video_stream.get("height") if video_stream else None,
            "fps": video_stream.get("r_frame_rate") if video_stream else None
        }

    except Exception as e:
        return {
            "error": str(e)
        }


@app.post("/extract-audio/{filename}")
def extract_audio(filename: str):

    video_path = os.path.join(UPLOAD_FOLDER, filename)

    audio_name = filename.rsplit(".", 1)[0] + ".mp3"
    audio_path = os.path.join(UPLOAD_FOLDER, audio_name)

    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, format="mp3", acodec="libmp3lame")
            .run(overwrite_output=True)
        )

        return {
            "status": "success",
            "audio_file": audio_name
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/transcribe/{filename}")
def transcribe_audio(filename: str):

    audio_path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        model = whisper.load_model("base")

        result = model.transcribe(audio_path)

        return {
    "status": "success",
    "language": result["language"],
    "segments": result["segments"]
}

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/highlights/{filename}")
def highlights(filename: str):

    path = os.path.join(UPLOAD_FOLDER, filename)

    result = model.transcribe(path)

    best = get_best_segments(result["segments"])

    return {
        "status": "success",
        "count": len(best),
        "highlights": best
    }


@app.post("/test-cut/{filename}")
def test_cut(filename: str):

    input_file = os.path.join(UPLOAD_FOLDER, filename)

    output = cut_video(
        input_file=input_file,
        start=20,
        end=40,
        output_name="test_short.mp4"
    )

    return {
        "status": "success",
        "file": output
    }


@app.post("/generate-shorts/{filename}")
def generate_shorts(filename: str):

    video_path = os.path.join(UPLOAD_FOLDER, filename)

    result = model.transcribe(video_path)
    audio = video_path.replace(".mp4", ".mp3")

energy = get_audio_energy(audio)

print(energy.mean())

    best = get_best_segments(result["segments"])

    files = []

    for i, seg in enumerate(best):

        output_name = f"short_{i+1}.mp4"

        cut_video(
            video_path,
            seg["start"],
            seg["end"],
            output_name
        )

        files.append(output_name)

    return {
        "status": "success",
        "generated": len(files),
        "files": files
    }


@app.post("/process/{filename}")
def process_video(filename: str):

    video_path = os.path.join(UPLOAD_FOLDER, filename)

    result = model.transcribe(video_path)

    best = get_best_segments(result["segments"])

    files = []

    for i, seg in enumerate(best):

        output_name = f"short_{i+1}.mp4"

        cut_video(
            video_path,
            seg["start"],
            seg["end"],
            output_name
        )

        files.append(output_name)

    return {
        "status": "success",
        "language": result["language"],
        "generated": len(files),
        "files": files
    }


@app.get("/download/{filename}")
def download(filename: str):

    path = os.path.join("exports", filename)

    return FileResponse(
        path,
        media_type="video/mp4",
        filename=filename
    )


@app.get("/exports")
def exports():

    files = os.listdir("exports")

    return {
        "count": len(files),
        "files": files
    }


@app.post("/youtube")
def youtube(url: str):

    try:

        filename = download_youtube(url)

        return {
            "status": "success",
            "filename": filename
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/subtitle/{filename}")
def subtitle(filename: str):

    video = os.path.join(UPLOAD_FOLDER, filename)

    result = model.transcribe(
        video,
        word_timestamps=True
    )

    srt = generate_srt(result)

    return {
        "status": "success",
        "subtitle": srt
    }


@app.post("/register")
def register(user: UserRegister):

    db = SessionLocal()

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        db.close()
        return {
            "status": "error",
            "message": "Email already exists"
        }

    existing_username = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_username:
        db.close()
        return {
            "status": "error",
            "message": "Username already exists"
        }

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()

    return {
        "status": "success",
        "message": "Account created successfully"
    }


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):

    db = SessionLocal()

    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user or not verify_password(form_data.password, db_user.password):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        {
            "sub": str(db_user.id),
            "email": db_user.email
        }
    )

    db.close()

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
def me(
    current_user=Depends(get_current_user)
):

    if current_user is None:

        return {
            "status": "error",
            "message": "Not authenticated"
        }

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "plan": current_user.plan
    }
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import shutil
import ffmpeg
import whisper
from backend.services.highlight_service import get_best_segments
from backend.services.video_cut_service import cut_video

model = whisper.load_model("base")

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
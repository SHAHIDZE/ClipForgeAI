import whisper

# Model server ishga tushganda bir marta yuklanadi
model = whisper.load_model("base")


def transcribe_video(video_path: str):
    return model.transcribe(
        video_path,
        word_timestamps=True
    )
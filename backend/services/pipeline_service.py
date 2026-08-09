import os

from backend.services.segment_service import build_candidate_segments
from backend.services.video_cut_service import cut_video


def process_video(video_path, whisper_model):
    print("🎤 Transcribing...")

    result = whisper_model.transcribe(video_path)

    print("✅ Transcribe finished")

    candidates = build_candidate_segments(result["segments"])

    print("Candidates:", len(candidates))

    if not candidates:
        return []

    candidates.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    selected = []

    for clip in candidates:

        overlap = False

        for s in selected:
            if clip["start"] < s["end"] and clip["end"] > s["start"]:
                overlap = True
                break

        if not overlap:
            selected.append(clip)

        if len(selected) == 10:
            break

    files = []

    for i, clip in enumerate(selected):

        output_name = f"short_{i+1}.mp4"

        duration = seg["end"] - seg["start"]

if duration < 10:
    continue

if duration > 60:
    seg["end"] = seg["start"] + 60

        cut_video(
            video_path,
            clip["start"],
            clip["end"],
            output_name
        )

        files.append(output_name)

    print("Generated:", len(files))

    return files

    print(seg["start"], seg["end"])
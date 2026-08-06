import os
import pysubs2

def create_subtitles(segments, output_path):

    subs = pysubs2.SSAFile()

    subs.styles["Default"].fontname = "Arial"
    subs.styles["Default"].fontsize = 18
    subs.styles["Default"].outline = 2
    subs.styles["Default"].shadow = 0

    for seg in segments:
        subs.append(
            pysubs2.SSAEvent(
                start=int(seg["start"] * 1000),
                end=int(seg["end"] * 1000),
                text=seg["text"].strip()
            )
        )

    subs.save(output_path)


# ===== YANGI FUNKSIYA =====

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)

    return f"{hours:02}:{minutes:02}:{secs:02},{ms:03}"


def generate_srt(result, output_path):

    with open(output_path, "w", encoding="utf-8") as f:

        for i, seg in enumerate(result["segments"], start=1):

            f.write(f"{i}\n")
            f.write(
                f"{format_time(seg['start'])} --> {format_time(seg['end'])}\n"
            )
            f.write(seg["text"].strip())
            f.write("\n\n")

    return output_path
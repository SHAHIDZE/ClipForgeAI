import os

from backend.services.whisper_service import transcribe_video
from backend.services.highlight_service import get_best_segments
from backend.services.video_cut_service import (
    cut_video,
    burn_subtitles,
)
from backend.services.subtitle_service import (
    create_subtitles,
)


# ============================================================
# FOLDERS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "backend",
    "uploads",
)

EXPORT_FOLDER = os.path.join(
    BASE_DIR,
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
# PROCESS VIDEO
# ============================================================

def process_video(
    video_path,
    range_start=0.0,
    range_end=None,
    model=None,
    progress_callback=None,
):

    print()
    print("=" * 60)
    print("CLIPFORGE AI PROCESSING STARTED")
    print("=" * 60)

    # ========================================================
    # 0. VIDEO PATH
    # ========================================================

    video_path = os.path.abspath(
        video_path
    )

    print()
    print("INPUT VIDEO:")
    print(video_path)

    if not os.path.isfile(video_path):
        raise FileNotFoundError(
            f"Video topilmadi:\n{video_path}"
        )

    print("Video exists: YES")

    # ========================================================
    # 1. TRANSCRIBE
    # ========================================================

    print()
    print("Step 1: Transcribing...")

    result = transcribe_video(
        video_path
    )

    segments = result.get(
        "segments",
        [],
    )

    if not segments:
        raise ValueError(
            "Whisper hech qanday segment topmadi."
        )

    print(
        f"Transcription segments: "
        f"{len(segments)}"
    )

    # ========================================================
    # VIDEO TOTAL DURATION
    # ========================================================

    valid_ends = [
        float(seg["end"])
        for seg in segments
        if "end" in seg
    ]

    if not valid_ends:
        raise ValueError(
            "Video davomiyligini aniqlab bo'lmadi."
        )

    total_duration = max(
        valid_ends
    )

    # ========================================================
    # RANGE
    # ========================================================

    try:
        range_start = float(
            range_start
        )
    except (
        TypeError,
        ValueError,
    ):
        range_start = 0.0

    if range_end is None:

        range_end = total_duration

    else:

        try:
            range_end = float(
                range_end
            )
        except (
            TypeError,
            ValueError,
        ):
            range_end = total_duration

    # ========================================================
    # SAFE LIMITS
    # ========================================================

    range_start = max(
        0.0,
        range_start,
    )

    range_end = min(
        total_duration,
        range_end,
    )

    # ========================================================
    # VALIDATE RANGE
    # ========================================================

    if range_end <= range_start:
        raise ValueError(
            "Boshlanish va tugash vaqti noto'g'ri."
        )

    selected_duration = (
        range_end - range_start
    )

    if selected_duration > 3600:
        raise ValueError(
            "Tanlangan vaqt oralig'i "
            "maksimum 60 daqiqa bo'lishi kerak."
        )

    print()
    print("USER SELECTED RANGE:")

    print(
        f"{range_start:.2f}s -> "
        f"{range_end:.2f}s"
    )

    print(
        f"Duration: "
        f"{selected_duration:.2f}s"
    )

    # ========================================================
    # 2. FIND HIGHLIGHTS
    # ========================================================

    print()
    print(
        "Step 2: Finding all quality highlights..."
    )

    best_segments = get_best_segments(
        segments,
        range_start=range_start,
        range_end=range_end,
    )

    if not best_segments:
        raise ValueError(
            "Tanlangan vaqt oralig'ida "
            "yaxshi highlight topilmadi."
        )

    total_shorts = len(
        best_segments
    )

    print()
    print(
        f"Quality highlights found: "
        f"{total_shorts}"
    )

    # ========================================================
    # GENERATING START
    # 40%
    # ========================================================

    if progress_callback:

        progress_callback(
            40,
            generated=0,
            total=total_shorts,
        )

    # ========================================================
    # RESULT FILES
    # ========================================================

    files = []

    # ========================================================
    # 3. CREATE SHORTS
    # ========================================================

    for index, segment in enumerate(
        best_segments,
        start=1,
    ):

        print()
        print("=" * 60)
        print(
            f"PROCESSING SHORT "
            f"{index}/{total_shorts}"
        )
        print("=" * 60)

        # ====================================================
        # SHORT PROGRESS RANGE
        #
        # 40% -> 90%
        # ====================================================

        short_start_progress = (
            40
            + (
                (index - 1)
                / total_shorts
            )
            * 50
        )

        short_end_progress = (
            40
            + (
                index
                / total_shorts
            )
            * 50
        )

        # ----------------------------------------------------
        # CURRENT SHORT START
        # ----------------------------------------------------

        if progress_callback:

            progress_callback(
                int(
                    round(
                        short_start_progress
                    )
                ),
                generated=index - 1,
                total=total_shorts,
            )

        # ====================================================
        # CLIP TIME
        # ====================================================

        start = float(
            segment["start"]
        )

        end = float(
            segment["end"]
        )

        start = max(
            range_start,
            start,
        )

        end = min(
            range_end,
            end,
        )

        duration = (
            end - start
        )

        print(
            f"Clip: "
            f"{start:.2f}s -> "
            f"{end:.2f}s"
        )

        print(
            f"Duration: "
            f"{duration:.2f}s"
        )

        print(
            f"Score: "
            f"{segment.get('score', 0):.2f}"
        )

        # ====================================================
        # NAMES
        # ====================================================

        base_name = (
            f"short_{index}"
        )

        raw_name = (
            f"{base_name}_raw.mp4"
        )

        final_name = (
            f"{base_name}.mp4"
        )

        subtitle_name = (
            f"{base_name}.ass"
        )

        raw_path = os.path.join(
            EXPORT_FOLDER,
            raw_name,
        )

        final_path = os.path.join(
            EXPORT_FOLDER,
            final_name,
        )

        subtitle_path = os.path.join(
            EXPORT_FOLDER,
            subtitle_name,
        )

        # ====================================================
        # CLEAN OLD FILES
        # ====================================================

        for old_file in [
            raw_path,
            final_path,
            subtitle_path,
        ]:

            if os.path.exists(
                old_file
            ):

                try:
                    os.remove(
                        old_file
                    )
                except Exception:
                    pass

        # ====================================================
        # 3.1 CUT VIDEO
        # ====================================================

        print()
        print(
            "Cutting video..."
        )

        cut_video(
            input_file=video_path,
            start=start,
            end=end,
            output_name=raw_name,
        )

        if not os.path.isfile(
            raw_path
        ):
            raise FileNotFoundError(
                f"Raw video yaratilmadi:\n"
                f"{raw_path}"
            )

        print(
            f"Raw video created: "
            f"{raw_path}"
        )

        # ====================================================
        # 3.2 WORD DATA
        # ====================================================

        segment_words = segment.get(
            "words",
            [],
        )

        print(
            f"Subtitle words: "
            f"{len(segment_words)}"
        )

        # ====================================================
        # 3.3 CREATE SUBTITLE
        # ====================================================

        print()
        print(
            "Creating subtitles..."
        )

        create_subtitles(
            [segment],
            subtitle_path,
            time_offset=start,
        )

        if not os.path.isfile(
            subtitle_path
        ):
            raise FileNotFoundError(
                f"Subtitle yaratilmadi:\n"
                f"{subtitle_path}"
            )

        print(
            f"Subtitle created: "
            f"{subtitle_path}"
        )

        # ====================================================
        # 3.4 BURN SUBTITLE
        # ====================================================

        print()
        print(
            "Burning subtitles..."
        )

        burn_subtitles(
            input_video=raw_path,
            subtitle_file=subtitle_path,
            output_video=final_path,
        )

        if not os.path.isfile(
            final_path
        ):
            raise FileNotFoundError(
                f"Final video yaratilmadi:\n"
                f"{final_path}"
            )

        print(
            f"Final video created: "
            f"{final_path}"
        )

        # ====================================================
        # DELETE RAW
        # ====================================================

        if os.path.exists(
            raw_path
        ):

            try:
                os.remove(
                    raw_path
                )
            except Exception:
                pass

        # ====================================================
        # DELETE ASS
        # ====================================================

        if os.path.exists(
            subtitle_path
        ):

            try:
                os.remove(
                    subtitle_path
                )
            except Exception:
                pass

        # ====================================================
        # SAVE RESULT
        # ====================================================

        files.append(
            final_name
        )

        # ====================================================
        # REAL SHORT PROGRESS
        # ====================================================

        progress = int(
            round(
                short_end_progress
            )
        )

        progress = max(
            40,
            min(
                90,
                progress,
            ),
        )

        if progress_callback:

            progress_callback(
                progress,
                generated=index,
                total=total_shorts,
            )

        print()
        print(
            f"SHORT "
            f"{index}/{total_shorts} "
            f"DONE"
        )

    # ========================================================
    # FINISHED
    # ========================================================

    print()
    print("=" * 60)
    print(
        "CLIPFORGE AI PROCESSING COMPLETED"
    )

    print(
        f"Selected range: "
        f"{range_start:.2f}s -> "
        f"{range_end:.2f}s"
    )

    print(
        f"Generated quality shorts: "
        f"{len(files)}"
    )

    print("=" * 60)

    return files
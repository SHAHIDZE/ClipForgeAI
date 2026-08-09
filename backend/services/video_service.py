import os
import shutil

from backend.services.video_cut_service import (
    cut_video,
    burn_subtitles
)

from backend.services.subtitle_service import (
    create_subtitles
)


# ============================================================
# BASE DIRECTORIES
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

EXPORT_FOLDER = os.path.join(
    BASE_DIR,
    "exports"
)

SUBTITLE_FOLDER = os.path.join(
    EXPORT_FOLDER,
    "subtitles"
)

os.makedirs(
    EXPORT_FOLDER,
    exist_ok=True
)

os.makedirs(
    SUBTITLE_FOLDER,
    exist_ok=True
)


# ============================================================
# SAFE FILE NAME
# ============================================================

def _safe_name(name):
    """
    Fayl nomini Windows uchun xavfsiz qiladi.
    """

    invalid_chars = (
        '<',
        '>',
        ':',
        '"',
        '/',
        '\\',
        '|',
        '?',
        '*'
    )

    for char in invalid_chars:
        name = name.replace(
            char,
            "_"
        )

    return name.strip()


# ============================================================
# PROCESS ONE SHORT
# ============================================================

def process_short(
    input_video,
    clip,
    index
):

    if not clip:
        raise ValueError(
            "Clip data is empty."
        )

    # --------------------------------------------------------
    # CLIP TIME
    # --------------------------------------------------------

    start = float(
        clip["start"]
    )

    end = float(
        clip["end"]
    )

    if end <= start:
        raise ValueError(
            f"Invalid clip range: {start} -> {end}"
        )

    # --------------------------------------------------------
    # FILE NAMES
    # --------------------------------------------------------

    short_number = int(index)

    base_name = (
        f"short_{short_number:02d}"
    )

    raw_video_name = (
        f"{base_name}_raw.mp4"
    )

    subtitle_name = (
        f"{base_name}.ass"
    )

    final_video_name = (
        f"{base_name}.mp4"
    )

    raw_video_path = os.path.join(
        EXPORT_FOLDER,
        raw_video_name
    )

    subtitle_path = os.path.join(
        SUBTITLE_FOLDER,
        subtitle_name
    )

    final_video_path = os.path.join(
        EXPORT_FOLDER,
        final_video_name
    )

    # --------------------------------------------------------
    # CLEAN OLD FILES
    # --------------------------------------------------------

    for old_file in (
        raw_video_path,
        subtitle_path,
        final_video_path
    ):

        if os.path.isfile(
            old_file
        ):
            try:
                os.remove(
                    old_file
                )
            except Exception:
                pass

    # --------------------------------------------------------
    # DEBUG
    # --------------------------------------------------------

    print()
    print(
        "#" * 60
    )

    print(
        f"PROCESSING SHORT #{short_number}"
    )

    print(
        f"Time: {start:.3f}s -> {end:.3f}s"
    )

    print(
        f"Duration: {end - start:.3f}s"
    )

    print(
        "#" * 60
    )

    # ========================================================
    # STEP 1
    # CUT VIDEO
    # ========================================================

    cut_path = cut_video(
        input_file=input_video,
        start=start,
        end=end,
        output_name=raw_video_name
    )

    # ========================================================
    # STEP 2
    # CREATE SUBTITLES
    # ========================================================

    words = clip.get(
        "words",
        []
    )

    if not words:
        raise ValueError(
            f"Short #{short_number} has no word timings."
        )

    print()
    print(
        f"Creating subtitles for short #{short_number}"
    )

    # --------------------------------------------------------
    # Subtitle service'ga clip words yuboramiz.
    # --------------------------------------------------------

    create_subtitles(
        words,
        subtitle_path
    )

    if not os.path.isfile(
        subtitle_path
    ):
        raise FileNotFoundError(
            f"Subtitle creation failed:\n{subtitle_path}"
        )

    print(
        "SUBTITLE FILE CREATED"
    )

    # ========================================================
    # STEP 3
    # BURN SUBTITLES
    # ========================================================

    final_path = burn_subtitles(
        input_video=cut_path,
        subtitle_file=subtitle_path,
        output_video=final_video_path
    )

    # ========================================================
    # STEP 4
    # REMOVE RAW VIDEO
    # ========================================================

    if os.path.isfile(
        cut_path
    ):

        try:

            os.remove(
                cut_path
            )

            print(
                f"Temporary raw video removed: "
                f"{cut_path}"
            )

        except Exception as error:

            print(
                f"Could not remove temporary file: "
                f"{error}"
            )

    # ========================================================
    # RESULT
    # ========================================================

    if not os.path.isfile(
        final_path
    ):
        raise FileNotFoundError(
            f"Final short was not created:\n{final_path}"
        )

    print()
    print(
        f"SHORT #{short_number} READY"
    )

    print(
        f"Final file: {final_path}"
    )

    print(
        "#" * 60
    )

    return final_path


# ============================================================
# PROCESS ALL SHORTS
# ============================================================

def process_all_shorts(
    input_video,
    clips
):

    if not clips:
        print(
            "No clips to process."
        )

        return []

    input_video = os.path.abspath(
        input_video
    )

    if not os.path.isfile(
        input_video
    ):
        raise FileNotFoundError(
            f"Input video not found:\n{input_video}"
        )

    print()
    print(
        "=" * 60
    )

    print(
        "CLIPFORGE AI VIDEO PIPELINE"
    )

    print(
        f"Input video: {input_video}"
    )

    print(
        f"Total shorts: {len(clips)}"
    )

    print(
        "=" * 60
    )

    results = []

    failed = []

    # ========================================================
    # PROCESS EACH SHORT
    # ========================================================

    for index, clip in enumerate(
        clips,
        start=1
    ):

        try:

            result = process_short(
                input_video=input_video,
                clip=clip,
                index=index
            )

            results.append(
                result
            )

        except Exception as error:

            print()
            print(
                f"SHORT #{index} FAILED"
            )

            print(
                str(error)
            )

            failed.append(
                {
                    "index": index,
                    "error": str(error)
                }
            )

    # ========================================================
    # FINAL REPORT
    # ========================================================

    print()
    print(
        "=" * 60
    )

    print(
        "VIDEO PIPELINE FINISHED"
    )

    print(
        f"Successful: {len(results)}"
    )

    print(
        f"Failed:     {len(failed)}"
    )

    print(
        "=" * 60
    )

    # --------------------------------------------------------
    # SUCCESS FILES
    # --------------------------------------------------------

    for index, path in enumerate(
        results,
        start=1
    ):

        print(
            f"Short {index}: {path}"
        )

    # --------------------------------------------------------
    # FAILURES
    # --------------------------------------------------------

    if failed:

        print()
        print(
            "FAILED SHORTS:"
        )

        for item in failed:

            print(
                f"Short #{item['index']}: "
                f"{item['error']}"
            )

    return results


# ============================================================
# CLEAN GENERATED EXPORTS
# ============================================================

def clean_exports():

    """
    Faqat ClipForgeAI yaratgan export fayllarini
    tozalash uchun helper.
    """

    if not os.path.isdir(
        EXPORT_FOLDER
    ):
        return

    for filename in os.listdir(
        EXPORT_FOLDER
    ):

        path = os.path.join(
            EXPORT_FOLDER,
            filename
        )

        if os.path.isfile(
            path
        ):

            try:
                os.remove(
                    path
                )

            except Exception as error:

                print(
                    f"Could not remove {path}: "
                    f"{error}"
                )

    # subtitles folder
    if os.path.isdir(
        SUBTITLE_FOLDER
    ):

        shutil.rmtree(
            SUBTITLE_FOLDER,
            ignore_errors=True
        )

        os.makedirs(
            SUBTITLE_FOLDER,
            exist_ok=True
        )

    print(
        "Exports cleaned."
    )
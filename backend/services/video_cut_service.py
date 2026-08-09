import os
import ffmpeg


# ============================================================
# BASE / EXPORT FOLDER
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

os.makedirs(
    EXPORT_FOLDER,
    exist_ok=True
)


# ============================================================
# HELPERS
# ============================================================

def _absolute_output_path(output_name):
    """
    Export fayl uchun absolute path yaratadi.
    """

    if os.path.isabs(output_name):
        return output_name

    return os.path.abspath(
        os.path.join(
            EXPORT_FOLDER,
            output_name
        )
    )


def _check_input_file(input_file):
    """
    Input video mavjudligini tekshiradi.
    """

    input_file = os.path.abspath(
        input_file
    )

    if not os.path.isfile(
        input_file
    ):
        raise FileNotFoundError(
            f"Input video not found:\n{input_file}"
        )

    return input_file


# ============================================================
# CUT + 9:16 CROP
# ============================================================

def cut_video(
    input_file,
    start,
    end,
    output_name
):

    input_file = _check_input_file(
        input_file
    )

    output_path = _absolute_output_path(
        output_name
    )

    start = float(start)
    end = float(end)

    duration = end - start

    if duration <= 0:
        raise ValueError(
            "Invalid video duration."
        )

    print()
    print(
        "=" * 60
    )
    print(
        "CUTTING SHORT"
    )
    print(
        f"Start: {start:.3f}s"
    )
    print(
        f"End:   {end:.3f}s"
    )
    print(
        f"Duration: {duration:.3f}s"
    )
    print(
        f"Input: {input_file}"
    )
    print(
        f"Output: {output_path}"
    )
    print(
        "=" * 60
    )

    # --------------------------------------------------------
    # 9:16 SHORTS FORMAT
    # --------------------------------------------------------
    #
    # Original videoni 1080x1920 ga scale qiladi.
    # Aspect ratio saqlanadi.
    # Keyin markazdan 9:16 crop qiladi.
    #

    video_filter = (
        "scale=1080:1920:"
        "force_original_aspect_ratio=increase,"
        "crop=1080:1920"
    )

    try:

        (
            ffmpeg
            .input(
                input_file,
                ss=start
            )
            .output(
                output_path,

                t=duration,

                vf=video_filter,

                vcodec="libx264",
                preset="medium",
                crf=20,

                pix_fmt="yuv420p",

                acodec="aac",
                audio_bitrate="192k",

                movflags="+faststart"
            )
            .overwrite_output()
            .run()
        )

    except ffmpeg.Error as error:

        print()
        print(
            "FFMPEG ERROR WHILE CUTTING VIDEO"
        )

        if error.stderr:
            try:
                print(
                    error.stderr.decode(
                        "utf-8",
                        errors="ignore"
                    )
                )
            except Exception:
                pass

        raise

    if not os.path.isfile(
        output_path
    ):
        raise FileNotFoundError(
            f"Video cut failed:\n{output_path}"
        )

    print(
        "VIDEO CUT SUCCESS"
    )

    return output_path


# ============================================================
# BURN SUBTITLES
# ============================================================

def burn_subtitles(
    input_video,
    subtitle_file,
    output_video
):

    input_video = os.path.abspath(
        input_video
    )

    subtitle_file = os.path.abspath(
        subtitle_file
    )

    output_video = os.path.abspath(
        output_video
    )

    print()
    print(
        "=" * 60
    )
    print(
        "BURNING SUBTITLES"
    )
    print(
        f"Video:    {input_video}"
    )
    print(
        f"Subtitle: {subtitle_file}"
    )
    print(
        f"Output:   {output_video}"
    )
    print(
        "=" * 60
    )

    # --------------------------------------------------------
    # CHECK FILES
    # --------------------------------------------------------

    if not os.path.isfile(
        input_video
    ):
        raise FileNotFoundError(
            f"Input video not found:\n{input_video}"
        )

    if not os.path.isfile(
        subtitle_file
    ):
        raise FileNotFoundError(
            f"Subtitle file not found:\n{subtitle_file}"
        )

    # --------------------------------------------------------
    # OUTPUT FOLDER
    # --------------------------------------------------------

    output_folder = os.path.dirname(
        output_video
    )

    if output_folder:
        os.makedirs(
            output_folder,
            exist_ok=True
        )

    # --------------------------------------------------------
    # WINDOWS PATH FOR FFmpeg
    # --------------------------------------------------------

    subtitle_path = (
        subtitle_file
        .replace("\\", "/")
        .replace(":", "\\:")
        .replace("'", "\\'")
    )

    # --------------------------------------------------------
    # ASS SUBTITLE FILTER
    # --------------------------------------------------------

    subtitle_filter = (
        f"subtitles='{subtitle_path}'"
        ":original_size=1080x1920"
    )

    print(
        f"Subtitle filter: {subtitle_filter}"
    )

    # --------------------------------------------------------
    # BURN
    # --------------------------------------------------------

    try:

        (
            ffmpeg
            .input(
                input_video
            )
            .output(
                output_video,

                vf=subtitle_filter,

                vcodec="libx264",

                preset="medium",

                crf=20,

                pix_fmt="yuv420p",

                acodec="aac",

                audio_bitrate="192k",

                movflags="+faststart"
            )
            .overwrite_output()
            .run()
        )

    except ffmpeg.Error as error:

        print()
        print(
            "FFMPEG ERROR WHILE BURNING SUBTITLES"
        )

        if error.stderr:
            try:
                print(
                    error.stderr.decode(
                        "utf-8",
                        errors="ignore"
                    )
                )
            except Exception:
                pass

        raise

    # --------------------------------------------------------
    # CHECK RESULT
    # --------------------------------------------------------

    if not os.path.isfile(
        output_video
    ):
        raise FileNotFoundError(
            f"Subtitle burn failed:\n{output_video}"
        )

    print(
        "SUBTITLES SUCCESSFULLY BURNED"
    )

    return output_video
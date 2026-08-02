import os
import ffmpeg

EXPORT_FOLDER = "exports"

os.makedirs(EXPORT_FOLDER, exist_ok=True)


def cut_video(input_file, start, end, output_name):

    output_path = os.path.join(
        EXPORT_FOLDER,
        output_name
    )

    (
        ffmpeg
        .input(input_file, ss=start, to=end)
        .output(
            output_path,
            vcodec="libx264",
            acodec="aac",
            audio_bitrate="192k"
        )
        .overwrite_output()
        .run()
    )

    return output_path
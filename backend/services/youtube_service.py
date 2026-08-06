import os
import yt_dlp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def download_youtube(url: str):

    ydl_opts = {
        "outtmpl": os.path.join(UPLOAD_FOLDER, "%(title)s.%(ext)s"),
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": False,
        "no_warnings": False,

        # Browser cookies
        "cookiesfrombrowser": ("chrome",),

        # Browserga o'xshab ko'rinishi uchun
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/139.0 Safari/537.36"
            )
        }
    }

    try:

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:

            info = ydl.extract_info(url, download=True)

            filename = ydl.prepare_filename(info)

            filename = os.path.splitext(filename)[0] + ".mp4"

            return os.path.basename(filename)

    except yt_dlp.utils.DownloadError as e:

        print("YT-DLP ERROR:", e)

        # Cookie o'qib bo'lmasa oddiy usulda urinib ko'ramiz
        if "cookie" in str(e).lower():

            print("Retry without browser cookies...")

            ydl_opts.pop("cookiesfrombrowser", None)

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:

                info = ydl.extract_info(url, download=True)

                filename = ydl.prepare_filename(info)

                filename = os.path.splitext(filename)[0] + ".mp4"

                return os.path.basename(filename)

        raise
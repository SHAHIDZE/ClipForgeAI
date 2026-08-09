import os
import re
import yt_dlp


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)


# ============================================================
# UPLOAD FOLDER
# ============================================================

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "backend",
    "uploads",
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True,
)


# ============================================================
# DENO
# ============================================================

DENO_PATH = r"C:\Users\User\.deno\bin\deno.exe"


# ============================================================
# VALIDATE YOUTUBE URL
# ============================================================

def _validate_youtube_url(url: str) -> str:

    url = url.strip()

    if not url:
        raise ValueError(
            "YouTube URL kiritilmadi."
        )

    patterns = [
        r"^https?://(www\.)?youtube\.com/watch\?v=",
        r"^https?://youtu\.be/",
        r"^https?://(www\.)?youtube\.com/shorts/",
    ]

    if not any(
        re.match(pattern, url, re.IGNORECASE)
        for pattern in patterns
    ):
        raise ValueError(
            "Faqat YouTube video URL kiriting."
        )

    return url


# ============================================================
# FIND DOWNLOADED FILE
# ============================================================

def _find_downloaded_file(
    info,
    ydl,
):
    """
    yt-dlp yaratgan final faylni topadi.
    """

    # --------------------------------------------------------
    # Requested filename
    # --------------------------------------------------------

    try:

        requested = ydl.prepare_filename(
            info
        )

        if os.path.isfile(requested):
            return requested

        base = os.path.splitext(
            requested
        )[0]

        # MP4
        mp4_path = (
            base
            + ".mp4"
        )

        if os.path.isfile(
            mp4_path
        ):
            return mp4_path

    except Exception:
        pass

    # --------------------------------------------------------
    # Look for matching files
    # --------------------------------------------------------

    title = info.get(
        "title"
    )

    if title:

        safe_title = re.sub(
            r'[<>:"/\\|?*]',
            "_",
            title,
        )

        candidates = []

        for filename in os.listdir(
            UPLOAD_FOLDER
        ):

            full_path = os.path.join(
                UPLOAD_FOLDER,
                filename,
            )

            if not os.path.isfile(
                full_path
            ):
                continue

            name_without_ext = os.path.splitext(
                filename
            )[0]

            if (
                name_without_ext == title
                or name_without_ext == safe_title
            ):
                candidates.append(
                    full_path
                )

        if candidates:

            candidates.sort(
                key=os.path.getmtime
            )

            return candidates[-1]

    return None


# ============================================================
# DOWNLOAD YOUTUBE
# ============================================================

def download_youtube(
    url: str,
):

    url = _validate_youtube_url(
        url
    )

    print()
    print("=" * 70)
    print("CLIPFORGE AI - YOUTUBE DOWNLOAD")
    print("=" * 70)
    print(
        f"URL: {url}"
    )
    print(
        f"Output: {UPLOAD_FOLDER}"
    )
    print("=" * 70)
    print()


    # ========================================================
    # CHECK DENO
    # ========================================================

    if not os.path.isfile(
        DENO_PATH
    ):

        print(
            "WARNING: Deno topilmadi."
        )

        print(
            f"Expected: {DENO_PATH}"
        )


    # ========================================================
    # YT-DLP OPTIONS
    # ========================================================

    ydl_opts = {

        # ----------------------------------------------------
        # OUTPUT
        # ----------------------------------------------------

        "outtmpl": os.path.join(
            UPLOAD_FOLDER,
            "%(title)s.%(ext)s",
        ),

        # ----------------------------------------------------
        # FORMAT
        # ----------------------------------------------------

        "format": (
            "bv*[height<=1080]+ba/"
            "b[height<=1080]/"
            "best"
        ),

        "merge_output_format": "mp4",

        "noplaylist": True,

        # ----------------------------------------------------
        # JAVASCRIPT
        # ----------------------------------------------------

        "js_runtimes": {
            "deno": {
                "path": DENO_PATH,
            }
        },

        "remote_components": [
            "ejs:github",
        ],

        # ----------------------------------------------------
        # NETWORK
        # ----------------------------------------------------

        "retries": 3,

        "fragment_retries": 3,

        "file_access_retries": 3,

        "extractor_retries": 3,

        # ----------------------------------------------------
        # HTTP
        # ----------------------------------------------------

        "http_headers": {
            "Accept-Language": (
                "en-US,en;q=0.9"
            ),
        },

        # ----------------------------------------------------
        # PERFORMANCE
        # ----------------------------------------------------

        "concurrent_fragment_downloads": 4,

        # ----------------------------------------------------
        # OUTPUT
        # ----------------------------------------------------

        "quiet": False,

        "no_warnings": False,

        "progress": True,

        # ----------------------------------------------------
        # CACHE
        # ----------------------------------------------------

        "cachedir": os.path.join(
            BASE_DIR,
            ".yt-dlp-cache",
        ),
    }


    # ========================================================
    # DOWNLOAD
    # ========================================================

    try:

        with yt_dlp.YoutubeDL(
            ydl_opts
        ) as ydl:

            print(
                "Extracting video information..."
            )

            info = ydl.extract_info(
                url,
                download=True,
            )

            if not info:

                raise RuntimeError(
                    "YouTube video ma'lumotini "
                    "olib bo'lmadi."
                )


            # =================================================
            # FIND FINAL FILE
            # =================================================

            downloaded_file = (
                _find_downloaded_file(
                    info,
                    ydl,
                )
            )


            if not downloaded_file:

                raise RuntimeError(
                    "Video yuklandi deb ko'rindi, "
                    "lekin final fayl topilmadi."
                )


            # =================================================
            # FINAL NAME
            # =================================================

            final_name = os.path.basename(
                downloaded_file
            )


            # =================================================
            # SUCCESS
            # =================================================

            print()
            print("=" * 70)
            print("YOUTUBE DOWNLOAD SUCCESS")
            print("=" * 70)
            print(
                f"File: {final_name}"
            )
            print(
                f"Path: {downloaded_file}"
            )
            print("=" * 70)
            print()


            return final_name


    # ========================================================
    # YT-DLP ERROR
    # ========================================================

    except yt_dlp.utils.DownloadError as e:

        error = str(e)

        print()
        print("=" * 70)
        print("YT-DLP DOWNLOAD ERROR")
        print("=" * 70)
        print(error)
        print("=" * 70)
        print()


        error_lower = (
            error.lower()
        )


        # ----------------------------------------------------
        # BOT / RATE LIMIT
        # ----------------------------------------------------

        if (
            "429" in error_lower
            or "sign in to confirm" in error_lower
            or "not a bot" in error_lower
            or "bot verification" in error_lower
            or "too many requests" in error_lower
        ):

            raise RuntimeError(
                "YouTube hozir bu qurilmadan "
                "yuklab olishni blokladi "
                "(429/bot verification). "
                "Birozdan keyin qayta urinib ko'ring "
                "yoki videoni fayl sifatida yuklang."
            ) from e


        # ----------------------------------------------------
        # FORMAT ERROR
        # ----------------------------------------------------

        if (
            "requested format is not available"
            in error_lower
        ):

            raise RuntimeError(
                "YouTube hozir mavjud formatlarni "
                "qaytarmadi. Keyinroq qayta urinib ko'ring."
            ) from e


        # ----------------------------------------------------
        # GENERIC YT-DLP ERROR
        # ----------------------------------------------------

        raise RuntimeError(
            "YouTube video yuklab bo'lmadi: "
            f"{error}"
        ) from e


    # ========================================================
    # GENERAL ERROR
    # ========================================================

    except Exception as e:

        print()
        print("=" * 70)
        print("YOUTUBE DOWNLOAD GENERAL ERROR")
        print("=" * 70)
        print(e)
        print("=" * 70)
        print()


        raise RuntimeError(
            f"Video yuklab bo'lmadi: {e}"
        ) from e
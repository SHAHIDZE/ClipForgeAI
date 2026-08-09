import os
import pysubs2

# ==========================================================
# SETTINGS
# ==========================================================

FONT_NAME = "Montserrat ExtraBold"
FONT_SIZE = 120

# Bir qatorda maksimum so'z
MAX_WORDS = 3

# Shorts resolution
PLAY_RES_X = 1080
PLAY_RES_Y = 1920

# ==========================================================
# COLORS
# ==========================================================

WHITE = pysubs2.Color(255, 255, 255)
YELLOW = pysubs2.Color(255, 210, 0)
BLACK = pysubs2.Color(0, 0, 0)


# ==========================================================
# CREATE SUBTITLES
# ==========================================================

def create_subtitles(
    segments,
    output_path,
    time_offset=0.0
):

    subs = pysubs2.SSAFile()

    # ======================================================
    # ASS SETTINGS
    # ======================================================

    subs.info["PlayResX"] = str(PLAY_RES_X)
    subs.info["PlayResY"] = str(PLAY_RES_Y)

    subs.info["WrapStyle"] = "2"
    subs.info["ScaledBorderAndShadow"] = "yes"

    # ======================================================
    # STYLE
    # ======================================================

    style = pysubs2.SSAStyle()

    style.fontname = FONT_NAME
    style.fontsize = FONT_SIZE
    style.bold = True

    style.primarycolor = WHITE
    style.secondarycolor = WHITE
    style.outlinecolor = BLACK
    style.backcolor = BLACK

    style.outline = 3
    style.shadow = 0

    # Bottom center
    style.alignment = 2

    style.marginl = 70
    style.marginr = 70

    # Subtitle position
    style.marginv = 430

    style.wrapstyle = 2

    subs.styles["Default"] = style

    # ======================================================
    # COLLECT WORDS
    # ======================================================

    all_words = []

    for segment in segments:

        words = segment.get("words", [])

        # ==================================================
        # REAL WORD TIMINGS
        # ==================================================

        if words:

            for word in words:

                text = str(
                    word.get("word", "")
                ).strip()

                if not text:
                    continue

                try:
                    start = float(
                        word["start"]
                    )

                    end = float(
                        word["end"]
                    )

                except (
                    ValueError,
                    TypeError,
                    KeyError
                ):
                    continue

                # IMPORTANT:
                # Don't invent or modify timing
                if end <= start:
                    continue

                all_words.append(
                    {
                        "text": text,
                        "start": start,
                        "end": end
                    }
                )

        # ==================================================
        # FALLBACK
        # ==================================================

        else:

            text = str(
                segment.get("text", "")
            ).strip()

            if not text:
                continue

            try:
                start = float(
                    segment["start"]
                )

                end = float(
                    segment["end"]
                )

            except (
                ValueError,
                TypeError,
                KeyError
            ):
                continue

            # Fallback only if real word timings
            # are completely unavailable.

            parts = text.split()

            if not parts:
                continue

            duration = (
                end - start
            ) / len(parts)

            for i, part in enumerate(parts):

                word_start = (
                    start +
                    i * duration
                )

                word_end = (
                    start +
                    (i + 1) * duration
                )

                all_words.append(
                    {
                        "text": part,
                        "start": word_start,
                        "end": word_end
                    }
                )

    # ======================================================
    # SORT WORDS
    # ======================================================

    all_words.sort(
        key=lambda x: x["start"]
    )

    # ======================================================
    # APPLY CLIP OFFSET
    # ======================================================

    cleaned_words = []

    for word in all_words:

        original_start = float(
            word["start"]
        )

        original_end = float(
            word["end"]
        )

        # Offset is applied ONCE
        start = (
            original_start -
            float(time_offset)
        )

        end = (
            original_end -
            float(time_offset)
        )

        # Completely before clip
        if end <= 0:
            continue

        # Clip starts inside this word
        if start < 0:
            start = 0.0

        # Never allow invalid event
        if end <= start:
            continue

        cleaned_words.append(
            {
                "text": word["text"],
                "start": start,
                "end": end
            }
        )

    # ======================================================
    # CREATE GROUPS
    #
    # IMPORTANT:
    # Groups contain consecutive words.
    # We DO NOT change their timestamps.
    # ======================================================

    groups = []

    current_group = []

    for word in cleaned_words:

        current_group.append(word)

        if len(current_group) == MAX_WORDS:

            groups.append(
                current_group
            )

            current_group = []

    if current_group:

        groups.append(
            current_group
        )

    # ======================================================
    # CREATE SUBTITLE EVENTS
    # ======================================================

    for group in groups:

        if not group:
            continue

        # ==================================================
        # EACH WORD GETS ITS OWN EXACT TIME
        # ==================================================

        for active_index, active_word in enumerate(group):

            start = active_word["start"]
            end = active_word["end"]

            # ----------------------------------------------
            # Build text
            # ----------------------------------------------

            parts = []

            for index, word in enumerate(group):

                text = word["text"]

                # ------------------------------------------
                # ONLY CURRENT WORD IS YELLOW
                # ------------------------------------------

                if index == active_index:

                    parts.append(
                        r"{\1c&H00D2FF&}"
                        + text
                        + r"{\1c&HFFFFFF&}"
                    )

                else:

                    parts.append(text)

            subtitle_text = " ".join(parts)

            # ----------------------------------------------
            # Remove accidental line breaks
            # ----------------------------------------------

            subtitle_text = (
                subtitle_text
                .replace("\r", " ")
                .replace("\n", " ")
            )

            # ----------------------------------------------
            # EXACT EVENT
            # ----------------------------------------------

            event = pysubs2.SSAEvent(
                start=round(start * 1000),
                end=round(end * 1000),
                text=subtitle_text
            )

            event.style = "Default"

            subs.events.append(event)

    # ======================================================
    # SORT EVENTS
    # ======================================================

    subs.events.sort(
        key=lambda event: (
            event.start,
            event.end
        )
    )

    # ======================================================
    # SAVE
    # ======================================================

    folder = os.path.dirname(
        output_path
    )

    if folder:

        os.makedirs(
            folder,
            exist_ok=True
        )

    subs.save(
        output_path,
        format="ass"
    )

    # ======================================================
    # DEBUG
    # ======================================================

    print(
        f"SUBTITLE CREATED: {output_path}"
    )

    print(
        f"SUBTITLE EVENTS: {len(subs.events)}"
    )

    print(
        f"SUBTITLE WORDS: {len(cleaned_words)}"
    )

    print(
        f"SUBTITLE GROUPS: {len(groups)}"
    )

    print(
        f"SUBTITLE OFFSET: {time_offset}"
    )

    print("----- FINAL WORD TIMINGS -----")

    for word in cleaned_words:

        print(
            f"{word['start']:.3f} -> "
            f"{word['end']:.3f} | "
            f"{word['text']}"
        )

    print("------------------------------")

    
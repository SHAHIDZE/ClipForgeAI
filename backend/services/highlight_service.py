import re

from backend.services.energy_service import energy_score
from backend.services.emotion_service import emotion_bonus


# ============================================================
# SETTINGS
# ============================================================

MIN_DURATION = 20.0
MAX_DURATION = 55.0

IDEAL_MIN = 27.0
IDEAL_MAX = 45.0

PADDING_BEFORE = 0.45
PADDING_AFTER = 0.70

SPEECH_GAP = 1.20

FORCED_END_DURATION = 42.0

# Final short count
TARGET_SHORTS = 10

# ============================================================
# DUPLICATE SETTINGS
# ============================================================

DUPLICATE_OVERLAP_RATIO = 0.60
DUPLICATE_COVERAGE = 0.78
DUPLICATE_CENTER_DISTANCE = 10.0
DUPLICATE_TEXT_SIMILARITY = 0.62

# ============================================================
# FINAL DIVERSITY SETTINGS
# ============================================================

# Bir xil momentdagi cliplarni ajratish
FINAL_OVERLAP_RATIO = 0.35
FINAL_COVERAGE = 0.55
FINAL_CENTER_DISTANCE = 20.0
FINAL_TEXT_SIMILARITY = 0.72

# Video bo'ylab tarqatish
MIN_FINAL_CENTER_DISTANCE = 24.0

# ============================================================
# VIRAL KEYWORDS
# ============================================================

KEYWORDS = {
    "wow": 35,
    "no way": 45,
    "wtf": 45,
    "what": 18,
    "impossible": 40,
    "unbelievable": 40,
    "insane": 40,
    "crazy": 35,
    "let's go": 35,
    "lets go": 35,
    "bro": 15,

    "oh my god": 45,
    "omg": 45,
    "seriously": 25,
    "listen": 15,
    "look": 15,

    "cry": 30,
    "laugh": 25,
    "dead": 20,
    "screaming": 40,

    "winner": 35,
    "won": 30,
    "win": 30,
    "lose": 25,
    "lost": 25,

    "million": 40,
    "money": 25,
    "dollar": 25,

    "wait": 20,
    "wait what": 40,
    "hold on": 30,
    "shut up": 30,
    "are you serious": 40,
    "for real": 25,

    "no": 10,
    "yes": 10,
}


# ============================================================
# HOOK WORDS
# ============================================================

HOOK_WORDS = {
    "wait",
    "look",
    "listen",
    "bro",
    "what",
    "no",
    "why",
    "how",
    "watch",
    "guys",
    "hold",
}


# ============================================================
# CONTINUATION WORDS
# ============================================================

CONTINUATION_WORDS = {
    "and",
    "but",
    "because",
    "so",
    "then",
    "if",
    "when",
    "while",
    "that",
    "which",
    "who",
    "where",
    "to",
    "of",
    "for",
    "with",
    "like",
    "as",
    "than",
    "or",
    "yet",
    "though",
    "although",
    "from",
    "into",
}


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_words(text: str):

    if not text:
        return []

    return re.findall(
        r"\b[a-zA-Z0-9']+\b",
        text.lower(),
    )


# ============================================================
# TEXT SIMILARITY
# ============================================================

def text_similarity(text_a, text_b):

    words_a = set(
        normalize_words(text_a)
    )

    words_b = set(
        normalize_words(text_b)
    )

    if not words_a or not words_b:
        return 0.0

    intersection = len(
        words_a.intersection(words_b)
    )

    union = len(
        words_a.union(words_b)
    )

    if union <= 0:
        return 0.0

    return intersection / union


# ============================================================
# SCORE TEXT
# ============================================================

def score_text(text: str):

    if not text:
        return 0.0

    text_lower = text.lower().strip()

    score = 0.0

    # --------------------------------------------------------
    # KEYWORDS
    # --------------------------------------------------------

    for keyword, value in KEYWORDS.items():

        if keyword in text_lower:
            score += value

    # --------------------------------------------------------
    # WORD COUNT
    # --------------------------------------------------------

    words = normalize_words(
        text_lower
    )

    word_count = len(words)

    if 18 <= word_count <= 85:
        score += 30

    elif 12 <= word_count < 18:
        score += 15

    elif 8 <= word_count < 12:
        score += 5

    elif word_count < 5:
        score -= 30

    elif word_count > 120:
        score -= 25

    # --------------------------------------------------------
    # EXCLAMATIONS
    # --------------------------------------------------------

    exclamations = text.count("!")

    score += min(
        exclamations * 8,
        32,
    )

    # --------------------------------------------------------
    # QUESTIONS
    # --------------------------------------------------------

    questions = text.count("?")

    score += min(
        questions * 7,
        28,
    )

    # --------------------------------------------------------
    # NUMBERS
    # --------------------------------------------------------

    if re.search(r"\d+", text):
        score += 10

    # --------------------------------------------------------
    # ENERGY
    # --------------------------------------------------------

    try:

        score += float(
            energy_score(text)
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # EMOTION
    # --------------------------------------------------------

    try:

        score += float(
            emotion_bonus(text)
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # HOOK
    # --------------------------------------------------------

    for word in words[:6]:

        if word in HOOK_WORDS:

            score += 18
            break

    # --------------------------------------------------------
    # REPEATED PUNCTUATION
    # --------------------------------------------------------

    if "!!" in text:
        score += 10

    if "??" in text:
        score += 8

    return score


# ============================================================
# WORD TIMINGS
# ============================================================

def get_word_timings(segment):

    words = []

    for word in segment.get(
        "words",
        [],
    ):

        try:

            text = str(
                word.get(
                    "word",
                    "",
                )
            ).strip()

            start = float(
                word["start"]
            )

            end = float(
                word["end"]
            )

        except (
            KeyError,
            TypeError,
            ValueError,
        ):

            continue

        if not text:
            continue

        if end <= start:
            continue

        words.append(
            {
                "word": text,
                "start": start,
                "end": end,
            }
        )

    return words


# ============================================================
# NATURAL END CHECK
# ============================================================

def is_natural_end(
    current_segment,
    next_segment=None,
):

    words = get_word_timings(
        current_segment
    )

    if not words:
        return False

    last_word = words[-1]

    raw_word = (
        last_word["word"]
        .strip()
    )

    clean_word = (
        raw_word
        .lower()
        .strip(".,!?;:")
    )

    # --------------------------------------------------------
    # CONTINUATION WORD
    # --------------------------------------------------------

    if clean_word in CONTINUATION_WORDS:
        return False

    # --------------------------------------------------------
    # STRONG PUNCTUATION
    # --------------------------------------------------------

    if raw_word.endswith(
        (".", "!", "?")
    ):

        return True

    # --------------------------------------------------------
    # NO NEXT
    # --------------------------------------------------------

    if next_segment is None:
        return True

    next_words = get_word_timings(
        next_segment
    )

    if not next_words:
        return True

    next_start = next_words[0]["start"]

    gap = (
        next_start
        -
        last_word["end"]
    )

    return gap >= 0.55


# ============================================================
# NATURAL START
# ============================================================

def find_natural_start(
    segments,
    index,
):

    current = segments[index]

    words = get_word_timings(
        current
    )

    if words:
        return words[0]["start"]

    return float(
        current["start"]
    )


# ============================================================
# NATURAL END
# ============================================================

def find_natural_end(
    segments,
    index,
):

    current = segments[index]

    words = get_word_timings(
        current
    )

    if words:
        return words[-1]["end"]

    return float(
        current["end"]
    )


# ============================================================
# COLLECT WORDS
# ============================================================

def collect_clip_words(
    segments,
    clip_start,
    clip_end,
):

    result = []

    for segment in segments:

        seg_start = float(
            segment["start"]
        )

        seg_end = float(
            segment["end"]
        )

        if seg_end <= clip_start:
            continue

        if seg_start >= clip_end:
            break

        for word in segment.get(
            "words",
            [],
        ):

            try:

                word_start = float(
                    word["start"]
                )

                word_end = float(
                    word["end"]
                )

            except (
                KeyError,
                TypeError,
                ValueError,
            ):

                continue

            if (
                word_end > clip_start
                and
                word_start < clip_end
            ):

                word_text = str(
                    word.get(
                        "word",
                        "",
                    )
                ).strip()

                if not word_text:
                    continue

                result.append(
                    {
                        "word": word_text,
                        "start": word_start,
                        "end": word_end,
                    }
                )

    return result


# ============================================================
# OVERLAP RATIO
# ============================================================

def calculate_overlap_ratio(
    start_a,
    end_a,
    start_b,
    end_b,
):

    intersection = max(
        0.0,
        min(end_a, end_b)
        -
        max(start_a, start_b),
    )

    if intersection <= 0:
        return 0.0

    duration_a = max(
        end_a - start_a,
        0.001,
    )

    duration_b = max(
        end_b - start_b,
        0.001,
    )

    shorter = min(
        duration_a,
        duration_b,
    )

    return (
        intersection
        /
        shorter
    )


# ============================================================
# COVERAGE
# ============================================================

def calculate_coverage(
    start_a,
    end_a,
    start_b,
    end_b,
):

    intersection = max(
        0.0,
        min(end_a, end_b)
        -
        max(start_a, start_b),
    )

    if intersection <= 0:
        return 0.0

    duration_a = max(
        end_a - start_a,
        0.001,
    )

    duration_b = max(
        end_b - start_b,
        0.001,
    )

    coverage_a = (
        intersection
        /
        duration_a
    )

    coverage_b = (
        intersection
        /
        duration_b
    )

    return max(
        coverage_a,
        coverage_b,
    )


# ============================================================
# CENTER DISTANCE
# ============================================================

def center_distance(
    start_a,
    end_a,
    start_b,
    end_b,
):

    center_a = (
        start_a
        +
        end_a
    ) / 2.0

    center_b = (
        start_b
        +
        end_b
    ) / 2.0

    return abs(
        center_a
        -
        center_b
    )


# ============================================================
# SAME MOMENT
# ============================================================

def is_same_moment(
    candidate,
    picked,
):

    overlap_ratio = calculate_overlap_ratio(
        candidate["start"],
        candidate["end"],
        picked["start"],
        picked["end"],
    )

    coverage = calculate_coverage(
        candidate["start"],
        candidate["end"],
        picked["start"],
        picked["end"],
    )

    distance = center_distance(
        candidate["start"],
        candidate["end"],
        picked["start"],
        picked["end"],
    )

    similarity = text_similarity(
        candidate.get("text", ""),
        picked.get("text", ""),
    )

    if overlap_ratio >= DUPLICATE_OVERLAP_RATIO:
        return True

    if coverage >= DUPLICATE_COVERAGE:
        return True

    if (
        similarity >= DUPLICATE_TEXT_SIMILARITY
        and
        distance < 32
    ):

        return True

    if (
        distance < DUPLICATE_CENTER_DISTANCE
        and
        overlap_ratio >= 0.20
    ):

        return True

    return False


# ============================================================
# CANDIDATE QUALITY
# ============================================================

def candidate_quality(candidate):

    score = float(
        candidate.get(
            "score",
            0,
        )
    )

    duration = float(
        candidate.get(
            "duration",
            0,
        )
    )

    if candidate.get(
        "natural_end",
        False,
    ):

        score += 18

    if (
        IDEAL_MIN
        <= duration
        <= IDEAL_MAX
    ):

        score += 15

    elif (
        24
        <= duration
        < IDEAL_MIN
    ):

        score += 8

    elif (
        IDEAL_MAX
        <
        duration
        <= MAX_DURATION
    ):

        score += 8

    word_count = len(
        normalize_words(
            candidate.get(
                "text",
                "",
            )
        )
    )

    wps = (
        word_count
        /
        max(
            duration,
            1,
        )
    )

    if wps >= 1.6:
        score += 12

    elif wps >= 1.0:
        score += 7

    elif wps < 0.45:
        score -= 15

    return score


# ============================================================
# BUILD CANDIDATE
# ============================================================

def build_candidate(
    valid_segments,
    start_index,
    end_index,
    range_start,
    range_end,
):

    current_segments = (
        valid_segments[
            start_index:
            end_index + 1
        ]
    )

    if not current_segments:
        return None

    raw_start = find_natural_start(
        valid_segments,
        start_index,
    )

    raw_end = find_natural_end(
        valid_segments,
        end_index,
    )

    raw_start = max(
        range_start,
        raw_start,
    )

    raw_end = min(
        range_end,
        raw_end,
    )

    current_duration = (
        raw_end
        -
        raw_start
    )

    if current_duration < MIN_DURATION:
        return None

    if current_duration > MAX_DURATION:
        return None

    next_segment = None

    if (
        end_index + 1
        <
        len(valid_segments)
    ):

        next_segment = (
            valid_segments[
                end_index + 1
            ]
        )

    natural_end = is_natural_end(
        valid_segments[end_index],
        next_segment,
    )

    final_start = max(
        range_start,
        raw_start - PADDING_BEFORE,
    )

    final_end = min(
        range_end,
        raw_end + PADDING_AFTER,
    )

    final_duration = (
        final_end
        -
        final_start
    )

    if final_duration < MIN_DURATION:
        return None

    if final_duration > MAX_DURATION:
        return None

    text = " ".join(
        str(
            seg.get(
                "text",
                "",
            )
        ).strip()
        for seg in current_segments
    ).strip()

    if not text:
        return None

    score = float(
        score_text(text)
    )

    # --------------------------------------------------------
    # DURATION SCORE
    # --------------------------------------------------------

    if (
        IDEAL_MIN
        <= final_duration
        <= IDEAL_MAX
    ):

        score += 40

    elif (
        24
        <= final_duration
        < IDEAL_MIN
    ):

        score += 25

    elif (
        IDEAL_MAX
        <
        final_duration
        <= MAX_DURATION
    ):

        score += 24

    else:

        score += 8

    # --------------------------------------------------------
    # NATURAL END
    # --------------------------------------------------------

    if natural_end:
        score += 30
    else:
        score -= 5

    # --------------------------------------------------------
    # LAST TEXT
    # --------------------------------------------------------

    last_text = str(
        valid_segments[end_index].get(
            "text",
            "",
        )
    ).strip()

    if last_text.endswith(
        ("!", "?")
    ):

        score += 18

    elif last_text.endswith("."):

        score += 12

    # --------------------------------------------------------
    # PAUSE
    # --------------------------------------------------------

    if next_segment is not None:

        current_words = get_word_timings(
            valid_segments[end_index]
        )

        next_words = get_word_timings(
            next_segment
        )

        if current_words and next_words:

            gap_after = (
                next_words[0]["start"]
                -
                current_words[-1]["end"]
            )

            if gap_after >= 0.55:
                score += 8

            if gap_after >= 1.20:
                score += 8

            if gap_after >= 1.80:
                score += 5

    else:

        score += 12

    # --------------------------------------------------------
    # HOOK
    # --------------------------------------------------------

    first_text = str(
        current_segments[0].get(
            "text",
            "",
        )
    ).lower()

    first_words = normalize_words(
        first_text
    )

    if any(
        word in HOOK_WORDS
        for word in first_words[:6]
    ):

        score += 18

    # --------------------------------------------------------
    # WORD DENSITY
    # --------------------------------------------------------

    word_count = len(
        normalize_words(text)
    )

    words_per_second = (
        word_count
        /
        max(
            final_duration,
            1,
        )
    )

    if words_per_second >= 2.0:

        score += 15

    elif words_per_second >= 1.3:

        score += 10

    elif words_per_second >= 0.9:

        score += 5

    elif words_per_second < 0.55:

        score -= 15

    # --------------------------------------------------------
    # SCORE DENSITY
    # --------------------------------------------------------

    density = (
        score
        /
        max(
            final_duration,
            1,
        )
    )

    score += density * 3

    clip_words = collect_clip_words(
        valid_segments,
        final_start,
        final_end,
    )

    return {
        "start": round(
            final_start,
            3,
        ),

        "end": round(
            final_end,
            3,
        ),

        "text": text,

        "score": float(
            score
        ),

        "duration": float(
            final_duration
        ),

        "words": clip_words,

        "natural_end": natural_end,
    }


# ============================================================
# GENERATE CANDIDATES
# ============================================================

def generate_candidates(
    valid_segments,
    range_start,
    range_end,
):

    candidates = []

    segment_count = len(
        valid_segments
    )

    for start_index in range(
        segment_count
    ):

        raw_start = find_natural_start(
            valid_segments,
            start_index,
        )

        raw_start = max(
            range_start,
            raw_start,
        )

        if raw_start >= range_end:
            continue

        for end_index in range(
            start_index,
            segment_count
        ):

            current = valid_segments[
                end_index
            ]

            current_end = find_natural_end(
                valid_segments,
                end_index,
            )

            if current_end <= range_start:
                continue

            current_end = min(
                current_end,
                range_end,
            )

            duration = (
                current_end
                -
                raw_start
            )

            if duration < MIN_DURATION:
                continue

            if duration > MAX_DURATION:
                break

            if end_index > start_index:

                previous = valid_segments[
                    end_index - 1
                ]

                previous_words = get_word_timings(
                    previous
                )

                current_words = get_word_timings(
                    current
                )

                if previous_words:

                    previous_end = (
                        previous_words[-1]["end"]
                    )

                else:

                    previous_end = float(
                        previous["end"]
                    )

                if current_words:

                    current_start = (
                        current_words[0]["start"]
                    )

                else:

                    current_start = float(
                        current["start"]
                    )

                gap = (
                    current_start
                    -
                    previous_end
                )

                if gap > SPEECH_GAP:
                    break

            next_segment = None

            if (
                end_index + 1
                <
                segment_count
            ):

                next_segment = (
                    valid_segments[
                        end_index + 1
                    ]
                )

            natural_end = is_natural_end(
                current,
                next_segment,
            )

            if natural_end:

                candidate = build_candidate(
                    valid_segments,
                    start_index,
                    end_index,
                    range_start,
                    range_end,
                )

                if candidate is not None:
                    candidates.append(
                        candidate
                    )

            elif duration >= FORCED_END_DURATION:

                candidate = build_candidate(
                    valid_segments,
                    start_index,
                    end_index,
                    range_start,
                    range_end,
                )

                if candidate is not None:
                    candidates.append(
                        candidate
                    )

    return candidates


# ============================================================
# REMOVE EXACT DUPLICATES
# ============================================================

def remove_exact_duplicates(
    candidates,
):

    unique = []

    seen = set()

    for candidate in candidates:

        key = (
            round(
                candidate["start"],
                2,
            ),
            round(
                candidate["end"],
                2,
            ),
        )

        if key in seen:
            continue

        seen.add(key)

        unique.append(
            candidate
        )

    return unique


# ============================================================
# REMOVE DUPLICATE MOMENTS
# ============================================================

def remove_duplicate_moments(
    candidates,
):

    if not candidates:
        return []

    ordered = sorted(
        candidates,
        key=candidate_quality,
        reverse=True,
    )

    kept = []

    for candidate in ordered:

        duplicate = False

        for better in kept:

            if is_same_moment(
                candidate,
                better,
            ):

                duplicate = True
                break

        if not duplicate:

            kept.append(
                candidate
            )

    return kept


# ============================================================
# QUALITY THRESHOLD
# ============================================================

def calculate_quality_threshold(
    candidates,
):

    if not candidates:
        return 0.0

    scores = sorted(
        [
            candidate_quality(x)
            for x in candidates
        ],
        reverse=True,
    )

    count = len(scores)

    if count <= 8:

        return max(
            85.0,
            scores[-1],
        )

    if count <= 15:

        index = min(
            10,
            count - 1,
        )

        return max(
            105.0,
            scores[index],
        )

    index = int(
        count * 0.70
    )

    index = min(
        max(
            index,
            0,
        ),
        count - 1,
    )

    return max(
        105.0,
        scores[index],
    )


# ============================================================
# SELECT QUALITY CANDIDATES
# ============================================================

def select_quality_candidates(
    candidates,
):

    if not candidates:
        return []

    threshold = calculate_quality_threshold(
        candidates
    )

    quality = [
        candidate
        for candidate in candidates
        if candidate_quality(candidate)
        >= threshold
    ]

    if len(quality) < 3:

        ordered = sorted(
            candidates,
            key=candidate_quality,
            reverse=True,
        )

        quality = ordered[
            :min(
                5,
                len(ordered),
            )
        ]

    return quality


# ============================================================
# FINAL DUPLICATE CHECK
# ============================================================

def is_final_duplicate(
    candidate,
    selected,
):

    overlap = calculate_overlap_ratio(
        candidate["start"],
        candidate["end"],
        selected["start"],
        selected["end"],
    )

    coverage = calculate_coverage(
        candidate["start"],
        candidate["end"],
        selected["start"],
        selected["end"],
    )

    distance = center_distance(
        candidate["start"],
        candidate["end"],
        selected["start"],
        selected["end"],
    )

    similarity = text_similarity(
        candidate.get(
            "text",
            "",
        ),
        selected.get(
            "text",
            "",
        ),
    )

    # Katta overlap
    if overlap >= FINAL_OVERLAP_RATIO:
        return True

    # Bittasi ikkinchisini katta qismi bilan qoplaydi
    if coverage >= FINAL_COVERAGE:
        return True

    # Juda yaqin va bir xil gap/moment
    if (
        similarity >= FINAL_TEXT_SIMILARITY
        and
        distance < 35
    ):
        return True

    # Markazlar juda yaqin + ozgina overlap
    if (
        distance < FINAL_CENTER_DISTANCE
        and
        overlap >= 0.10
    ):
        return True

    return False


# ============================================================
# FINAL SCORE WITH DIVERSITY
# ============================================================

def final_selection_score(
    candidate,
    selected,
    range_start,
    range_end,
):

    base = candidate_quality(
        candidate
    )

    if not selected:
        return base

    center = (
        candidate["start"]
        +
        candidate["end"]
    ) / 2.0

    range_duration = max(
        range_end - range_start,
        1.0,
    )

    position = (
        center - range_start
    ) / range_duration

    # --------------------------------------------------------
    # PENALTY FOR NEARBY SELECTED CLIPS
    # --------------------------------------------------------

    penalty = 0.0

    for picked in selected:

        picked_center = (
            picked["start"]
            +
            picked["end"]
        ) / 2.0

        distance = abs(
            center
            -
            picked_center
        )

        overlap = calculate_overlap_ratio(
            candidate["start"],
            candidate["end"],
            picked["start"],
            picked["end"],
        )

        similarity = text_similarity(
            candidate.get("text", ""),
            picked.get("text", ""),
        )

        if distance < 20:

            penalty += 35

        elif distance < 30:

            penalty += 20

        elif distance < 45:

            penalty += 8

        if overlap > 0.15:

            penalty += (
                overlap * 45
            )

        if similarity > 0.50:

            penalty += (
                similarity * 20
            )

    # --------------------------------------------------------
    # SMALL POSITION BONUS
    # --------------------------------------------------------

    position_bonus = (
        position * 0.01
    )

    return (
        base
        -
        penalty
        +
        position_bonus
    )


# ============================================================
# FINAL 10 SHORT SELECTION
# ============================================================

def select_final_shorts(
    candidates,
    range_start,
    range_end,
    target_count=TARGET_SHORTS,
):

    if not candidates:
        return []

    # --------------------------------------------------------
    # First: strongest candidates
    # --------------------------------------------------------

    pool = sorted(
        candidates,
        key=candidate_quality,
        reverse=True,
    )

    selected = []

    # --------------------------------------------------------
    # PASS 1
    #
    # Strong quality + strict diversity
    # --------------------------------------------------------

    while (
        pool
        and
        len(selected) < target_count
    ):

        best = None
        best_value = float("-inf")

        for candidate in pool:

            duplicate = False

            for picked in selected:

                if is_final_duplicate(
                    candidate,
                    picked,
                ):

                    duplicate = True
                    break

            if duplicate:
                continue

            value = final_selection_score(
                candidate,
                selected,
                range_start,
                range_end,
            )

            if value > best_value:

                best_value = value
                best = candidate

        if best is None:
            break

        selected.append(
            best
        )

        pool.remove(
            best
        )

    # --------------------------------------------------------
    # PASS 2
    #
    # Agar 10 ta chiqmasa,
    # biroz yumshoqroq qo'shamiz.
    # --------------------------------------------------------

    if len(selected) < target_count:

        remaining = sorted(
            pool,
            key=candidate_quality,
            reverse=True,
        )

        for candidate in remaining:

            if len(selected) >= target_count:
                break

            duplicate = False

            for picked in selected:

                overlap = calculate_overlap_ratio(
                    candidate["start"],
                    candidate["end"],
                    picked["start"],
                    picked["end"],
                )

                coverage = calculate_coverage(
                    candidate["start"],
                    candidate["end"],
                    picked["start"],
                    picked["end"],
                )

                # Faqat juda katta overlapni rad qilamiz
                if (
                    overlap >= 0.55
                    or
                    coverage >= 0.80
                ):

                    duplicate = True
                    break

            if not duplicate:

                selected.append(
                    candidate
                )

    # --------------------------------------------------------
    # FINAL SORT
    # --------------------------------------------------------

    selected.sort(
        key=lambda x: x["start"]
    )

    return selected[:target_count]


# ============================================================
# GET BEST SEGMENTS
# ============================================================

def get_best_segments(
    segments,
    range_start=0.0,
    range_end=None,
):

    if not segments:
        return []

    # ========================================================
    # CLEAN
    # ========================================================

    valid_segments = []

    for seg in segments:

        try:

            start = float(
                seg["start"]
            )

            end = float(
                seg["end"]
            )

        except (
            KeyError,
            TypeError,
            ValueError,
        ):

            continue

        if end <= start:
            continue

        text = str(
            seg.get(
                "text",
                "",
            )
        ).strip()

        if not text:
            continue

        valid_segments.append(
            {
                "start": start,
                "end": end,
                "text": text,
                "words": seg.get(
                    "words",
                    [],
                ),
            }
        )

    if not valid_segments:
        return []

    # ========================================================
    # SORT
    # ========================================================

    valid_segments.sort(
        key=lambda x: x["start"]
    )

    # ========================================================
    # VIDEO DURATION
    # ========================================================

    total_duration = max(
        segment["end"]
        for segment in valid_segments
    )

    # ========================================================
    # RANGE START
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

    # ========================================================
    # RANGE END
    # ========================================================

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
    # SAFE RANGE
    # ========================================================

    range_start = max(
        0.0,
        range_start,
    )

    range_end = min(
        total_duration,
        range_end,
    )

    if range_end <= range_start:
        return []

    # ========================================================
    # MAX 60 MINUTES
    # ========================================================

    if (
        range_end
        -
        range_start
        >
        3600
    ):

        raise ValueError(
            "Tanlangan vaqt oralig'i "
            "maksimum 60 daqiqa bo'lishi kerak."
        )

    # ========================================================
    # FILTER RANGE
    # ========================================================

    range_segments = []

    for segment in valid_segments:

        if (
            segment["end"]
            <=
            range_start
        ):

            continue

        if (
            segment["start"]
            >=
            range_end
        ):

            continue

        clipped = dict(
            segment
        )

        clipped["start"] = max(
            segment["start"],
            range_start,
        )

        clipped["end"] = min(
            segment["end"],
            range_end,
        )

        if (
            clipped["end"]
            <=
            clipped["start"]
        ):

            continue

        range_segments.append(
            clipped
        )

    if not range_segments:
        return []

    # ========================================================
    # GENERATE
    # ========================================================

    candidates = generate_candidates(
        range_segments,
        range_start,
        range_end,
    )

    print(
        f"Candidates generated: "
        f"{len(candidates)}"
    )

    if not candidates:
        return []

    # ========================================================
    # EXACT DUPLICATES
    # ========================================================

    candidates = remove_exact_duplicates(
        candidates
    )

    print(
        f"After exact duplicate removal: "
        f"{len(candidates)}"
    )

    # ========================================================
    # DUPLICATE MOMENTS
    # ========================================================

    candidates = remove_duplicate_moments(
        candidates
    )

    print(
        f"Unique quality candidates: "
        f"{len(candidates)}"
    )

    if not candidates:
        return []

    # ========================================================
    # QUALITY FILTER
    # ========================================================

    quality_candidates = select_quality_candidates(
        candidates
    )

    print(
        f"Above quality threshold: "
        f"{len(quality_candidates)}"
    )

    # ========================================================
    # FINAL SELECTION
    # ========================================================

    selected = select_final_shorts(
        quality_candidates,
        range_start,
        range_end,
        TARGET_SHORTS,
    )

    print(
        f"After final diversity selection: "
        f"{len(selected)}"
    )

    # ========================================================
    # SORT
    # ========================================================

    selected.sort(
        key=lambda x: x["start"]
    )

    # ========================================================
    # RESULT
    # ========================================================

    result = []

    for candidate in selected:

        result.append(
            {
                "start": round(
                    candidate["start"],
                    3,
                ),

                "end": round(
                    candidate["end"],
                    3,
                ),

                "text": candidate.get(
                    "text",
                    "",
                ),

                "score": round(
                    candidate.get(
                        "score",
                        0,
                    ),
                    2,
                ),

                "words": candidate.get(
                    "words",
                    [],
                ),
            }
        )

    # ========================================================
    # DEBUG
    # ========================================================

    print()
    print(
        "=" * 60
    )

    print(
        f"Whisper segments: "
        f"{len(valid_segments)}"
    )

    print(
        f"Selected range: "
        f"{range_start:.2f}s -> "
        f"{range_end:.2f}s"
    )

    print(
        f"Range duration: "
        f"{range_end - range_start:.2f}s"
    )

    print(
        f"Final quality shorts: "
        f"{len(result)}"
    )

    print(
        "=" * 60
    )

    for index, clip in enumerate(
        result,
        start=1,
    ):

        duration = (
            clip["end"]
            -
            clip["start"]
        )

        print(
            f"Short {index}: "
            f"{clip['start']:.2f}s -> "
            f"{clip['end']:.2f}s "
            f"({duration:.2f}s) "
            f"score={clip['score']:.2f}"
        )

    print(
        "=" * 60
    )

    return result
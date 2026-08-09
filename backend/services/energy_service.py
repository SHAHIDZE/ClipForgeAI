import re


def energy_score(text: str) -> float:

    if not text:
        return 0

    low = text.lower().strip()

    words = re.findall(
        r"\b[\w']+\b",
        low
    )

    score = 0.0

    # ========================================================
    # SPEECH ENERGY
    # ========================================================

    word_count = len(words)

    # Juda uzun gapni avtomatik kuchli deb hisoblamaymiz
    if 15 <= word_count <= 60:
        score += 10

    elif 8 <= word_count < 15:
        score += 5

    elif word_count > 80:
        score -= 5

    # ========================================================
    # EXCLAMATIONS
    # ========================================================

    exclamations = text.count("!")

    score += min(
        exclamations * 4,
        16
    )

    # ========================================================
    # QUESTIONS
    # ========================================================

    questions = text.count("?")

    score += min(
        questions * 3,
        12
    )

    # ========================================================
    # CAPITAL WORDS
    # ========================================================

    capital_words = re.findall(
        r"\b[A-Z]{2,}\b",
        text
    )

    score += min(
        len(capital_words) * 4,
        12
    )

    # ========================================================
    # HIGH ENERGY PHRASES
    # ========================================================

    high_energy = [
        "bro",
        "crazy",
        "wow",
        "wtf",
        "no way",
        "insane",
        "oh my god",
        "omg",
        "are you serious",
        "what the",
        "let's go",
        "lets go",
        "shut up",
        "hold on",
        "wait what",
    ]

    for phrase in high_energy:

        if phrase in low:
            score += 12

    # ========================================================
    # REPETITION
    # ========================================================

    if re.search(
        r"\b(\w+)\s+\1\b",
        low
    ):
        score += 6

    # ========================================================
    # MULTIPLE PUNCTUATION
    # ========================================================

    if "!!" in text:
        score += 8

    if "??" in text:
        score += 6

    # ========================================================
    # LIMIT
    # ========================================================

    return min(
        score,
        60
    )
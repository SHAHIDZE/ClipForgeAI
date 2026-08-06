def score_text(text):

    score = 0

    text = text.lower()

    keywords = [

        # surprise
        "wow",
        "no way",
        "what",
        "wtf",
        "impossible",
        "unbelievable",

        # excitement
        "let's go",
        "lets go",
        "bro",
        "insane",
        "crazy",
        "actually",

        # reaction
        "oh my god",
        "seriously",
        "look",
        "listen",

        # challenge
        "last",
        "winner",
        "lose",
        "lost",
        "won",

        # money
        "million",
        "100000",
        "1000000",
        "$",
        "money",

        # emotion
        "cry",
        "laugh",
        "dead",
        "screaming"
    ]

    # keyword score
    for word in keywords:
        if word in text:
            score += 25

    # word count
    words = text.split()

    if len(words) >= 12:
        score += 15

    elif len(words) <= 3:
        score -= 20

    # punctuation
    score += text.count("!") * 8
    score += text.count("?") * 6

    return score


def get_best_segments(segments, top_n=10):

    windows = []

    window_size = 30
    step = 15

    if not segments:
        return []

    total_duration = segments[-1]["end"]

    current = 0

    while current < total_duration:

        end_time = current + window_size

        text = ""

        for seg in segments:

            if seg["start"] >= current and seg["end"] <= end_time:
                text += " " + seg["text"]

        duration = end_time - current

        if text.strip():

            score = score_text(text)

            if 20 <= duration <= 60:
                score += 30

            windows.append({

                "start": current,
                "end": end_time,
                "text": text,
                "score": score

            })

        current += step

    windows.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    selected = []

    for w in windows:

        overlap = False

        for s in selected:

            if abs(w["start"] - s["start"]) < 20:
                overlap = True
                break

        if not overlap:
            selected.append(w)

        if len(selected) >= top_n:
            break

    return selected
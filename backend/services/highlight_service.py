def score_segment(segment):
    score = 0

    text = segment["text"].lower()

    duration = segment["end"] - segment["start"]

    if 20 <= duration <= 60:
        score += 30

    elif duration < 10:
        score -= 50

    # Emotsional so'zlar
    keywords = [
        "wow",
        "no way",
        "oh my god",
        "insane",
        "crazy",
        "let's go",
        "bro",
        "what",
        "wtf"
    ]

    for word in keywords:
        if word in text:
            score += 15

    # Undov belgisi
    score += text.count("!") * 5

    return score


def get_best_segments(segments, top_n=10):
    ranked = []

    for seg in segments:
        seg["score"] = score_segment(seg)
        ranked.append(seg)

    ranked.sort(key=lambda x: x["score"], reverse=True)

    return [
        x for x in ranked[:top_n]
        if x["end"] - x["start"] >= 15
    ]
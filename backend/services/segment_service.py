from backend.services.highlight_service import score_text


def build_candidate_segments(segments):

    candidates = []

    if not segments:
        return candidates

    total_duration = segments[-1]["end"]

    window_size = 30
    step = 10

    current = 0

    while current < total_duration:

        end_time = current + window_size

        collected = []

        text = ""

        for seg in segments:

            if seg["end"] < current:
                continue

            if seg["start"] > end_time:
                break

            collected.append(seg)
            text += " " + seg["text"]

        if not collected:
            current += step
            continue

        duration = collected[-1]["end"] - collected[0]["start"]

        score = score_text(text)

        # ideal duration
        if 20 <= duration <= 60:
            score += 40
        else:
            score -= 15

        # gap oxiri
        if text.strip().endswith((".", "!", "?")):
            score += 20

        candidates.append({

            "start": collected[0]["start"],
            "end": collected[-1]["end"],
            "text": text,
            "score": score

        })

        current += step

    return candidates
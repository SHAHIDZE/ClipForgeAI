def emotion_bonus(text: str) -> float:

    if not text:
        return 0

    low = text.lower()

    emotions = {

        "laugh": 12,
        "laughing": 12,

        "cry": 12,
        "crying": 12,

        "angry": 15,

        "crazy": 15,

        "wow": 15,

        "wtf": 18,

        "dead": 12,

        "insane": 15,

        "bro": 8,

        "no way": 18,

        "oh my god": 18,

        "omg": 18,

        "are you serious": 18,

        "unbelievable": 15,

        "impossible": 15,

        "shut up": 12,

        "wait what": 15,

    }

    score = 0

    for phrase, value in emotions.items():

        if phrase in low:
            score += value

    # Bir xil emotionlar juda ko'p bo'lsa,
    # clip avtomatik haddan tashqari yuqori bo'lmasin.

    return min(
        score,
        45
    )
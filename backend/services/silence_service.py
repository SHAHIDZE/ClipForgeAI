from pydub import AudioSegment
from pydub.silence import detect_nonsilent

def get_active_parts(video):

    audio = AudioSegment.from_file(video)

    active = detect_nonsilent(

        audio,

        min_silence_len=700,

        silence_thresh=-38

    )

    return active
import librosa


def get_audio_energy(audio_path):

    y, sr = librosa.load(audio_path, sr=None)

    rms = librosa.feature.rms(y=y)[0]

    return rms
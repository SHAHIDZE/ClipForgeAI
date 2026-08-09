import cv2

def detect_faces(video_path):

    cap = cv2.VideoCapture(video_path)

    detector = cv2.CascadeClassifier(
        cv2.data.haarcascades +
        "haarcascade_frontalface_default.xml"
    )

    timestamps = []

    fps = cap.get(cv2.CAP_PROP_FPS)

    frame = 0

    while True:

        ret, img = cap.read()

        if not ret:
            break

        gray = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2GRAY
        )

        faces = detector.detectMultiScale(
            gray,
            1.2,
            5
        )

        if len(faces) > 0:

            timestamps.append(
                frame / fps
            )

        frame += 1

    cap.release()

    return timestamps
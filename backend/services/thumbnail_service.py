import cv2

def generate_thumbnail(video, output):

    cap = cv2.VideoCapture(video)

    total = int(
        cap.get(cv2.CAP_PROP_FRAME_COUNT)
    )

    cap.set(

        cv2.CAP_PROP_POS_FRAMES,

        total // 2

    )

    ok, frame = cap.read()

    if ok:

        cv2.imwrite(output, frame)

    cap.release()
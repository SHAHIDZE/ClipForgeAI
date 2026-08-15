"use client";

type TimelineRulerProps = {
  duration: number;
  width: number;
  zoom: number;
  onSeek?: (time: number) => void;
};

function formatTime(seconds: number) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "00:00";
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  const secs = Math.floor(
    seconds % 60,
  );

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(secs).padStart(2, "0")}`;
}

export default function TimelineRuler({
  duration,
  width,
  zoom,
  onSeek,
}: TimelineRulerProps) {
  if (
    !duration ||
    duration <= 0 ||
    width <= 0
  ) {
    return (
      <div className="h-9 border-b border-white/[0.06] bg-[#0b0d11]" />
    );
  }

  const pixelsPerSecond =
    width / duration;

  let interval = 30;

  if (zoom >= 6) {
    interval = 1;
  } else if (zoom >= 4) {
    interval = 2;
  } else if (zoom >= 2.5) {
    interval = 5;
  } else if (zoom >= 1.5) {
    interval = 10;
  } else if (zoom >= 0.75) {
    interval = 20;
  }

  const markers: number[] = [];

  for (
    let time = 0;
    time <= duration;
    time += interval
  ) {
    markers.push(
      Math.min(time, duration),
    );
  }

  const handleClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!onSeek) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const percentage =
      Math.max(
        0,
        Math.min(
          1,
          (event.clientX -
            rect.left) /
            rect.width,
        ),
      );

    onSeek(
      percentage * duration,
    );
  };

  return (
    <div
      className="relative h-9 cursor-pointer select-none border-b border-white/[0.06] bg-[#0b0d11]"
      style={{ width }}
      onClick={handleClick}
    >
      {markers.map(
        (time, index) => {
          const left =
            time *
            pixelsPerSecond;

          const major =
            index % 2 === 0 ||
            interval <= 2;

          return (
            <div
              key={`${time}-${index}`}
              className="absolute inset-y-0"
              style={{
                left,
              }}
            >
              <div
                className={`absolute bottom-0 w-px ${
                  major
                    ? "h-3 bg-white/25"
                    : "h-2 bg-white/10"
                }`}
              />

              <span
                className={`absolute left-1 top-1 whitespace-nowrap font-mono text-[9px] ${
                  major
                    ? "text-white/40"
                    : "text-white/20"
                }`}
              >
                {formatTime(time)}
              </span>
            </div>
          );
        },
      )}

      <div
        className="absolute bottom-0 top-0 w-px bg-white/10"
        style={{
          left:
            Math.max(
              0,
              width - 1,
            ),
        }}
      />
    </div>
  );
}
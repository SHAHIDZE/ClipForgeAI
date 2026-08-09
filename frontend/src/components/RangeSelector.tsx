"use client";

type Props = {
  duration: number;
  startTime: number;
  endTime: number;
  onChange: (start: number, end: number) => void;
};

function formatTime(seconds: number) {
  const total = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    total / 3600
  );

  const minutes = Math.floor(
    (total % 3600) / 60
  );

  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

export default function RangeSelector({
  duration,
  startTime,
  endTime,
  onChange,
}: Props) {
  const safeDuration = Math.max(
    1,
    duration
  );

  const maxRange = Math.min(
    safeDuration,
    60 * 60
  );

  function handleStart(
    value: number
  ) {
    const newStart = Math.max(
      0,
      Math.min(
        value,
        endTime - 1
      )
    );

    onChange(
      newStart,
      endTime
    );
  }

  function handleEnd(
    value: number
  ) {
    const newEnd = Math.min(
      safeDuration,
      Math.max(
        value,
        startTime + 1
      )
    );

    const limitedEnd = Math.min(
      newEnd,
      startTime + maxRange
    );

    onChange(
      startTime,
      limitedEnd
    );
  }

  const selectedDuration =
    endTime - startTime;

  return (
    <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">

      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-xl font-black text-white">
            Select Clip Range
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Choose which part of the video AI should process.
          </p>
        </div>

        <div className="rounded-xl bg-violet-600/20 px-4 py-2 text-sm font-bold text-violet-400">
          {formatTime(selectedDuration)} selected
        </div>

      </div>

      <div className="mt-8">

        <div className="relative h-2 rounded-full bg-zinc-700">

          <div
            className="absolute h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
            style={{
              left: `${(startTime / safeDuration) * 100}%`,
              right: `${
                100 -
                (endTime / safeDuration) * 100
              }%`,
            }}
          />

          <input
            type="range"
            min={0}
            max={safeDuration}
            step={1}
            value={startTime}
            onChange={(e) =>
              handleStart(
                Number(
                  e.target.value
                )
              )
            }
            className="range-slider pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent"
          />

          <input
            type="range"
            min={0}
            max={safeDuration}
            step={1}
            value={endTime}
            onChange={(e) =>
              handleEnd(
                Number(
                  e.target.value
                )
              )
            }
            className="range-slider pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent"
          />

        </div>

      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Start
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {formatTime(startTime)}
          </p>

        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            End
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {formatTime(endTime)}
          </p>

        </div>

      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">

        <span>
          0:00
        </span>

        <span>
          Video: {formatTime(safeDuration)}
        </span>

        <span>
          Max: {formatTime(maxRange)}
        </span>

      </div>

      {selectedDuration > 3600 && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
          Selected range cannot exceed 60 minutes.
        </div>
      )}

    </div>
  );
}
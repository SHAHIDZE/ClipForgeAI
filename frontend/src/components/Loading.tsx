type LoadingProps = {
  status: string;
  progress: number;
};

export default function Loading({
  status,
  progress,
}: LoadingProps) {
  const safeProgress = Math.round(
    Math.max(0, Math.min(100, Number(progress) || 0))
  );

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl shadow-black/20">
      {/* TOP */}
      <div className="flex flex-col items-center text-center">
        {/* ANIMATED ICON */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-600/10" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/10 text-3xl">
            ⚡
          </div>
        </div>

        {/* STATUS */}
        <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
          {status}
        </h2>

        <p className="mt-2 max-w-md text-sm text-zinc-500">
          ClipForge AI is analyzing your video and generating the best
          short-form moments.
        </p>
      </div>

      {/* PROGRESS */}
      <div className="mx-auto mt-8 w-full max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Processing
          </span>

          <span className="text-sm font-black text-violet-400">
            {safeProgress}%
          </span>
        </div>

        {/* TRACK */}
        <div className="h-3 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
          {/* BAR */}
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-violet-600
              via-purple-500
              to-fuchsia-500
              shadow-lg
              shadow-violet-900/40
              transition-all
              duration-500
            "
            style={{
              width: `${safeProgress}%`,
            }}
          />
        </div>

        {/* STEPS */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div
            className={`text-xs font-semibold ${
              safeProgress >= 15
                ? "text-violet-400"
                : "text-zinc-700"
            }`}
          >
            Analyze
          </div>

          <div
            className={`text-xs font-semibold ${
              safeProgress >= 50
                ? "text-violet-400"
                : "text-zinc-700"
            }`}
          >
            Generate
          </div>

          <div
            className={`text-xs font-semibold ${
              safeProgress >= 95
                ? "text-violet-400"
                : "text-zinc-700"
            }`}
          >
            Finish
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 border-t border-zinc-900 pt-5 text-center">
        <p className="text-xs text-zinc-600">
          Please keep this page open while ClipForge AI is processing.
        </p>
      </div>
    </div>
  );
}
type LoadingProps = {
  status: string;
  progress: number;
};

export default function Loading({
  status,
  progress,
}: LoadingProps) {
  const safeProgress = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        Number(progress) || 0
      )
    )
  );

  const isAnalyzing =
    safeProgress >= 10 && safeProgress < 50;

  const isGenerating =
    safeProgress >= 50 && safeProgress < 95;

  const isFinishing =
    safeProgress >= 95;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] p-6 shadow-2xl shadow-black/30 md:p-8">
      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-fuchsia-600/[0.05] blur-3xl" />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="relative text-center">
        {/* ICON */}

        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          {/* OUTER RING */}

          <div className="absolute inset-0 animate-ping rounded-3xl border border-violet-500/20" />

          {/* ROTATING RING */}

          <div className="absolute inset-0 animate-spin rounded-3xl border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />

          {/* ICON BOX */}

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/10 text-3xl shadow-lg shadow-violet-950/20">
            <span className="animate-pulse">
              ⚡
            </span>
          </div>
        </div>

        {/* STATUS */}

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>

          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400">
            AI Processing
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
          {status}
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
          ClipForge AI is analyzing your video and
          generating the best short-form moments.
        </p>
      </div>

      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <div className="relative mx-auto mt-9 w-full max-w-2xl">
        {/* PROGRESS HEADER */}

        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
              Processing
            </p>

            <p className="mt-1 text-xs font-semibold text-zinc-500">
              {isAnalyzing
                ? "Analyzing video..."
                : isGenerating
                ? "Generating shorts..."
                : isFinishing
                ? "Finishing..."
                : "Preparing..."}
            </p>
          </div>

          <span className="text-2xl font-black tabular-nums text-white">
            {safeProgress}
            <span className="text-sm text-violet-400">
              %
            </span>
          </span>
        </div>

        {/* TRACK */}

        <div className="relative h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
          {/* BAR */}

          <div
            className="
              relative
              h-full
              rounded-full
              bg-gradient-to-r
              from-violet-600
              via-purple-500
              to-fuchsia-500
              shadow-lg
              shadow-violet-950/40
              transition-all
              duration-500
            "
            style={{
              width: `${safeProgress}%`,
            }}
          >
            {/* SHINE */}

            <div className="absolute inset-y-0 right-0 w-24 animate-pulse bg-white/20 blur-md" />
          </div>
        </div>

        {/* =================================================
            STEPS
        ================================================== */}

        <div className="mt-7 grid grid-cols-3 gap-3">
          {/* ANALYZE */}

          <div
            className={`
              rounded-2xl
              border
              px-3
              py-3
              text-center
              transition-all
              duration-300
              ${
                safeProgress >= 15
                  ? "border-violet-500/30 bg-violet-500/[0.08]"
                  : "border-zinc-800 bg-zinc-950/60"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className={`
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-lg
                  text-xs
                  ${
                    safeProgress >= 15
                      ? "bg-violet-500/15 text-violet-400"
                      : "bg-zinc-900 text-zinc-700"
                  }
                `}
              >
                {safeProgress >= 15
                  ? "✓"
                  : "1"}
              </span>

              <span
                className={`
                  text-xs
                  font-bold
                  ${
                    safeProgress >= 15
                      ? "text-violet-300"
                      : "text-zinc-700"
                  }
                `}
              >
                Analyze
              </span>
            </div>
          </div>

          {/* GENERATE */}

          <div
            className={`
              rounded-2xl
              border
              px-3
              py-3
              text-center
              transition-all
              duration-300
              ${
                safeProgress >= 50
                  ? "border-fuchsia-500/30 bg-fuchsia-500/[0.08]"
                  : "border-zinc-800 bg-zinc-950/60"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className={`
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-lg
                  text-xs
                  ${
                    safeProgress >= 50
                      ? "bg-fuchsia-500/15 text-fuchsia-400"
                      : "bg-zinc-900 text-zinc-700"
                  }
                `}
              >
                {safeProgress >= 50
                  ? "✓"
                  : "2"}
              </span>

              <span
                className={`
                  text-xs
                  font-bold
                  ${
                    safeProgress >= 50
                      ? "text-fuchsia-300"
                      : "text-zinc-700"
                  }
                `}
              >
                Generate
              </span>
            </div>
          </div>

          {/* FINISH */}

          <div
            className={`
              rounded-2xl
              border
              px-3
              py-3
              text-center
              transition-all
              duration-300
              ${
                safeProgress >= 95
                  ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                  : "border-zinc-800 bg-zinc-950/60"
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className={`
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-lg
                  text-xs
                  ${
                    safeProgress >= 95
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-900 text-zinc-700"
                  }
                `}
              >
                {safeProgress >= 95
                  ? "✓"
                  : "3"}
              </span>

              <span
                className={`
                  text-xs
                  font-bold
                  ${
                    safeProgress >= 95
                      ? "text-emerald-300"
                      : "text-zinc-700"
                  }
                `}
              >
                Finish
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          LIVE STATUS
      ====================================================== */}

      <div className="relative mx-auto mt-7 max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">
            🤖
          </span>

          <p className="text-xs text-zinc-500">
            AI is working on your video. This may take
            a little while depending on the video length.
          </p>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div className="relative mt-7 border-t border-zinc-900 pt-5 text-center">
        <p className="text-[11px] text-zinc-600">
          Please keep this page open while ClipForge AI
          is processing your project.
        </p>
      </div>
    </div>
  );
}
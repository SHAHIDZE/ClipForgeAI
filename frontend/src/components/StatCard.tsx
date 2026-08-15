"use client";

import { motion } from "framer-motion";

type Props = {
  title: string;
  value: string | number;
};

export default function StatCard({
  title,
  value,
}: Props) {
  const icons: Record<string, string> = {
    Projects: "📁",
    Videos: "🎬",
    Minutes: "⏱️",
    "AI Score": "✨",
  };

  const icon =
    icons[title] ?? "📊";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      whileHover={{
        y: -3,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-zinc-800
        bg-[#111113]
        p-5
        shadow-xl
        shadow-black/10
        transition-all
        duration-300
        hover:border-violet-500/20
        hover:shadow-violet-950/10
      "
    >
      {/* =====================================================
          BACKGROUND GLOW
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          bg-violet-600/10
          blur-3xl
          opacity-50
          transition-all
          duration-500
          group-hover:scale-150
          group-hover:opacity-100
        "
      />

      {/* =====================================================
          TOP
      ====================================================== */}

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">
            {title}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-black tracking-tight text-white">
              {value}
            </span>
          </div>
        </div>

        {/* ICON */}

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            border
            border-zinc-800
            bg-zinc-900
            text-lg
            shadow-lg
            transition-all
            duration-300
            group-hover:border-violet-500/30
            group-hover:bg-violet-500/10
            group-hover:scale-105
          "
        >
          {icon}
        </div>
      </div>

      {/* =====================================================
          BOTTOM
      ====================================================== */}

      <div className="relative mt-5 flex items-center gap-2">
        <span
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-emerald-400
            shadow-sm
            shadow-emerald-400/50
          "
        />

        <span className="text-[11px] font-semibold text-zinc-600">
          Active
        </span>
      </div>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="
        sticky
        top-0
        z-50
        border-b
        border-zinc-800/80
        bg-[#09090B]/90
        px-6
        backdrop-blur-xl
        md:px-10
      "
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-violet-500
              to-fuchsia-500
              text-lg
              font-black
              text-white
              shadow-lg
              shadow-violet-900/30
            "
          >
            C
          </div>

          <div className="leading-none">
            <p className="text-lg font-black tracking-tight text-white">
              ClipForge
              <span className="text-violet-400"> AI</span>
            </p>

            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              AI Video Studio
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-400 sm:block">
            Free Plan
          </div>

          <button
            type="button"
            className="
              rounded-xl
              bg-gradient-to-r
              from-violet-600
              to-fuchsia-600
              px-5
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-violet-900/20
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-violet-900/40
              active:translate-y-0
            "
          >
            Upgrade
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
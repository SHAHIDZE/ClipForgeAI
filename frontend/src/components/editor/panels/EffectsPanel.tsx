"use client";

import {
  Sparkles,
  Wand2,
} from "lucide-react";

export default function EffectsPanel() {
  const effects = [
    "None",
    "Blur",
    "Brightness",
    "Contrast",
    "Saturation",
    "Grayscale",
    "Vignette",
    "Sharpen",
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Wand2
            size={15}
            className="text-purple-300"
          />

          <h2 className="text-sm font-semibold">
            Effects
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Enhance your video.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        {effects.map(
          (effect) => (
            <button
              key={effect}
              type="button"
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-4 text-left text-[10px] text-white/45 transition hover:border-purple-400/20 hover:bg-purple-500/[0.04] hover:text-white"
            >
              {effect}
            </button>
          ),
        )}
      </div>

      <div className="mx-4 rounded-xl border border-purple-400/10 bg-purple-500/[0.03] p-3">
        <div className="flex items-center gap-2">
          <Sparkles
            size={13}
            className="text-purple-300"
          />

          <span className="text-[10px] font-medium text-white/60">
            AI effects
          </span>
        </div>

        <p className="mt-1 text-[9px] leading-4 text-white/25">
          AI-powered effects will
          be connected in the next
          processing stage.
        </p>
      </div>
    </div>
  );
}
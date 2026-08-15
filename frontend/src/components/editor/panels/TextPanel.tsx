"use client";

import {
  AlignCenter,
  Bold,
  Italic,
  Type,
} from "lucide-react";

export default function TextPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Type
            size={15}
            className="text-pink-300"
          />

          <h2 className="text-sm font-semibold">
            Text
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Add titles and text
          overlays.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <button
          type="button"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-xs font-medium transition hover:border-pink-400/20 hover:bg-white/[0.05]"
        >
          + Add text
        </button>

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/25">
            Font
          </label>

          <select className="w-full rounded-lg border border-white/[0.08] bg-[#101217] px-3 py-2 text-xs text-white outline-none">
            <option>
              Inter
            </option>

            <option>
              Montserrat
            </option>

            <option>
              Arial
            </option>

            <option>
              Georgia
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/25">
            Size
          </label>

          <input
            type="range"
            min="12"
            max="120"
            defaultValue="48"
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] py-2 text-white/50 hover:text-white"
          >
            <Bold size={14} />
          </button>

          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] py-2 text-white/50 hover:text-white"
          >
            <Italic size={14} />
          </button>

          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] py-2 text-white/50 hover:text-white"
          >
            <AlignCenter
              size={14}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import {
  Captions,
  Sparkles,
} from "lucide-react";

import { useEditorStore } from "../../../../store/editor/editorStore";

export default function CaptionsPanel() {
  const duration =
    useEditorStore(
      (state) =>
        state.project.duration,
    );

  const captionTrack =
    useEditorStore(
      (state) =>
        state.timeline.tracks.find(
          (track) =>
            track.type ===
            "caption",
        ),
    );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Captions
            size={15}
            className="text-yellow-300"
          />

          <h2 className="text-sm font-semibold">
            Captions
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Generate and style AI
          captions.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <button
          type="button"
          disabled={!duration}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Sparkles size={14} />
          Generate AI captions
        </button>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="text-xs font-medium">
            Caption style
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              "Classic",
              "Bold",
              "Highlight",
              "Minimal",
            ].map((style) => (
              <button
                key={style}
                type="button"
                className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-white/45 transition hover:border-yellow-400/20 hover:text-white"
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-yellow-400/10 bg-yellow-400/[0.025] p-3">
          <div className="text-[10px] font-medium text-yellow-100/70">
            Caption track
          </div>

          <div className="mt-1 text-[10px] text-white/25">
            {captionTrack?.clips
              .length ?? 0}{" "}
            caption clips
          </div>
        </div>
      </div>
    </div>
  );
}
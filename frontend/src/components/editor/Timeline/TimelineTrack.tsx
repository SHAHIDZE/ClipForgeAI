"use client";

import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useEditorStore } from "../../../../store/editor/editorStore";

import type {
  EditorTrack,
} from "../../../../store/editor/editorTypes";

import TimelineClip from "./TimelineClip";

type TimelineTrackProps = {
  track: EditorTrack;
  pixelsPerSecond: number;
};

export default function TimelineTrack({
  track,
  pixelsPerSecond,
}: TimelineTrackProps) {
  const selection =
    useEditorStore(
      (state) => state.selection,
    );

  return (
    <div className="flex h-12 border-b border-white/[0.05]">
      {/* TRACK HEADER */}

      <div className="sticky left-0 z-20 flex w-[150px] shrink-0 items-center justify-between border-r border-white/[0.06] bg-[#0b0d11] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs text-white/35">
            {track.type ===
            "video"
              ? "▣"
              : track.type ===
                  "audio"
                ? "♫"
                : track.type ===
                    "caption"
                  ? "T"
                  : "◇"}
          </span>

          <span className="truncate text-[10px] font-medium text-white/45">
            {track.name}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={
              track.muted
                ? "Unmute"
                : "Mute"
            }
            className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-white/[0.06] hover:text-white"
          >
            {track.muted ? (
              <VolumeX size={12} />
            ) : (
              <Volume2 size={12} />
            )}
          </button>

          <button
            type="button"
            title={
              track.locked
                ? "Unlock"
                : "Lock"
            }
            className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-white/[0.06] hover:text-white"
          >
            {track.locked ? (
              <Lock size={11} />
            ) : (
              <LockOpen size={11} />
            )}
          </button>

          <button
            type="button"
            title={
              track.visible
                ? "Hide"
                : "Show"
            }
            className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-white/[0.06] hover:text-white"
          >
            {track.visible ? (
              <Eye size={12} />
            ) : (
              <EyeOff size={12} />
            )}
          </button>
        </div>
      </div>

      {/* CLIPS */}

<div
  className="relative h-full bg-[#0d0f14]"
  style={{
    width: "100%",
  }}
>
        {/* GRID */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.7]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.045) 1px, transparent 1px)",
            backgroundSize: `${pixelsPerSecond * 5}px 100%`,
          }}
        />

        {track.clips.map(
          (clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              trackId={track.id}
              pixelsPerSecond={
                pixelsPerSecond
              }
              selected={
                selection.clipId ===
                clip.id
              }
            />
          ),
        )}
      </div>
    </div>
  );
}
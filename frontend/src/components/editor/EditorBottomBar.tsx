"use client";

import {
  ChevronDown,
  Pause,
  Play,
  Scissors,
  Trash2,
} from "lucide-react";

import { useEditorStore } from "../../../store/editor/editorStore";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(secs).padStart(
    2,
    "0",
  )}`;
}

export default function EditorBottomBar() {
  const playing =
    useEditorStore(
      (state) =>
        state.playback.playing,
    );

  const currentTime =
    useEditorStore(
      (state) =>
        state.playback.currentTime,
    );

  const duration =
    useEditorStore(
      (state) =>
        state.project.duration,
    );

  const selection =
    useEditorStore(
      (state) => state.selection,
    );

  const setPlaying =
    useEditorStore(
      (state) => state.setPlaying,
    );

  const split =
    useEditorStore(
      (state) =>
        state.splitSelectedClip,
    );

  const remove =
    useEditorStore(
      (state) =>
        state.deleteSelectedClip,
    );

  return (
    <footer className="flex h-11 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#08090c] px-3">
      {/* LEFT */}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            setPlaying(!playing)
          }
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black transition hover:bg-white/90"
        >
          {playing ? (
            <Pause
              size={12}
              fill="currentColor"
            />
          ) : (
            <Play
              size={12}
              fill="currentColor"
            />
          )}
        </button>

        <div className="ml-2 font-mono text-[10px]">
          <span className="text-white/75">
            {formatTime(
              currentTime,
            )}
          </span>

          <span className="mx-1 text-white/20">
            /
          </span>

          <span className="text-white/30">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* CENTER */}

      <div className="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          disabled={
            !selection.clipId
          }
          onClick={split}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
        >
          <Scissors
            size={12}
          />

          Split
        </button>

        <button
          type="button"
          disabled={
            !selection.clipId
          }
          onClick={remove}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-red-300 disabled:opacity-20"
        >
          <Trash2 size={12} />

          Delete
        </button>
      </div>

      {/* RIGHT */}

      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/25 hover:bg-white/[0.05] hover:text-white"
      >
        <span>100%</span>

        <ChevronDown
          size={11}
        />
      </button>
    </footer>
  );
}
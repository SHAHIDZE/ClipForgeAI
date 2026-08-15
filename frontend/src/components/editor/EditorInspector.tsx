"use client";

import React, {
  useMemo,
} from "react";

import {
  useEditorStore,
} from "../../../store/editor/editorStore";

function formatTime(
  value: number,
) {
  if (!Number.isFinite(value)) {
    return "00:00.00";
  }

  const minutes =
    Math.floor(value / 60);

  const seconds =
    value % 60;

  return `${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${seconds
    .toFixed(2)
    .padStart(5, "0")}`;
}

export default function EditorInspector() {
  const {
    timeline,
    selection,
  } = useEditorStore();

  const clip =
    useMemo(() => {
      if (
        !selection.clipId
      ) {
        return null;
      }

      for (
        const track of timeline.tracks
      ) {
        const found =
          track.clips.find(
            (item) =>
              item.id ===
              selection.clipId,
          );

        if (found) {
          return {
            clip: found,
            track,
          };
        }
      }

      return null;
    }, [
      selection.clipId,
      timeline.tracks,
    ]);

  if (!clip) {
    return (
      <aside className="flex w-[280px] shrink-0 flex-col border-l border-white/10 bg-[#0d0f14]">
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-xs font-semibold text-white">
            Properties
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <div className="mb-3 text-3xl text-white/10">
              ◇
            </div>

            <p className="text-xs text-white/35">
              Select a clip to edit its properties
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const {
    clip: selectedClip,
    track,
  } = clip;

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l border-white/10 bg-[#0d0f14]">
      <div className="border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold text-white">
          Properties
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* NAME */}

        <div className="mb-5">
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/30">
            Clip
          </label>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="truncate text-xs font-medium text-white">
              {selectedClip.name}
            </div>

            <div className="mt-1 text-[10px] text-white/30">
              {selectedClip.type}
            </div>
          </div>
        </div>

        {/* TIMING */}

        <div className="mb-5">
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/30">
            Timing
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Property
              label="Start"
              value={formatTime(
                selectedClip.start,
              )}
            />

            <Property
              label="Duration"
              value={formatTime(
                selectedClip.duration,
              )}
            />

            <Property
              label="Source"
              value={formatTime(
                selectedClip.sourceStart,
              )}
            />

            <Property
              label="Source Duration"
              value={formatTime(
                selectedClip.sourceDuration,
              )}
            />
          </div>
        </div>

        {/* TRACK */}

        <div className="mb-5">
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/30">
            Track
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="text-sm">
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

            <div>
              <div className="text-xs text-white/70">
                {track.name}
              </div>

              <div className="text-[10px] text-white/30">
                {track.locked
                  ? "Locked"
                  : "Editable"}
              </div>
            </div>
          </div>
        </div>

        {/* TEXT */}

        {selectedClip.text && (
          <div className="mb-5">
            <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/30">
              Text
            </label>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/70">
              {selectedClip.text}
            </div>
          </div>
        )}

        {/* STYLE */}

        {selectedClip.style && (
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/30">
              Style
            </label>

            <div className="space-y-2">
              {selectedClip.style
                .fontFamily && (
                <Property
                  label="Font"
                  value={
                    selectedClip
                      .style
                      .fontFamily
                  }
                />
              )}

              {selectedClip.style
                .fontSize && (
                <Property
                  label="Size"
                  value={`${selectedClip.style.fontSize}px`}
                />
              )}

              {selectedClip.style
                .color && (
                <Property
                  label="Color"
                  value={
                    selectedClip.style
                      .color
                  }
                />
              )}

              {selectedClip.style
                .align && (
                <Property
                  label="Align"
                  value={
                    selectedClip.style
                      .align
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Property({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.025] px-3 py-2">
      <span className="text-[10px] text-white/30">
        {label}
      </span>

      <span className="max-w-[130px] truncate text-[10px] font-medium text-white/65">
        {value}
      </span>
    </div>
  );
}
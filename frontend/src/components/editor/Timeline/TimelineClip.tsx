"use client";

import {
  AudioLines,
  Captions,
  GripVertical,
  MoveHorizontal,
  Video,
} from "lucide-react";

import { useCallback, useRef } from "react";

import { useEditorStore } from "../../../../store/editor/editorStore";

import type {
  EditorClip,
  EditorClipType,
} from "../../../../store/editor/editorTypes";

type TimelineClipProps = {
  clip: EditorClip;
  trackId: string;
  pixelsPerSecond: number;
  selected: boolean;
};

function getIcon(type: EditorClipType) {
  switch (type) {
    case "video":
      return <Video size={11} />;

    case "audio":
      return <AudioLines size={11} />;

    case "caption":
      return <Captions size={11} />;

    case "overlay":
      return <MoveHorizontal size={11} />;

    default:
      return <GripVertical size={11} />;
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    secs,
  ).padStart(2, "0")}`;
}

export default function TimelineClip({
  clip,
  trackId,
  pixelsPerSecond,
  selected,
}: TimelineClipProps) {
  const selectClip = useEditorStore(
    (state) => state.selectClip,
  );

  const moveClip = useEditorStore(
    (state) => state.moveClip,
  );

  const resizeClip = useEditorStore(
    (state) => state.resizeClip,
  );

  const duration =
    useEditorStore(
      (state) => state.project.duration,
    );

  const dragStartRef =
    useRef<{
      clientX: number;
      start: number;
    } | null>(null);

  const resizeRef =
    useRef<{
      side: "left" | "right";
      clientX: number;
      start: number;
      duration: number;
    } | null>(null);

  const width = Math.max(
    32,
    clip.duration * pixelsPerSecond,
  );

  const left =
    clip.start * pixelsPerSecond;

  const handleSelect = useCallback(
    (
      event: React.MouseEvent,
    ) => {
      event.stopPropagation();

      selectClip(
        clip.id,
        trackId,
      );
    },
    [
      clip.id,
      trackId,
      selectClip,
    ],
  );

  const handleDragStart = useCallback(
    (
      event: React.MouseEvent,
    ) => {
      if (
        event.button !== 0
      ) {
        return;
      }

      event.stopPropagation();

      selectClip(
        clip.id,
        trackId,
      );

      dragStartRef.current = {
        clientX: event.clientX,
        start: clip.start,
      };

      const handleMove = (
        moveEvent: MouseEvent,
      ) => {
        if (
          !dragStartRef.current
        ) {
          return;
        }

        const delta =
          (moveEvent.clientX -
            dragStartRef.current
              .clientX) /
          pixelsPerSecond;

        moveClip(
          clip.id,
          trackId,
          dragStartRef.current
            .start + delta,
        );
      };

      const handleUp = () => {
        dragStartRef.current =
          null;

        window.removeEventListener(
          "mousemove",
          handleMove,
        );

        window.removeEventListener(
          "mouseup",
          handleUp,
        );
      };

      window.addEventListener(
        "mousemove",
        handleMove,
      );

      window.addEventListener(
        "mouseup",
        handleUp,
      );
    },
    [
      clip.id,
      clip.start,
      trackId,
      pixelsPerSecond,
      moveClip,
      selectClip,
    ],
  );

  const handleResizeStart =
    useCallback(
      (
        event: React.MouseEvent,
        side:
          | "left"
          | "right",
      ) => {
        event.stopPropagation();

        selectClip(
          clip.id,
          trackId,
        );

        resizeRef.current = {
          side,
          clientX: event.clientX,
          start: clip.start,
          duration: clip.duration,
        };

        const handleMove = (
          moveEvent: MouseEvent,
        ) => {
          const current =
            resizeRef.current;

          if (!current) {
            return;
          }

          const delta =
            (moveEvent.clientX -
              current.clientX) /
            pixelsPerSecond;

          if (
            current.side ===
            "right"
          ) {
            resizeClip(
              clip.id,
              trackId,
              "right",
              current.start +
                current.duration +
                delta,
            );
          } else {
            resizeClip(
              clip.id,
              trackId,
              "left",
              current.start +
                delta,
            );
          }
        };

        const handleUp = () => {
          resizeRef.current =
            null;

          window.removeEventListener(
            "mousemove",
            handleMove,
          );

          window.removeEventListener(
            "mouseup",
            handleUp,
          );
        };

        window.addEventListener(
          "mousemove",
          handleMove,
        );

        window.addEventListener(
          "mouseup",
          handleUp,
        );
      },
      [
        clip.id,
        clip.start,
        clip.duration,
        trackId,
        pixelsPerSecond,
        resizeClip,
        selectClip,
      ],
    );

  const safeRight =
    Math.min(
      duration,
      clip.start +
        clip.duration,
    );

  return (
    <div
      className="absolute top-1/2 h-9 -translate-y-1/2"
      style={{
        left,
        width,
      }}
    >
      <div
        onMouseDown={handleDragStart}
        onClick={handleSelect}
        className={[
          "group relative h-full overflow-hidden rounded-md border",
          "cursor-grab select-none active:cursor-grabbing",
          "transition-shadow",
          selected
            ? "border-white/70 shadow-[0_0_0_1px_rgba(255,255,255,.2),0_6px_20px_rgba(0,0,0,.35)]"
            : "border-white/[0.08] hover:border-white/[0.18]",
        ].join(" ")}
        style={{
          background:
            clip.color ||
            "#6366f1",
        }}
      >
        {/* LEFT RESIZE */}

        <div
          onMouseDown={(event) =>
            handleResizeStart(
              event,
              "left",
            )
          }
          className="absolute left-0 top-0 z-20 h-full w-2 cursor-ew-resize bg-white/0 transition group-hover:bg-white/20"
        />

        {/* RIGHT RESIZE */}

        <div
          onMouseDown={(event) =>
            handleResizeStart(
              event,
              "right",
            )
          }
          className="absolute right-0 top-0 z-20 h-full w-2 cursor-ew-resize bg-white/0 transition group-hover:bg-white/20"
        />

        {/* CONTENT */}

        <div className="flex h-full min-w-0 items-center gap-1.5 px-2">
          <span className="shrink-0 text-white/70">
            {getIcon(clip.type)}
          </span>

          <span className="truncate text-[10px] font-medium text-white/85">
            {clip.text ||
              clip.name}
          </span>
        </div>

        {/* CAPTION */}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-white/20" />

        {/* SELECTED */}

        {selected && (
          <div className="pointer-events-none absolute inset-0 rounded-md border border-white/50" />
        )}

        {/* TOOLTIP */}

        <div className="pointer-events-none absolute -top-7 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 font-mono text-[9px] text-white/70 shadow-xl group-hover:block">
          {formatTime(
            clip.start,
          )}{" "}
          →{" "}
          {formatTime(
            safeRight,
          )}
        </div>
      </div>
    </div>
  );
}
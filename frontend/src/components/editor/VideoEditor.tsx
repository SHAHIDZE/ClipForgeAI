// src/components/editor/VideoEditor.tsx

"use client";

import "./Editor.css";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useEditorStore } from "../../../store/editor/useEditorStore";

import EditorToolbar from "./EditorToolbar";
import VideoPreview from "./VideoPreview";
import PropertiesPanel from "./PropertiesPanel";
import Timeline from "./Timeline/Timeline";

export default function VideoEditor() {
  const mediaUrl = useEditorStore(
    (state) => state.mediaUrl,
  );

  const playing = useEditorStore(
    (state) =>
      state.playback.playing,
  );

  const currentTime = useEditorStore(
    (state) =>
      state.playback.currentTime,
  );

  const duration = useEditorStore(
    (state) =>
      state.project.duration,
  );

  const setCurrentTime =
    useEditorStore(
      (state) =>
        state.setCurrentTime,
    );

  const setPlaying =
    useEditorStore(
      (state) =>
        state.setPlaying,
    );

  const setPlaybackRate =
    useEditorStore(
      (state) =>
        state.setPlaybackRate,
    );

  const setMedia =
    useEditorStore(
      (state) =>
        state.setMedia,
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [dragging, setDragging] =
    useState(false);

  const togglePlayback =
    useCallback(() => {
      if (!mediaUrl) {
        return;
      }

      setPlaying(!playing);
    }, [
      mediaUrl,
      playing,
      setPlaying,
    ]);

  const handleFile = (
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/",
      )
    ) {
      return;
    }

    const url =
      URL.createObjectURL(file);

    setMedia(
      url,
      0,
      file.name,
    );
  };

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ??
      null;

    handleFile(file);

    event.target.value = "";
  };

  const handleDragOver = (
    event: React.DragEvent,
  ) => {
    event.preventDefault();

    if (
      event.dataTransfer.types.includes(
        "Files",
      )
    ) {
      setDragging(true);
    }
  };

  const handleDragLeave = (
    event: React.DragEvent,
  ) => {
    event.preventDefault();
    setDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent,
  ) => {
    event.preventDefault();

    setDragging(false);

    handleFile(
      event.dataTransfer.files?.[0] ??
        null,
    );
  };

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.tagName ===
          "INPUT" ||
        target?.tagName ===
          "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (
        event.code === "Space"
      ) {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        event.preventDefault();

        useEditorStore
          .getState()
          .deleteSelectedClip();

        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          useEditorStore
            .getState()
            .redo();
        } else {
          useEditorStore
            .getState()
            .undo();
        }

        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();

        useEditorStore
          .getState()
          .redo();

        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "d"
      ) {
        event.preventDefault();

        useEditorStore
          .getState()
          .duplicateSelectedClip();

        return;
      }

      if (
        event.key.toLowerCase() ===
        "s"
      ) {
        event.preventDefault();

        useEditorStore
          .getState()
          .splitSelectedClip();

        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        const step = event.shiftKey
          ? 1
          : 1 / 30;

        setCurrentTime(
          Math.max(
            0,
            currentTime - step,
          ),
        );

        return;
      }

      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        const step = event.shiftKey
          ? 1
          : 1 / 30;

        setCurrentTime(
          Math.min(
            duration,
            currentTime + step,
          ),
        );

        return;
      }

      if (event.key === "Home") {
        event.preventDefault();

        setPlaying(false);
        setCurrentTime(0);

        return;
      }

      if (event.key === "End") {
        event.preventDefault();

        setPlaying(false);
        setCurrentTime(duration);

        return;
      }

      if (
        event.key.toLowerCase() ===
        "j"
      ) {
        event.preventDefault();

        setPlaybackRate(0.5);
        setPlaying(true);

        return;
      }

      if (
        event.key.toLowerCase() ===
        "k"
      ) {
        event.preventDefault();

        setPlaying(false);

        return;
      }

      if (
        event.key.toLowerCase() ===
        "l"
      ) {
        event.preventDefault();

        setPlaybackRate(2);
        setPlaying(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    currentTime,
    duration,
    setCurrentTime,
    setPlaybackRate,
    setPlaying,
    togglePlayback,
  ]);

  if (!mediaUrl) {
    return (
      <main
        className="cf-editor"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <EditorToolbar />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={
            handleFileInput
          }
        />

        <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize:
                "40px 40px",
            }}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className={`
              group
              relative
              z-10
              flex
              w-full
              max-w-[520px]
              flex-col
              items-center
              rounded-3xl
              border
              p-8
              text-center
              transition
              sm:p-12
              ${
                dragging
                  ? "scale-[1.02] border-indigo-400/70 bg-indigo-500/[0.08]"
                  : "border-white/[0.09] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.04]"
              }
            `}
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.04] text-3xl shadow-2xl transition group-hover:scale-105">
              🎬
            </div>

            <h1 className="text-xl font-semibold tracking-tight">
              {dragging
                ? "Drop your video here"
                : "Start editing a video"}
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">
              Drag and drop a video
              here, or click to
              choose one from your
              computer.
            </p>

            <div className="mt-7 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black">
              Choose video
            </div>

            <div className="mt-5 text-[10px] uppercase tracking-[0.18em] text-white/20">
              MP4 · MOV · WEBM
            </div>
          </button>
        </section>

        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-indigo-500/[0.06] backdrop-blur-[2px]">
            <div className="rounded-2xl border border-indigo-400/30 bg-[#0b0d12]/90 px-8 py-5 shadow-2xl">
              <div className="text-sm font-semibold">
                Release to import
                video
              </div>

              <div className="mt-1 text-xs text-white/35">
                ClipForge will
                prepare the timeline
                automatically
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className="cf-editor"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <EditorToolbar />

      

      <section className="cf-editor-main">
        <aside className="cf-tools-panel">
          <div className="cf-tools-header">
            TOOLS
          </div>

          <button
            type="button"
            className="cf-tool-button cf-tool-button-active"
          >
            <span className="cf-tool-icon">
              ▣
            </span>

            <span className="cf-tool-label">
              Media
            </span>
          </button>

          <button
            type="button"
            className="cf-tool-button"
          >
            <span className="cf-tool-icon">
              ♫
            </span>

            <span className="cf-tool-label">
              Audio
            </span>
          </button>

          <button
            type="button"
            className="cf-tool-button"
          >
            <span className="cf-tool-icon">
              T
            </span>

            <span className="cf-tool-label">
              Text
            </span>
          </button>

          <button
            type="button"
            className="cf-tool-button"
          >
            <span className="cf-tool-icon">
              ✦
            </span>

            <span className="cf-tool-label">
              Effects
            </span>
          </button>

          <button
            type="button"
            className="cf-tool-button"
          >
            <span className="cf-tool-icon">
              AI
            </span>

            <span className="cf-tool-label">
              AI
            </span>
          </button>
        </aside>

        <div className="cf-workspace">
          <VideoPreview />

          <Timeline />
        </div>

        

        <PropertiesPanel />
      </section>
    </main>
  );
}
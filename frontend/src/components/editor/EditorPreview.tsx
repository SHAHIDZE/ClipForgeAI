"use client";

import { RefObject } from "react";
import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
} from "lucide-react";

import type {
  EditorPlayback,
  EditorProject,
} from "../../../store/editor/editorTypes";

import { useEditorStore } from "../../../store/editor/useEditorStore";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  mediaUrl: string | null;
  project: EditorProject;
  playback: EditorPlayback;

  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;

  onTogglePlay: () => void;
  onSpeedChange: (rate: number) => void;
};

export default function EditorPreview({
  videoRef,
  mediaUrl,
  project,
  playback,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onTogglePlay,
  onSpeedChange,
}: Props) {
  const canvas = useEditorStore((state) => state.canvas);
  const setCurrentTime = useEditorStore(
    (state) => state.setCurrentTime,
  );

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "00:00";

    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs,
    ).padStart(2, "0")}`;
  };

  const skip = (amount: number) => {
    const next = Math.max(
      0,
      Math.min(
        project.duration || 0,
        playback.currentTime + amount,
      ),
    );

    setCurrentTime(next);
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await video.requestFullscreen();
      }
    } catch {
      // fullscreen not available
    }
  };

  return (
    <section className="cf-preview">
      {/* PREVIEW HEADER */}
      <div className="cf-preview-header">
        <div className="cf-preview-header-left">
          <span className="cf-preview-title">
            {project.name || "Untitled Project"}
          </span>

          <span className="cf-preview-ratio">
            {canvas.ratio}
          </span>
        </div>

        <div className="cf-preview-status">
          <span className="cf-status-dot" />
          READY
        </div>
      </div>

      {/* VIDEO AREA */}
      <div className="cf-preview-stage">
        <div
          className={`cf-preview-frame ${
            canvas.ratio === "9:16"
              ? "cf-frame-vertical"
              : canvas.ratio === "1:1"
                ? "cf-frame-square"
                : "cf-frame-horizontal"
          }`}
          style={{
            aspectRatio: `${canvas.width} / ${canvas.height}`,
          }}
        >
          {mediaUrl ? (
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                className="cf-preview-video"
                playsInline
                preload="metadata"
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
              />

              <div className="cf-preview-overlay" />
            </>
          ) : (
            <div className="cf-preview-empty">
              <div className="cf-preview-empty-icon">
                <Play size={24} />
              </div>

              <div className="cf-preview-empty-title">
                No video loaded
              </div>

              <div className="cf-preview-empty-subtitle">
                Upload a video to start editing
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PLAYER */}
      <div className="cf-player">
        <div className="cf-player-main">
          <button
            type="button"
            onClick={() => skip(-5)}
            disabled={!mediaUrl}
            title="Back 5 seconds"
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            className="cf-player-play"
            onClick={onTogglePlay}
            disabled={!mediaUrl}
          >
            {playback.playing ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skip(5)}
            disabled={!mediaUrl}
            title="Forward 5 seconds"
          >
            <RotateCw size={17} />
          </button>
        </div>

        <div className="cf-player-bottom">
          <div className="cf-player-time">
            {formatTime(playback.currentTime)}
            <span>/</span>
            {formatTime(project.duration)}
          </div>

          <div className="cf-player-progress">
            <input
              type="range"
              min={0}
              max={project.duration || 0}
              step={0.01}
              value={Math.min(
                playback.currentTime,
                project.duration || 0,
              )}
              disabled={!mediaUrl || !project.duration}
              onChange={(event) => {
                setCurrentTime(
                  Number(event.target.value),
                );
              }}
            />
          </div>

          <div className="cf-player-controls">
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                type="button"
                className={
                  playback.playbackRate === rate
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onSpeedChange(rate)
                }
              >
                {rate}x
              </button>
            ))}

            <button
              type="button"
              className="cf-icon-button"
              onClick={toggleMute}
              disabled={!mediaUrl}
              title="Mute"
            >
              <Volume2 size={15} />
            </button>

            <button
              type="button"
              className="cf-icon-button"
              onClick={toggleFullscreen}
              disabled={!mediaUrl}
              title="Fullscreen"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useEditorStore } from "../../../store/editor/useEditorStore";

export default function VideoPreview() {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const mediaUrl = useEditorStore(
    (state) => state.mediaUrl,
  );

  const project = useEditorStore(
    (state) => state.project,
  );

  const playback = useEditorStore(
    (state) => state.playback,
  );

  const canvas = useEditorStore(
    (state) => state.canvas,
  );

  const tracks = useEditorStore(
    (state) => state.timeline.tracks,
  );

  const selection = useEditorStore(
    (state) => state.selection,
  );

  const setCurrentTime = useEditorStore(
    (state) => state.setCurrentTime,
  );

  const setPlaying = useEditorStore(
    (state) => state.setPlaying,
  );

  const setPlaybackRate = useEditorStore(
    (state) => state.setPlaybackRate,
  );

  /*
  ============================================================
  SELECTED CLIP
  ============================================================
  */

  const selectedClip = useMemo(() => {
    if (!selection.clipId) {
      return null;
    }

    for (const track of tracks) {
      const clip = track.clips.find(
        (item) =>
          item.id === selection.clipId,
      );

      if (clip) {
        return clip;
      }
    }

    return null;
  }, [tracks, selection.clipId]);

  /*
  ============================================================
  SELECTED VIDEO CLIP
  ============================================================
  */

  const videoClip = useMemo(() => {
    if (selectedClip?.type === "video") {
      return selectedClip;
    }

    const videoTrack = tracks.find(
      (track) =>
        track.type === "video",
    );

    if (!videoTrack) {
      return null;
    }

    return videoTrack.clips[0] ?? null;
  }, [selectedClip, tracks]);

  /*
  ============================================================
  CLIP STYLE
  ============================================================
  */

  const clipStyle = videoClip?.style ?? {};

  const opacity =
    typeof clipStyle.opacity === "number"
      ? Math.max(
          0,
          Math.min(1, clipStyle.opacity),
        )
      : 1;

  const scale =
    typeof clipStyle.scale === "number"
      ? Math.max(
          0.1,
          Math.min(10, clipStyle.scale),
        )
      : 1;

  const positionX =
    typeof clipStyle.positionX === "number"
      ? clipStyle.positionX
      : 0;

  const positionY =
    typeof clipStyle.positionY === "number"
      ? clipStyle.positionY
      : 0;

  const rotation =
    typeof clipStyle.rotation === "number"
      ? clipStyle.rotation
      : 0;

  const volume =
    typeof videoClip?.volume === "number"
      ? Math.max(
          0,
          Math.min(1, videoClip.volume),
        )
      : 1;

  const speed =
    typeof videoClip?.speed === "number"
      ? Math.max(
          0.25,
          Math.min(4, videoClip.speed),
        )
      : playback.playbackRate;

  /*
  ============================================================
  TIME FORMAT
  ============================================================
  */

  const formatTime = (
    seconds: number,
  ) => {
    if (!Number.isFinite(seconds)) {
      return "00:00";
    }

    const total = Math.max(
      0,
      Math.floor(seconds),
    );

    const minutes = Math.floor(
      total / 60,
    );

    const secs = total % 60;

    return `${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  /*
  ============================================================
  PLAYBACK RATE
  ============================================================
  */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.playbackRate = speed;
  }, [speed]);

  /*
  ============================================================
  VOLUME
  ============================================================
  */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.volume = volume;
  }, [volume]);

  /*
  ============================================================
  CURRENT TIME SYNC
  ============================================================
  */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const difference =
      Math.abs(
        video.currentTime -
          playback.currentTime,
      );

    if (difference > 0.15) {
      try {
        video.currentTime =
          playback.currentTime;
      } catch {
        // Ignore browser seek errors.
      }
    }
  }, [playback.currentTime]);

  /*
  ============================================================
  PLAY / PAUSE
  ============================================================
  */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (playback.playing) {
      video
        .play()
        .catch(() => {
          setPlaying(false);
        });
    } else {
      video.pause();
    }
  }, [
    playback.playing,
    setPlaying,
  ]);

  /*
  ============================================================
  TIME UPDATE
  ============================================================
  */

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setCurrentTime(
      video.currentTime,
    );
  };

  /*
  ============================================================
  METADATA
  ============================================================
  */

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      useEditorStore
        .getState()
        .setProjectDuration(
          video.duration,
        );
    }
  };

  /*
  ============================================================
  PLAY
  ============================================================
  */

  const togglePlay = () => {
    if (!mediaUrl) {
      return;
    }

    setPlaying(
      !playback.playing,
    );
  };

  /*
  ============================================================
  SKIP
  ============================================================
  */

  const skip = (
    amount: number,
  ) => {
    const duration =
      project.duration || 0;

    const next = Math.max(
      0,
      Math.min(
        duration,
        playback.currentTime +
          amount,
      ),
    );

    setCurrentTime(next);
  };

  /*
  ============================================================
  MUTE
  ============================================================
  */

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
  };

  /*
  ============================================================
  FULLSCREEN
  ============================================================
  */

  const toggleFullscreen =
    async () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      try {
        if (
          document.fullscreenElement
        ) {
          await document.exitFullscreen();
        } else {
          await video.requestFullscreen();
        }
      } catch {
        // Browser may block fullscreen.
      }
    };

  /*
  ============================================================
  CANVAS FRAME
  ============================================================
  */

  const frameClass =
    canvas.ratio === "9:16"
      ? "cf-preview-frame cf-frame-vertical"
      : canvas.ratio === "1:1"
        ? "cf-preview-frame cf-frame-square"
        : "cf-preview-frame cf-frame-horizontal";

  /*
  ============================================================
  VIDEO TRANSFORM
  ============================================================
  */

  const videoTransform = `
    translate(
      ${positionX}px,
      ${positionY}px
    )
    scale(${scale})
    rotate(${rotation}deg)
  `;

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <section className="cf-preview">

      {/* ====================================================
          PREVIEW HEADER
      ==================================================== */}

      <div className="cf-preview-header">

        <div className="cf-preview-header-left">

          <span className="cf-preview-title">
            {project.name ||
              "Untitled Project"}
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

      {/* ====================================================
          VIDEO STAGE
      ==================================================== */}

      <div className="cf-preview-stage">

        <div
          className={frameClass}
          style={{
            aspectRatio:
              `${canvas.width}/${canvas.height}`,
          }}
        >

          {mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="cf-preview-video"
              playsInline
              preload="metadata"
              onTimeUpdate={
                handleTimeUpdate
              }
              onLoadedMetadata={
                handleLoadedMetadata
              }
              onEnded={() =>
                setPlaying(false)
              }
              style={{
                opacity,
                transform:
                  videoTransform,
                transformOrigin:
                  "center center",
              }}
            />
          ) : (
            <div className="cf-preview-empty">

              <div className="cf-preview-empty-icon">
                <Play
                  size={24}
                  fill="currentColor"
                />
              </div>

              <div className="cf-preview-empty-title">
                No video loaded
              </div>

              <div className="cf-preview-empty-subtitle">
                Upload a video to start editing
              </div>

            </div>
          )}

          {mediaUrl && (
            <div className="cf-preview-overlay" />
          )}

        </div>

      </div>

      {/* ====================================================
          PLAYER
      ==================================================== */}

      <div className="cf-player">

        <div className="cf-player-main">

          <button
            type="button"
            onClick={() =>
              skip(-5)
            }
            disabled={!mediaUrl}
            title="Back 5 seconds"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            className="cf-player-play"
            onClick={togglePlay}
            disabled={!mediaUrl}
            title={
              playback.playing
                ? "Pause"
                : "Play"
            }
          >
            {playback.playing ? (
              <Pause
                size={16}
                fill="currentColor"
              />
            ) : (
              <Play
                size={16}
                fill="currentColor"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              skip(5)
            }
            disabled={!mediaUrl}
            title="Forward 5 seconds"
          >
            <RotateCw size={15} />
          </button>

        </div>

        <div className="cf-player-bottom">

          <div className="cf-player-time">
            {formatTime(
              playback.currentTime,
            )}

            <span>/</span>

            {formatTime(
              project.duration,
            )}
          </div>

          <div className="cf-player-progress">
            <input
              type="range"
              min={0}
              max={
                project.duration || 0
              }
              step={0.01}
              value={Math.min(
                playback.currentTime,
                project.duration || 0,
              )}
              disabled={!mediaUrl}
              onChange={(event) =>
                setCurrentTime(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </div>

          <div className="cf-player-controls">

            {[0.5, 1, 1.5, 2].map(
              (rate) => (
                <button
                  key={rate}
                  type="button"
                  className={
                    playback.playbackRate ===
                    rate
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPlaybackRate(rate)
                  }
                >
                  {rate}x
                </button>
              ),
            )}

            <button
              type="button"
              className="cf-icon-button"
              onClick={toggleMute}
              disabled={!mediaUrl}
              title="Mute"
            >
              <Volume2 size={14} />
            </button>

            <button
              type="button"
              className="cf-icon-button"
              onClick={
                toggleFullscreen
              }
              disabled={!mediaUrl}
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}
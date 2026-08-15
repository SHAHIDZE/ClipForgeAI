"use client";

import {
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Plus,
} from "lucide-react";

import {
  useMemo,
  useRef,
} from "react";

import { useEditorStore } from "../../../../store/editor/useEditorStore";

import type {
  EditorClip,
  EditorTrack,
} from "../../../../store/editor/editorTypes";

import "../Timeline.css";

const MIN_PX_PER_SECOND = 40;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const total = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    secs,
  ).padStart(2, "0")}`;
}

function clipColor(type: EditorClip["type"]) {
  switch (type) {
    case "video":
      return "video";

    case "audio":
      return "audio";

    case "caption":
      return "caption";

    case "overlay":
      return "overlay";

    default:
      return "video";
  }
}

export default function Timeline() {
  const timeline = useEditorStore(
    (state) => state.timeline,
  );

  const project = useEditorStore(
    (state) => state.project,
  );

  const playback = useEditorStore(
    (state) => state.playback,
  );

  const selection = useEditorStore(
    (state) => state.selection,
  );

  const setCurrentTime = useEditorStore(
    (state) => state.setCurrentTime,
  );

  const setZoom = useEditorStore(
    (state) => state.setZoom,
  );

  const selectClip = useEditorStore(
    (state) => state.selectClip,
  );

  const splitSelectedClip = useEditorStore(
    (state) => state.splitSelectedClip,
  );

  const deleteSelectedClip = useEditorStore(
    (state) => state.deleteSelectedClip,
  );

  const duplicateSelectedClip = useEditorStore(
    (state) => state.duplicateSelectedClip,
  );

  const toggleTrackMute = useEditorStore(
    (state) => state.toggleTrackMute,
  );

  const toggleTrackLock = useEditorStore(
    (state) => state.toggleTrackLock,
  );

  const toggleTrackVisibility = useEditorStore(
    (state) => state.toggleTrackVisibility,
  );

  const addTrack = useEditorStore(
    (state) => state.addTrack,
  );

  const moveClip = useEditorStore(
    (state) => state.moveClip,
  );

  const resizeClip = useEditorStore(
    (state) => state.resizeClip,
  );

  const timelineRef =
    useRef<HTMLDivElement | null>(null);

  const dragRef =
    useRef<{
      clipId: string;
      trackId: string;
      offset: number;
    } | null>(null);

  const resizeRef =
    useRef<{
      clipId: string;
      trackId: string;
      side: "left" | "right";
    } | null>(null);

  const duration = Math.max(
    project.duration || 0,
    0.1,
  );

  const pixelsPerSecond =
    MIN_PX_PER_SECOND * timeline.zoom;

  const timelineWidth = Math.max(
    duration * pixelsPerSecond,
    700,
  );

  const playheadLeft =
    playback.currentTime *
    pixelsPerSecond;

  const timeMarks = useMemo(() => {
    const marks: number[] = [];

    let step = 1;

    if (timeline.zoom < 0.6) {
      step = 5;
    } else if (timeline.zoom < 1) {
      step = 2;
    } else if (timeline.zoom > 2) {
      step = 0.5;
    }

    for (
      let time = 0;
      time <= duration + 0.001;
      time += step
    ) {
      marks.push(
        Number(time.toFixed(2)),
      );
    }

    return marks;
  }, [
    duration,
    timeline.zoom,
  ]);

  const getTimelineTime = (
    clientX: number,
  ) => {
    if (!timelineRef.current) {
      return 0;
    }

    const rect =
      timelineRef.current.getBoundingClientRect();

    const x =
      clientX -
      rect.left;

    return Math.max(
      0,
      Math.min(
        duration,
        x / pixelsPerSecond,
      ),
    );
  };

  const handleTimelineClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event.target !==
        event.currentTarget &&
      !(event.target as HTMLElement).classList.contains(
        "cf-timeline-canvas",
      )
    ) {
      return;
    }

    setCurrentTime(
      getTimelineTime(
        event.clientX,
      ),
    );
  };

  const handleClipMouseDown = (
    event: React.MouseEvent,
    clip: EditorClip,
    track: EditorTrack,
  ) => {
    event.stopPropagation();

    if (track.locked) {
      return;
    }

    selectClip(
      clip.id,
      track.id,
    );

    const target =
      event.currentTarget as HTMLElement;

    const rect =
      target.getBoundingClientRect();

    const offset =
      event.clientX -
      rect.left;

    dragRef.current = {
      clipId: clip.id,
      trackId: track.id,
      offset,
    };

    const handleMouseMove = (
      moveEvent: MouseEvent,
    ) => {
      const drag =
        dragRef.current;

      if (
        !drag ||
        !timelineRef.current
      ) {
        return;
      }

      const timelineRect =
        timelineRef.current.getBoundingClientRect();

      const x =
        moveEvent.clientX -
        timelineRect.left -
        drag.offset;

      const start =
        x / pixelsPerSecond;

      moveClip(
        drag.clipId,
        drag.trackId,
        start,
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;

      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp,
      );
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove,
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp,
    );
  };

  const handleResizeMouseDown = (
    event: React.MouseEvent,
    clip: EditorClip,
    track: EditorTrack,
    side: "left" | "right",
  ) => {
    event.stopPropagation();

    if (track.locked) {
      return;
    }

    selectClip(
      clip.id,
      track.id,
    );

    resizeRef.current = {
      clipId: clip.id,
      trackId: track.id,
      side,
    };

    const handleMouseMove = (
      moveEvent: MouseEvent,
    ) => {
      const resize =
        resizeRef.current;

      if (
        !resize ||
        !timelineRef.current
      ) {
        return;
      }

      const time =
        getTimelineTime(
          moveEvent.clientX,
        );

      resizeClip(
        resize.clipId,
        resize.trackId,
        resize.side,
        time,
      );
    };

    const handleMouseUp = () => {
      resizeRef.current = null;

      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp,
      );
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove,
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp,
    );
  };

  const handleZoom = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setZoom(
      Number(event.target.value),
    );
  };

  return (
    <section className="cf-timeline">

      {/* HEADER */}

      <div className="cf-timeline-header">
        <div className="cf-timeline-header-left">
          <span className="cf-timeline-title">
            Timeline
          </span>

          <span className="cf-timeline-track-count">
            {timeline.tracks.length} tracks
          </span>
        </div>

        <div className="cf-timeline-actions">

          <button
            type="button"
            onClick={splitSelectedClip}
            disabled={!selection.clipId}
          >
            Split
          </button>

          <button
            type="button"
            onClick={duplicateSelectedClip}
            disabled={!selection.clipId}
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={deleteSelectedClip}
            disabled={!selection.clipId}
            className="danger"
          >
            Delete
          </button>

        </div>
      </div>

      {/* TOOLBAR */}

      <div className="cf-timeline-toolbar">

        <div className="cf-timeline-tool-left">

          <button
            type="button"
            onClick={() =>
              addTrack("video")
            }
          >
            <Plus size={14} />
            Video
          </button>

          <button
            type="button"
            onClick={() =>
              addTrack("audio")
            }
          >
            <Plus size={14} />
            Audio
          </button>

          <button
            type="button"
            onClick={() =>
              addTrack("caption")
            }
          >
            <Plus size={14} />
            Captions
          </button>

          <button
            type="button"
            onClick={() =>
              addTrack("overlay")
            }
          >
            <Plus size={14} />
            Overlay
          </button>

        </div>

        <div className="cf-timeline-zoom">

          <span>−</span>

          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={timeline.zoom}
            onChange={handleZoom}
          />

          <span>+</span>

          <span className="cf-zoom-value">
            {Math.round(
              timeline.zoom * 100,
            )}
            %
          </span>

        </div>
      </div>

      {/* TIMELINE BODY */}

      <div className="cf-timeline-body">

        <div className="cf-timeline-scroll-wrapper">

          {/* TRACK LABELS */}

          <div className="cf-track-labels">

            <div className="cf-track-label-spacer" />

            {timeline.tracks.map(
              (track) => (
                <div
                  key={track.id}
                  className={`cf-track-label ${
                    track.locked
                      ? "is-locked"
                      : ""
                  }`}
                >

                  <div className="cf-track-label-main">

                    <div className="cf-track-type">
                      {track.type ===
                        "video" && "▣"}

                      {track.type ===
                        "audio" && "♫"}

                      {track.type ===
                        "caption" && "T"}

                      {track.type ===
                        "overlay" && "◆"}
                    </div>

                    <span>
                      {track.name}
                    </span>

                  </div>

                  <div className="cf-track-actions">

                    <button
                      type="button"
                      onClick={() =>
                        toggleTrackMute(
                          track.id,
                        )
                      }
                      title={
                        track.muted
                          ? "Unmute"
                          : "Mute"
                      }
                    >
                      {track.muted ? (
                        <VolumeX size={13} />
                      ) : (
                        <Volume2 size={13} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleTrackVisibility(
                          track.id,
                        )
                      }
                      title={
                        track.visible
                          ? "Hide track"
                          : "Show track"
                      }
                    >
                      {track.visible ? (
                        <Eye size={13} />
                      ) : (
                        <EyeOff size={13} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleTrackLock(
                          track.id,
                        )
                      }
                      title={
                        track.locked
                          ? "Unlock"
                          : "Lock"
                      }
                    >
                      {track.locked ? (
                        <Lock size={13} />
                      ) : (
                        <LockOpen size={13} />
                      )}
                    </button>

                  </div>
                </div>
              ),
            )}

          </div>

          {/* TIMELINE */}

          <div
            className="cf-timeline-scroll"
            ref={timelineRef}
          >

            <div
              className="cf-timeline-canvas"
              style={{
                width: `${timelineWidth}px`,
              }}
              onClick={
                handleTimelineClick
              }
            >

              {/* RULER */}

              <div className="cf-timeline-ruler">

                {timeMarks.map(
                  (time) => (
                    <div
                      key={`ruler-${time}`}
                      className="cf-time-mark"
                      style={{
                        left: `${
                          time *
                          pixelsPerSecond
                        }px`,
                      }}
                    >
                      <span>
                        {formatTime(
                          time,
                        )}
                      </span>
                    </div>
                  ),
                )}

              </div>

              {/* GRID */}

              <div className="cf-timeline-grid">

                {timeMarks.map(
                  (time) => (
                    <div
                      key={`grid-${time}`}
                      className="cf-grid-line"
                      style={{
                        left: `${
                          time *
                          pixelsPerSecond
                        }px`,
                      }}
                    />
                  ),
                )}

              </div>

              {/* TRACKS */}

              <div className="cf-timeline-tracks">

                {timeline.tracks.map(
                  (track) => (
                    <div
                      key={track.id}
                      className={`cf-timeline-track ${
                        track.locked
                          ? "is-locked"
                          : ""
                      } ${
                        track.visible
                          ? ""
                          : "is-hidden"
                      }`}
                    >

                      {track.clips.map(
                        (clip) => {

                          const left =
                            clip.start *
                            pixelsPerSecond;

                          const width =
                            Math.max(
                              clip.duration *
                                pixelsPerSecond,
                              14,
                            );

                          const selected =
                            selection.clipId ===
                              clip.id &&
                            selection.trackId ===
                              track.id;

                          return (
                            <div
                              key={clip.id}
                              className={`cf-timeline-clip cf-clip-${clipColor(
                                clip.type,
                              )} ${
                                selected
                                  ? "is-selected"
                                  : ""
                              }`}
                              style={{
                                left: `${left}px`,
                                width: `${width}px`,
                              }}
                              onMouseDown={(
                                event,
                              ) =>
                                handleClipMouseDown(
                                  event,
                                  clip,
                                  track,
                                )
                              }
                              onClick={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              {/* LEFT HANDLE */}

                              <div
                                className="cf-clip-handle cf-clip-handle-left"
                                onMouseDown={(
                                  event,
                                ) =>
                                  handleResizeMouseDown(
                                    event,
                                    clip,
                                    track,
                                    "left",
                                  )
                                }
                              />

                              {/* CONTENT */}

                              <div className="cf-clip-content">

                                <div className="cf-clip-name">
                                  {clip.name ||
                                    "Clip"}
                                </div>

                                <div className="cf-clip-duration">
                                  {formatTime(
                                    clip.duration,
                                  )}
                                </div>

                              </div>

                              {/* RIGHT HANDLE */}

                              <div
                                className="cf-clip-handle cf-clip-handle-right"
                                onMouseDown={(
                                  event,
                                ) =>
                                  handleResizeMouseDown(
                                    event,
                                    clip,
                                    track,
                                    "right",
                                  )
                                }
                              />

                            </div>
                          );
                        },
                      )}

                    </div>
                  ),
                )}

              </div>

              {/* PLAYHEAD */}

              <div
                className="cf-timeline-playhead"
                style={{
                  left: `${playheadLeft}px`,
                }}
              >
                <div className="cf-playhead-head" />
                <div className="cf-playhead-line" />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <div className="cf-timeline-footer">

        <span>
          Time
        </span>

        <strong>
          {formatTime(
            playback.currentTime,
          )}
        </strong>

        <span>
          /
        </span>

        <strong>
          {formatTime(
            project.duration,
          )}
        </strong>

      </div>

    </section>
  );
}
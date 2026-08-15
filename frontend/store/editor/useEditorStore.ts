// src/store/editor/useEditorStore.ts

"use client";

import { create } from "zustand";

import type {
  CanvasRatio,
  EditorClip,
  EditorClipType,
  EditorSnapshot,
  EditorState,
} from "./editorTypes";

/* ============================================================
   DEFAULT CANVAS
============================================================ */

const DEFAULT_CANVAS = {
  ratio: "9:16" as CanvasRatio,
  width: 1080,
  height: 1920,
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_HISTORY = 100;
const MIN_CLIP_DURATION = 0.1;
const SNAP_DISTANCE = 0.12;

/* ============================================================
   HELPERS
============================================================ */

const clone = <T,>(value: T): T => {
  return structuredClone(value);
};

const createId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const safeNumber = (value: number, fallback = 0): number => {
  return Number.isFinite(value) ? value : fallback;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/* ============================================================
   CLIP FACTORIES
============================================================ */

function createVideoClip(
  filename: string,
  duration: number,
): EditorClip {
  return {
    id: createId(),
    name: filename || "Video",
    type: "video",
    start: 0,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    color: "#6366f1",
    volume: 100,
    speed: 1,
    style: {
      opacity: 100,
      positionX: 0,
      positionY: 0,
      scale: 100,
      rotation: 0,
    },
  };
}

function createAudioClip(duration: number): EditorClip {
  return {
    id: createId(),
    name: "Original Audio",
    type: "audio",
    start: 0,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    color: "#14b8a6",
    volume: 100,
    speed: 1,
  };
}

/* ============================================================
   TRACK FACTORY
============================================================ */

function createTrack(
  type: EditorClipType,
  name: string,
  clips: EditorClip[] = [],
) {
  return {
    id: createId(),
    name,
    type,
    muted: false,
    locked: false,
    visible: true,
    clips,
  };
}

function createTracks(
  filename: string,
  duration: number,
) {
  const safeDuration = Math.max(
    0,
    safeNumber(duration, 0),
  );

  const videoClip =
    safeDuration > 0
      ? createVideoClip(filename, safeDuration)
      : null;

  const audioClip =
    safeDuration > 0
      ? createAudioClip(safeDuration)
      : null;

  return [
    createTrack(
      "video",
      "Video",
      videoClip ? [videoClip] : [],
    ),

    createTrack(
      "audio",
      "Audio",
      audioClip ? [audioClip] : [],
    ),

    createTrack(
      "caption",
      "Captions",
      [],
    ),

    createTrack(
      "overlay",
      "Overlay",
      [],
    ),
  ];
}

/* ============================================================
   STORE
============================================================ */

export const useEditorStore = create<EditorState>((set, get) => {
  /* ==========================================================
     SNAPSHOT
  ========================================================== */

  const snapshot = (): EditorSnapshot => {
    const state = get();

    return {
      tracks: clone(state.timeline.tracks),
      selection: clone(state.selection),
    };
  };

  /* ==========================================================
     HISTORY
  ========================================================== */

  const pushHistory = () => {
    const current = snapshot();

    set((state) => ({
      history: {
        past: [
          ...state.history.past,
          current,
        ].slice(-MAX_HISTORY),

        future: [],
      },
    }));
  };

  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  return {
    project: {
      id: null,
      name: "Untitled Project",
      filename: null,
      duration: 0,
    },

    mediaUrl: null,

    playback: {
      currentTime: 0,
      playing: false,
      playbackRate: 1,
    },

    canvas: DEFAULT_CANVAS,

    timeline: {
      tracks: [],
      zoom: 1,
      scrollLeft: 0,
    },

    selection: {
      clipId: null,
      trackId: null,
    },

    activeTool: "select",

    history: {
      past: [],
      future: [],
    },

    /* ========================================================
       MEDIA
    ======================================================== */

    setMedia: (url, duration, filename) => {
      const safeDuration =
        Number.isFinite(duration) && duration > 0
          ? duration
          : 0;

      const safeFilename =
        filename?.trim() || "Video";

      const cleanName =
        safeFilename.replace(/\.[^/.]+$/, "");

      const tracks = createTracks(
        safeFilename,
        safeDuration,
      );

      set({
        mediaUrl: url || null,

        project: {
          id: null,
          name:
            cleanName ||
            "Untitled Project",
          filename: filename ?? null,
          duration: safeDuration,
        },

        playback: {
          currentTime: 0,
          playing: false,
          playbackRate: 1,
        },

        timeline: {
          tracks,
          zoom: 1,
          scrollLeft: 0,
        },

        selection: {
          clipId: null,
          trackId: null,
        },

        activeTool: "select",

        history: {
          past: [],
          future: [],
        },
      });

      if (safeDuration > 0) {
        const state = get();

        const videoTrack =
          state.timeline.tracks.find(
            (track) =>
              track.type === "video",
          );

        const firstClip =
          videoTrack?.clips[0];

        if (videoTrack && firstClip) {
          set({
            selection: {
              clipId: firstClip.id,
              trackId: videoTrack.id,
            },
          });
        }
      }
    },

    /* ========================================================
       PROJECT DURATION
    ======================================================== */

    setProjectDuration: (duration) => {
      const safeDuration = safeNumber(
        duration,
        0,
      );

      if (safeDuration <= 0) {
        return;
      }

      set((state) => {
        const currentDuration =
          state.project.duration;

        if (
          Math.abs(
            currentDuration -
              safeDuration,
          ) < 0.05
        ) {
          return state;
        }

        let tracks =
          state.timeline.tracks;

        const videoTrack =
          tracks.find(
            (track) =>
              track.type === "video",
          );

        const hasVideoClip =
          !!videoTrack &&
          videoTrack.clips.length > 0;

        if (!hasVideoClip) {
          tracks = createTracks(
            state.project.filename ||
              "Video",
            safeDuration,
          );
        } else {
          tracks = tracks.map((track) => {
            if (
              track.type === "video" ||
              track.type === "audio"
            ) {
              return {
                ...track,

                clips:
                  track.clips.map(
                    (clip) => ({
                      ...clip,
                      duration:
                        safeDuration,
                      sourceDuration:
                        safeDuration,
                      start: 0,
                      sourceStart: 0,
                    }),
                  ),
              };
            }

            return track;
          });
        }

        return {
          project: {
            ...state.project,
            duration: safeDuration,
          },

          timeline: {
            ...state.timeline,
            tracks,
          },
        };
      });

      const state = get();

      if (!state.selection.clipId) {
        const videoTrack =
          state.timeline.tracks.find(
            (track) =>
              track.type === "video",
          );

        const firstClip =
          videoTrack?.clips[0];

        if (videoTrack && firstClip) {
          set({
            selection: {
              clipId: firstClip.id,
              trackId: videoTrack.id,
            },
          });
        }
      }
    },

    /* ========================================================
       PLAYBACK
    ======================================================== */

    setCurrentTime: (time) => {
      set((state) => {
        const duration = Math.max(
          0,
          safeNumber(
            state.project.duration,
            0,
          ),
        );

        const nextTime = clamp(
          safeNumber(time, 0),
          0,
          duration,
        );

        return {
          playback: {
            ...state.playback,
            currentTime: nextTime,
          },
        };
      });
    },

    setPlaying: (playing) => {
      set((state) => ({
        playback: {
          ...state.playback,
          playing: Boolean(playing),
        },
      }));
    },

    setPlaybackRate: (rate) => {
      const safeRate = clamp(
        safeNumber(rate, 1),
        0.25,
        4,
      );

      set((state) => ({
        playback: {
          ...state.playback,
          playbackRate: safeRate,
        },
      }));
    },

    /* ========================================================
       TIMELINE ZOOM
    ======================================================== */

    setZoom: (zoom) => {
      const safeZoom = clamp(
        safeNumber(zoom, 1),
        0.25,
        8,
      );

      set((state) => ({
        timeline: {
          ...state.timeline,
          zoom: safeZoom,
        },
      }));
    },

    setScrollLeft: (value) => {
      set((state) => ({
        timeline: {
          ...state.timeline,
          scrollLeft: Math.max(
            0,
            safeNumber(value, 0),
          ),
        },
      }));
    },

    /* ========================================================
       CANVAS
    ======================================================== */

    setCanvasRatio: (ratio) => {
      let width = 1080;
      let height = 1920;

      if (ratio === "16:9") {
        width = 1920;
        height = 1080;
      }

      if (ratio === "1:1") {
        width = 1080;
        height = 1080;
      }

      if (ratio === "custom") {
        width = 1920;
        height = 1080;
      }

      set({
        canvas: {
          ratio,
          width,
          height,
        },
      });
    },

    /* ========================================================
       ACTIVE TOOL
    ======================================================== */

    setActiveTool: (tool) => {
      set({
        activeTool: tool,
      });
    },

    /* ========================================================
       UPDATE CLIP
    ======================================================== */

    updateClip: (
      clipId,
      trackId,
      updates,
    ) => {
      const state = get();

      const track =
        state.timeline.tracks.find(
          (item) =>
            item.id === trackId,
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      pushHistory();

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === trackId
                  ? {
                      ...item,

                      clips:
                        item.clips.map(
                          (current) =>
                            current.id ===
                            clipId
                              ? {
                                  ...current,
                                  ...updates,
                                }
                              : current,
                        ),
                    }
                  : item,
            ),
        },
      }));
    },

    /* ========================================================
       UPDATE CLIP STYLE
    ======================================================== */

    updateClipStyle: (
      clipId,
      trackId,
      updates,
    ) => {
      const state = get();

      const track =
        state.timeline.tracks.find(
          (item) =>
            item.id === trackId,
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      pushHistory();

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === trackId
                  ? {
                      ...item,

                      clips:
                        item.clips.map(
                          (current) =>
                            current.id ===
                            clipId
                              ? {
                                  ...current,

                                  style: {
                                    ...(current.style ??
                                      {}),
                                    ...updates,
                                  },
                                }
                              : current,
                        ),
                    }
                  : item,
            ),
        },
      }));
    },

    /* ========================================================
       SELECTION
    ======================================================== */

    selectClip: (
      clipId,
      trackId = null,
    ) => {
      set({
        selection: {
          clipId,
          trackId,
        },
      });
    },

    /* ========================================================
       SPLIT
    ======================================================== */

    splitSelectedClip: () => {
      const state = get();

      const {
        clipId,
        trackId,
      } = state.selection;

      if (!clipId) {
        return;
      }

      const track =
        state.timeline.tracks.find(
          (item) => {
            if (trackId) {
              return item.id === trackId;
            }

            return item.clips.some(
              (clip) =>
                clip.id === clipId,
            );
          },
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      const currentTime =
        state.playback.currentTime;

      const localTime =
        currentTime - clip.start;

      if (
        localTime <= MIN_CLIP_DURATION ||
        localTime >=
          clip.duration -
            MIN_CLIP_DURATION
      ) {
        return;
      }

      pushHistory();

      const firstDuration =
        localTime;

      const secondDuration =
        clip.duration -
        firstDuration;

      const first: EditorClip = {
        ...clone(clip),

        id: createId(),

        duration: firstDuration,
        sourceDuration: firstDuration,
      };

      const second: EditorClip = {
        ...clone(clip),

        id: createId(),

        start:
          clip.start +
          firstDuration,

        duration: secondDuration,

        sourceStart:
          clip.sourceStart +
          firstDuration,

        sourceDuration:
          secondDuration,
      };

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === track.id
                  ? {
                      ...item,

                      clips: [
                        ...item.clips.filter(
                          (current) =>
                            current.id !==
                            clip.id,
                        ),

                        first,
                        second,
                      ].sort(
                        (a, b) =>
                          a.start -
                          b.start,
                      ),
                    }
                  : item,
            ),
        },

        selection: {
          clipId: second.id,
          trackId: track.id,
        },
      }));
    },

    /* ========================================================
       DELETE
    ======================================================== */

    deleteSelectedClip: () => {
      const state = get();

      const {
        clipId,
        trackId,
      } = state.selection;

      if (!clipId) {
        return;
      }

      const track =
        state.timeline.tracks.find(
          (item) =>
            (trackId &&
              item.id === trackId) ||
            item.clips.some(
              (clip) =>
                clip.id === clipId,
            ),
        );

      if (!track || track.locked) {
        return;
      }

      const exists =
        track.clips.some(
          (clip) =>
            clip.id === clipId,
        );

      if (!exists) {
        return;
      }

      pushHistory();

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === track.id
                  ? {
                      ...item,

                      clips:
                        item.clips.filter(
                          (clip) =>
                            clip.id !==
                            clipId,
                        ),
                    }
                  : item,
            ),
        },

        selection: {
          clipId: null,
          trackId: null,
        },
      }));
    },

    /* ========================================================
       DUPLICATE
    ======================================================== */

    duplicateSelectedClip: () => {
      const state = get();

      const {
        clipId,
        trackId,
      } = state.selection;

      if (!clipId || !trackId) {
        return;
      }

      const track =
        state.timeline.tracks.find(
          (item) =>
            item.id === trackId,
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      pushHistory();

      const desiredStart =
        clip.start +
        clip.duration +
        0.1;

      const maxStart = Math.max(
        0,
        state.project.duration -
          clip.duration,
      );

      const duplicate: EditorClip = {
        ...clone(clip),

        id: createId(),

        start: clamp(
          desiredStart,
          0,
          maxStart,
        ),
      };

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === track.id
                  ? {
                      ...item,

                      clips: [
                        ...item.clips,
                        duplicate,
                      ].sort(
                        (a, b) =>
                          a.start -
                          b.start,
                      ),
                    }
                  : item,
            ),
        },

        selection: {
          clipId: duplicate.id,
          trackId: track.id,
        },
      }));
    },

    /* ========================================================
       MOVE CLIP
    ======================================================== */

    moveClip: (
      clipId,
      trackId,
      start,
    ) => {
      const state = get();

      const track =
        state.timeline.tracks.find(
          (item) =>
            item.id === trackId,
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      let nextStart = Math.max(
        0,
        safeNumber(start, clip.start),
      );

      const maxStart = Math.max(
        0,
        state.project.duration -
          clip.duration,
      );

      nextStart = Math.min(
        nextStart,
        maxStart,
      );

      const edges = [
        0,
        state.project.duration,
      ];

      for (const other of track.clips) {
        if (other.id === clip.id) {
          continue;
        }

        edges.push(other.start);
        edges.push(
          other.start +
            other.duration,
        );
      }

      for (const edge of edges) {
        if (
          Math.abs(
            nextStart - edge,
          ) < SNAP_DISTANCE
        ) {
          nextStart = edge;
          break;
        }
      }

      nextStart = clamp(
        nextStart,
        0,
        maxStart,
      );

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === trackId
                  ? {
                      ...item,

                      clips:
                        item.clips.map(
                          (current) =>
                            current.id ===
                            clipId
                              ? {
                                  ...current,
                                  start:
                                    nextStart,
                                }
                              : current,
                        ),
                    }
                  : item,
            ),
        },
      }));
    },

    /* ========================================================
       RESIZE CLIP
    ======================================================== */

    resizeClip: (
      clipId,
      trackId,
      side,
      time,
    ) => {
      const state = get();

      const track =
        state.timeline.tracks.find(
          (item) =>
            item.id === trackId,
        );

      if (!track || track.locked) {
        return;
      }

      const clip =
        track.clips.find(
          (item) =>
            item.id === clipId,
        );

      if (!clip) {
        return;
      }

      const safeTime = safeNumber(
        time,
        clip.start,
      );

      if (side === "right") {
        const newEnd = clamp(
          safeTime,
          clip.start +
            MIN_CLIP_DURATION,
          state.project.duration,
        );

        const newDuration =
          newEnd - clip.start;

        if (
          newDuration <
          MIN_CLIP_DURATION
        ) {
          return;
        }

        set((state) => ({
          timeline: {
            ...state.timeline,

            tracks:
              state.timeline.tracks.map(
                (item) =>
                  item.id === trackId
                    ? {
                        ...item,

                        clips:
                          item.clips.map(
                            (current) =>
                              current.id ===
                              clipId
                                ? {
                                    ...current,

                                    duration:
                                      newDuration,

                                    sourceDuration:
                                      Math.min(
                                        current.sourceDuration,
                                        newDuration,
                                      ),
                                  }
                                : current,
                          ),
                      }
                    : item,
              ),
          },
        }));

        return;
      }

      const oldEnd =
        clip.start +
        clip.duration;

      const newStart = clamp(
        safeTime,
        0,
        oldEnd -
          MIN_CLIP_DURATION,
      );

      const newDuration =
        oldEnd - newStart;

      const sourceOffset =
        newStart -
        clip.start;

      const newSourceStart =
        Math.max(
          0,
          clip.sourceStart +
            sourceOffset,
        );

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (item) =>
                item.id === trackId
                  ? {
                      ...item,

                      clips:
                        item.clips.map(
                          (current) =>
                            current.id ===
                            clipId
                              ? {
                                  ...current,

                                  start:
                                    newStart,

                                  duration:
                                    newDuration,

                                  sourceStart:
                                    newSourceStart,

                                  sourceDuration:
                                    newDuration,
                                }
                              : current,
                        ),
                    }
                  : item,
            ),
        },
      }));
    },

    /* ========================================================
       TRACK MUTE
    ======================================================== */

    toggleTrackMute: (trackId) => {
      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (track) =>
                track.id === trackId
                  ? {
                      ...track,
                      muted:
                        !track.muted,
                    }
                  : track,
            ),
        },
      }));
    },

    /* ========================================================
       TRACK LOCK
    ======================================================== */

    toggleTrackLock: (trackId) => {
      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (track) =>
                track.id === trackId
                  ? {
                      ...track,
                      locked:
                        !track.locked,
                    }
                  : track,
            ),
        },
      }));
    },

    /* ========================================================
       TRACK VISIBILITY
    ======================================================== */

    toggleTrackVisibility: (
      trackId,
    ) => {
      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (track) =>
                track.id === trackId
                  ? {
                      ...track,
                      visible:
                        !track.visible,
                    }
                  : track,
            ),
        },
      }));
    },

    /* ========================================================
       RENAME TRACK
    ======================================================== */

    renameTrack: (
      trackId,
      name,
    ) => {
      const cleanName = name.trim();

      if (!cleanName) {
        return;
      }

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (track) =>
                track.id === trackId
                  ? {
                      ...track,
                      name: cleanName,
                    }
                  : track,
            ),
        },
      }));
    },

    /* ========================================================
       ADD TRACK
    ======================================================== */

    addTrack: (
      type,
      name,
    ) => {
      const defaultNames: Record<
        EditorClipType,
        string
      > = {
        video: "Video",
        audio: "Audio",
        caption: "Captions",
        overlay: "Overlay",
      };

      const track = createTrack(
        type,
        name ||
          defaultNames[type],
      );

      pushHistory();

      set((state) => ({
        timeline: {
          ...state.timeline,

          tracks: [
            ...state.timeline.tracks,
            track,
          ],
        },
      }));
    },

    /* ========================================================
       UNDO
    ======================================================== */

    undo: () => {
      const state = get();

      if (!state.history.past.length) {
        return;
      }

      const previous =
        state.history.past[
          state.history.past.length - 1
        ];

      const current = snapshot();

      set({
        timeline: {
          ...state.timeline,

          tracks: clone(
            previous.tracks,
          ),
        },

        selection: clone(
          previous.selection,
        ),

        history: {
          past:
            state.history.past.slice(
              0,
              -1,
            ),

          future: [
            current,
            ...state.history.future,
          ],
        },
      });
    },

    /* ========================================================
       REDO
    ======================================================== */

    redo: () => {
      const state = get();

      if (
        !state.history.future.length
      ) {
        return;
      }

      const next =
        state.history.future[0];

      const current = snapshot();

      set({
        timeline: {
          ...state.timeline,

          tracks: clone(
            next.tracks,
          ),
        },

        selection: clone(
          next.selection,
        ),

        history: {
          past: [
            ...state.history.past,
            current,
          ].slice(-MAX_HISTORY),

          future:
            state.history.future.slice(
              1,
            ),
        },
      });
    },

    /* ========================================================
       RESET
    ======================================================== */

    resetEditor: () => {
      set({
        project: {
          id: null,
          name: "Untitled Project",
          filename: null,
          duration: 0,
        },

        mediaUrl: null,

        playback: {
          currentTime: 0,
          playing: false,
          playbackRate: 1,
        },

        canvas: {
          ...DEFAULT_CANVAS,
        },

        timeline: {
          tracks: [],
          zoom: 1,
          scrollLeft: 0,
        },

        selection: {
          clipId: null,
          trackId: null,
        },

        activeTool: "select",

        history: {
          past: [],
          future: [],
        },
      });
    },
  };
});
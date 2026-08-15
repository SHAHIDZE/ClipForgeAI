import { create } from "zustand";

import type {
  CanvasRatio,
  EditorClip,
  EditorSnapshot,
  EditorState,
  EditorTrack,
} from "./editorTypes";

const DEFAULT_CANVAS = {
  ratio: "9:16" as CanvasRatio,
  width: 1080,
  height: 1920,
};

const clone = <T,>(value: T): T => {
  return structuredClone(value);
};

const safeNumber = (
  value: number,
  fallback = 0,
) => {
  return Number.isFinite(value)
    ? value
    : fallback;
};

function createVideoClip(
  filename: string,
  duration: number,
): EditorClip {
  return {
    id: crypto.randomUUID(),
    name: filename || "Video",
    type: "video",
    start: 0,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    color: "#6366f1",
    volume: 1,
    speed: 1,
  };
}

function createAudioClip(
  duration: number,
): EditorClip {
  return {
    id: crypto.randomUUID(),
    name: "Original Audio",
    type: "audio",
    start: 0,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    color: "#14b8a6",
    volume: 1,
    speed: 1,
  };
}

function createTracks(
  filename: string,
  duration: number,
): EditorTrack[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Video",
      type: "video",
      muted: false,
      locked: false,
      visible: true,
      clips:
        duration > 0
          ? [createVideoClip(filename, duration)]
          : [],
    },

    {
      id: crypto.randomUUID(),
      name: "Audio",
      type: "audio",
      muted: false,
      locked: false,
      visible: true,
      clips:
        duration > 0
          ? [createAudioClip(duration)]
          : [],
    },

    {
      id: crypto.randomUUID(),
      name: "Captions",
      type: "caption",
      muted: false,
      locked: false,
      visible: true,
      clips: [],
    },

    {
      id: crypto.randomUUID(),
      name: "Overlay",
      type: "overlay",
      muted: false,
      locked: false,
      visible: true,
      clips: [],
    },
  ];
}

export const useEditorStore =
  create<EditorState>((set, get) => {
    const snapshot = (): EditorSnapshot => {
      const state = get();

      return {
        tracks: clone(
          state.timeline.tracks,
        ),
        selection: clone(
          state.selection,
        ),
      };
    };

    const pushHistory = () => {
      const current = snapshot();

      set((state) => ({
        history: {
          past: [
            ...state.history.past,
            current,
          ].slice(-100),

          future: [],
        },
      }));
    };

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

      setMedia: (
        url,
        duration,
        filename,
      ) => {
        const safeDuration =
          Number.isFinite(duration) &&
          duration > 0
            ? duration
            : 0;

        const safeFilename =
          filename || "Video";

        const cleanName =
          safeFilename.replace(
            /\.[^/.]+$/,
            "",
          );

        set({
          mediaUrl: url,

          project: {
            id: null,
            name:
              cleanName ||
              "Untitled Project",
            filename:
              filename ?? null,
            duration: safeDuration,
          },

          playback: {
            currentTime: 0,
            playing: false,
            playbackRate: 1,
          },

          timeline: {
            tracks: createTracks(
              safeFilename,
              safeDuration,
            ),
            zoom: 1,
            scrollLeft: 0,
          },

          selection: {
            clipId: null,
            trackId: null,
          },

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

          const clip =
            videoTrack?.clips[0];

          if (
            videoTrack &&
            clip
          ) {
            set({
              selection: {
                clipId: clip.id,
                trackId: videoTrack.id,
              },
            });
          }
        }
      },

      setProjectDuration: (
        duration,
      ) => {
        if (
          !Number.isFinite(duration) ||
          duration <= 0
        ) {
          return;
        }

        set((state) => {
          if (
            Math.abs(
              state.project.duration -
                duration,
            ) < 0.05
          ) {
            return state;
          }

          let tracks =
            state.timeline.tracks;

          const hasVideo =
            tracks.some(
              (track) =>
                track.type === "video" &&
                track.clips.length > 0,
            );

          if (!hasVideo) {
            tracks = createTracks(
              state.project.filename ??
                "Video",
              duration,
            );
          }

          return {
            project: {
              ...state.project,
              duration,
            },

            timeline: {
              ...state.timeline,
              tracks:
                hasVideo
                  ? tracks.map(
                      (track) => {
                        if (
                          track.type !==
                            "video" &&
                          track.type !==
                            "audio"
                        ) {
                          return track;
                        }

                        return {
                          ...track,
                          clips:
                            track.clips.map(
                              (clip) => ({
                                ...clip,
                                duration:
                                  Math.min(
                                    clip.duration,
                                    duration,
                                  ),
                                sourceDuration:
                                  Math.min(
                                    clip.sourceDuration,
                                    duration,
                                  ),
                              }),
                            ),
                        };
                      },
                    )
                  : tracks,
            },
          };
        });
      },

      setCurrentTime: (
        time,
      ) => {
        const state = get();

        const duration =
          state.project.duration;

        set({
          playback: {
            ...state.playback,
            currentTime: Math.max(
              0,
              Math.min(
                safeNumber(time),
                duration,
              ),
            ),
          },
        });
      },

      setPlaying: (
        playing,
      ) => {
        set((state) => ({
          playback: {
            ...state.playback,
            playing,
          },
        }));
      },

      setPlaybackRate: (
        rate,
      ) => {
        set((state) => ({
          playback: {
            ...state.playback,
            playbackRate: Math.max(
              0.25,
              Math.min(
                4,
                safeNumber(rate, 1),
              ),
            ),
          },
        }));
      },

      setZoom: (
        zoom,
      ) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            zoom: Math.max(
              0.25,
              Math.min(
                8,
                safeNumber(zoom, 1),
              ),
            ),
          },
        }));
      },

      setScrollLeft: (
        value,
      ) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            scrollLeft:
              Math.max(
                0,
                safeNumber(value),
              ),
          },
        }));
      },

      setCanvasRatio: (
        ratio,
      ) => {
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

      setActiveTool: (
        activeTool,
      ) => {
        set({
          activeTool,
        });
      },

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

      splitSelectedClip: () => {
        const state = get();

        const {
          clipId,
          trackId,
        } = state.selection;

        if (!clipId) return;

        const track =
          state.timeline.tracks.find(
            (item) =>
              trackId
                ? item.id === trackId
                : item.clips.some(
                    (clip) =>
                      clip.id === clipId,
                  ),
          );

        if (!track) return;

        const clip =
          track.clips.find(
            (item) =>
              item.id === clipId,
          );

        if (!clip) return;

        const localTime =
          state.playback.currentTime -
          clip.start;

        if (
          localTime <= 0.05 ||
          localTime >=
            clip.duration - 0.05
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
          id: crypto.randomUUID(),
          duration:
            firstDuration,
          sourceDuration:
            firstDuration,
        };

        const second: EditorClip = {
          ...clone(clip),
          id: crypto.randomUUID(),
          start:
            clip.start +
            firstDuration,
          duration:
            secondDuration,
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
                            (c) =>
                              c.id !==
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

      deleteSelectedClip: () => {
        const state = get();

        const {
          clipId,
          trackId,
        } = state.selection;

        if (!clipId) return;

        const track =
          state.timeline.tracks.find(
            (item) =>
              item.id === trackId ||
              item.clips.some(
                (clip) =>
                  clip.id === clipId,
              ),
          );

        if (!track) return;

        if (
          !track.clips.some(
            (clip) =>
              clip.id === clipId,
          )
        ) {
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

      duplicateSelectedClip: () => {
        const state = get();

        const {
          clipId,
          trackId,
        } = state.selection;

        if (
          !clipId ||
          !trackId
        ) {
          return;
        }

        const track =
          state.timeline.tracks.find(
            (item) =>
              item.id === trackId,
          );

        if (!track) return;

        const clip =
          track.clips.find(
            (item) =>
              item.id === clipId,
          );

        if (!clip) return;

        pushHistory();

        const maxStart =
          Math.max(
            0,
            state.project.duration -
              clip.duration,
          );

        const duplicate: EditorClip = {
          ...clone(clip),
          id: crypto.randomUUID(),
          start: Math.min(
            clip.start +
              clip.duration +
              0.1,
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
            clipId:
              duplicate.id,
            trackId:
              track.id,
          },
        }));
      },

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

        if (
          !track ||
          track.locked
        ) {
          return;
        }

        const clip =
          track.clips.find(
            (item) =>
              item.id === clipId,
          );

        if (!clip) return;

        let nextStart =
          Math.max(
            0,
            safeNumber(start),
          );

        const maxStart =
          Math.max(
            0,
            state.project.duration -
              clip.duration,
          );

        nextStart =
          Math.min(
            nextStart,
            maxStart,
          );

        const SNAP = 0.12;

        const edges = [
          0,
          state.project.duration,
        ];

        for (
          const other of track.clips
        ) {
          if (
            other.id === clip.id
          ) {
            continue;
          }

          edges.push(
            other.start,
          );

          edges.push(
            other.start +
              other.duration,
          );
        }

        for (
          const edge of edges
        ) {
          if (
            Math.abs(
              nextStart - edge,
            ) < SNAP
          ) {
            nextStart = edge;
            break;
          }
        }

        nextStart =
          Math.min(
            Math.max(
              0,
              nextStart,
            ),
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

        if (
          !track ||
          track.locked
        ) {
          return;
        }

        const clip =
          track.clips.find(
            (item) =>
              item.id === clipId,
          );

        if (!clip) return;

        const MIN = 0.1;

        if (
          side === "right"
        ) {
          const newEnd =
            Math.max(
              clip.start + MIN,
              Math.min(
                state.project.duration,
                safeNumber(time),
              ),
            );

          const newDuration =
            newEnd - clip.start;

          if (
            newDuration < MIN
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
                                        newDuration,
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

        const newStart =
          Math.max(
            0,
            Math.min(
              safeNumber(time),
              oldEnd - MIN,
            ),
          );

        const newDuration =
          oldEnd - newStart;

        const sourceOffset =
          newStart - clip.start;

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
                                      current.sourceStart +
                                      sourceOffset,
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

      toggleTrackMute: (
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
                        muted:
                          !track.muted,
                      }
                    : track,
              ),
          },
        }));
      },

      toggleTrackLock: (
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
                        locked:
                          !track.locked,
                      }
                    : track,
              ),
          },
        }));
      },

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

      undo: () => {
        const state = get();

        if (
          !state.history.past.length
        ) {
          return;
        }

        const previous =
          state.history.past[
            state.history.past.length - 1
          ];

        const current =
          snapshot();

        set({
          timeline: {
            ...state.timeline,
            tracks:
              clone(
                previous.tracks,
              ),
          },

          selection:
            clone(
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

      redo: () => {
        const state = get();

        if (
          !state.history.future.length
        ) {
          return;
        }

        const next =
          state.history.future[0];

        const current =
          snapshot();

        set({
          timeline: {
            ...state.timeline,
            tracks:
              clone(next.tracks),
          },

          selection:
            clone(next.selection),

          history: {
            past: [
              ...state.history.past,
              current,
            ],

            future:
              state.history.future.slice(
                1,
              ),
          },
        });
      },

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

          canvas:
            DEFAULT_CANVAS,

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
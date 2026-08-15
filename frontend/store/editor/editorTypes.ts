// src/store/editor/editorTypes.ts

export type CanvasRatio =
  | "9:16"
  | "16:9"
  | "1:1"
  | "custom";

export type EditorClipType =
  | "video"
  | "audio"
  | "caption"
  | "overlay";

export type EditorTool =
  | "select"
  | "split"
  | "text"
  | "caption"
  | "audio"
  | "element"
  | "ai"
  | "media";

export type ResizeSide =
  | "left"
  | "right";

export type EditorClipStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontWeight?: number | string;
  align?: "left" | "center" | "right";
  positionX?: number;
  positionY?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
};

export type EditorClip = {
  id: string;
  name: string;
  type: EditorClipType;

  start: number;
  duration: number;

  sourceStart: number;
  sourceDuration: number;

  color: string;

  text?: string;

  style?: EditorClipStyle;

  volume?: number;
  speed?: number;
};

export type EditorTrack = {
  id: string;
  name: string;
  type: EditorClipType;

  muted: boolean;
  locked: boolean;
  visible: boolean;

  clips: EditorClip[];
};

export type EditorSelection = {
  clipId: string | null;
  trackId: string | null;
};

export type EditorPlayback = {
  currentTime: number;
  playing: boolean;
  playbackRate: number;
};

export type EditorProject = {
  id: number | null;
  name: string;
  filename: string | null;
  duration: number;
};

export type EditorCanvas = {
  ratio: CanvasRatio;
  width: number;
  height: number;
};

export type EditorTimeline = {
  tracks: EditorTrack[];
  zoom: number;
  scrollLeft: number;
};

export type EditorSnapshot = {
  tracks: EditorTrack[];
  selection: EditorSelection;
};

export type EditorHistory = {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
};

export type EditorState = {
  project: EditorProject;

  mediaUrl: string | null;

  playback: EditorPlayback;

  canvas: EditorCanvas;

  timeline: EditorTimeline;

  selection: EditorSelection;

  activeTool: EditorTool;

  history: EditorHistory;

  setMedia: (
    url: string,
    duration: number,
    filename?: string | null,
  ) => void;

  setProjectDuration: (
    duration: number,
  ) => void;

  setCurrentTime: (
    time: number,
  ) => void;

  setPlaying: (
    playing: boolean,
  ) => void;

  setPlaybackRate: (
    rate: number,
  ) => void;

  setZoom: (
    zoom: number,
  ) => void;

  setScrollLeft: (
    value: number,
  ) => void;

  setCanvasRatio: (
    ratio: CanvasRatio,
  ) => void;

  setActiveTool: (
    tool: EditorTool,
  ) => void;

  updateClip: (
    clipId: string,
    trackId: string,
    updates: Partial<EditorClip>,
  ) => void;

  updateClipStyle: (
    clipId: string,
    trackId: string,
    updates: Partial<EditorClipStyle>,
  ) => void;

  selectClip: (
    clipId: string | null,
    trackId?: string | null,
  ) => void;

  splitSelectedClip: () => void;

  deleteSelectedClip: () => void;

  duplicateSelectedClip: () => void;

  moveClip: (
    clipId: string,
    trackId: string,
    start: number,
  ) => void;

  resizeClip: (
    clipId: string,
    trackId: string,
    side: ResizeSide,
    time: number,
  ) => void;

  toggleTrackMute: (
    trackId: string,
  ) => void;

  toggleTrackLock: (
    trackId: string,
  ) => void;

  toggleTrackVisibility: (
    trackId: string,
  ) => void;

  renameTrack: (
    trackId: string,
    name: string,
  ) => void;

  addTrack: (
    type: EditorClipType,
    name?: string,
  ) => void;

  undo: () => void;

  redo: () => void;

  resetEditor: () => void;
};
export interface ActiveJob {
  id: number;
  status: string;
  step: string;
  progress: number;
  generated: number;
  total: number;
  files: string[];
  start_time: number;
  end_time: number;
  error: string | null;
}

export interface GeneratedVideo {
  id: number;
  filename: string;
  duration: number;
  production_id: number;
  created_at: string | null;
}

export interface Project {
  id: number;
  name: string;
  filename: string;
  status: string;
  duration: number;
  created_at: string | null;
  updated_at: string | null;
  active_job: ActiveJob | null;
  generated_count: number;
  generated_videos: GeneratedVideo[];
}

export interface VideoRange {
  start: number;
  end: number;
}

export type VideoAspectRatio =
  | "9:16"
  | "16:9"
  | "1:1";

export type CaptionStyle =
  | "none"
  | "classic"
  | "bold"
  | "minimal"
  | "karaoke";

export interface EditorSettings {
  range: VideoRange;
  aspectRatio: VideoAspectRatio;
  captionStyle: CaptionStyle;
  removeSilence: boolean;
  autoZoom: boolean;
  enhanceAudio: boolean;
  autoCrop: boolean;
}
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8000";

interface ActiveJob {
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

interface GeneratedVideo {
  id: number;
  filename: string;
  duration: number;
  production_id: number;
  created_at: string | null;
}

interface Project {
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

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectStudio({ params }: Props) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVideo, setSelectedVideo] =
    useState<GeneratedVideo | null>(null);

  // ============================================================
  // EDITOR STATE
  // ============================================================

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // ============================================================
  // GET PROJECT ID
  // ============================================================

  useEffect(() => {
    params.then((value) => {
      setProjectId(value.id);
    });
  }, [params]);

  // ============================================================
  // LOAD PROJECT
  // ============================================================

  const loadProject = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      const token = localStorage.getItem("clipforge_token");

      if (!token) {
        setError("You are not authenticated.");
        return;
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load projects.");
      }

      const data = await response.json();

      const projects: Project[] = Array.isArray(data?.projects)
        ? data.projects
        : [];

      const found = projects.find(
        (item) => String(item.id) === String(projectId)
      );

      if (!found) {
        setError("Project not found.");
        setProject(null);
        return;
      }

      setProject(found);
      setError(null);

      // Initial range
      if (found.duration > 0 && endTime === 0) {
        setEndTime(found.duration);
      }
    } catch (err) {
      console.error("STUDIO LOAD ERROR:", err);

      setError("Failed to load this project.");
    } finally {
      setLoading(false);
    }
  }, [projectId, endTime]);

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    if (!projectId) {
      return;
    }

    loadProject();

    const interval = setInterval(loadProject, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [projectId, loadProject]);

  // ============================================================
  // HELPERS
  // ============================================================

  function formatDuration(seconds: number) {
    const value = Number(seconds) || 0;

    if (value <= 0) {
      return "—";
    }

    const totalSeconds = Math.round(value);

    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  }

  function formatTime(seconds: number) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));

    const minutes = Math.floor(value / 60);
    const secs = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return "—";
    }
  }

  function getStepText(step?: string) {
    switch (step) {
      case "queued":
        return "Queued";

      case "starting":
        return "Starting processing";

      case "analyzing":
        return "Analyzing video";

      case "finding_highlights":
        return "Finding highlights";

      case "generating_shorts":
        return "Generating shorts";

      case "saving_results":
        return "Saving results";

      case "finishing":
        return "Finishing";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "error":
        return "Processing failed";

      default:
        return "AI processing";
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  const status = useMemo(() => {
    if (!project) {
      return "unknown";
    }

    const jobStatus = project.active_job?.status?.toLowerCase();

    if (jobStatus === "queued" || jobStatus === "processing") {
      return "processing";
    }

    return project.status?.toLowerCase() || "uploaded";
  }, [project]);

  const isProcessing = status === "processing";
  const isCompleted = status === "completed";
  const isError = status === "error";

  // ============================================================
  // VIDEO URL
  // ============================================================

  const originalVideoUrl = project
    ? `${API_URL}/uploads/${encodeURIComponent(project.filename)}`
    : "";

  // ============================================================
  // VIDEO LOADED
  // ============================================================

  function handleVideoLoaded() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const duration = video.duration;

    if (Number.isFinite(duration) && duration > 0) {
      if (startTime >= duration) {
        setStartTime(0);
      }

      if (endTime <= 0 || endTime > duration) {
        setEndTime(duration);
      }
    }
  }

  // ============================================================
  // CURRENT TIME
  // ============================================================

  function handleTimeUpdate() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setCurrentTime(video.currentTime);

    // Keep playback inside selected range.
    if (video.currentTime >= endTime && endTime > startTime) {
      video.pause();
      video.currentTime = startTime;
    }
  }

  // ============================================================
  // SET START
  // ============================================================

  function setStartFromCurrent() {
    const value = Math.max(
      0,
      Math.min(currentTime, endTime - 1)
    );

    setStartTime(value);
  }

  // ============================================================
  // SET END
  // ============================================================

  function setEndFromCurrent() {
    const video = videoRef.current;

    const duration =
      video?.duration ||
      project?.duration ||
      0;

    const value = Math.min(
      duration,
      Math.max(currentTime, startTime + 1)
    );

    setEndTime(value);
  }

  // ============================================================
  // RANGE CHANGE
  // ============================================================

  function handleStartChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    setStartTime(
      Math.min(
        value,
        Math.max(startTime, endTime - 1)
      )
    );
  }

  function handleEndChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    setEndTime(
      Math.max(
        value,
        startTime + 1
      )
    );
  }

  // ============================================================
  // PLAY SELECTED RANGE
  // ============================================================

  function playSelectedRange() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = startTime;

    void video.play();
  }

  // ============================================================
  // GENERATE SHORTS
  // ============================================================

  async function generateShorts() {
    if (!project) {
      return;
    }

    const token = localStorage.getItem("clipforge_token");

    if (!token) {
      setGenerateError("You are not authenticated.");
      return;
    }

    const video = videoRef.current;

    const duration =
      video?.duration ||
      project.duration ||
      0;

    const safeStart = Math.max(
      0,
      Math.min(startTime, duration)
    );

    const safeEnd = Math.min(
      duration,
      Math.max(endTime, safeStart + 1)
    );

    if (safeEnd <= safeStart) {
      setGenerateError(
        "Start time must be before end time."
      );
      return;
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      const url =
        `${API_URL}/process/${encodeURIComponent(project.filename)}` +
        `?range_start=${encodeURIComponent(safeStart)}` +
        `&range_end=${encodeURIComponent(safeEnd)}`;

      const response = await fetch(url, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to start AI processing."
        );
      }

      console.log(
        "CLIPFORGE PROCESS STARTED:",
        data
      );

      // Immediately refresh project state.
      await loadProject();
    } catch (err) {
      console.error(
        "GENERATE SHORTS ERROR:",
        err
      );

      setGenerateError(
        err instanceof Error
          ? err.message
          : "Failed to start AI processing."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />

            <p className="mt-4 text-sm text-zinc-500">
              Loading Studio...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111113] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold">
              Project unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {error || "This project could not be found."}
            </p>

            <Link
              href="/projects"
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const generatedVideos = Array.isArray(
    project.generated_videos
  )
    ? project.generated_videos
    : [];

  const job = project.active_job;

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(job?.progress) || 0
    )
  );

  const selectedDuration = Math.max(
    0,
    endTime - startTime
  );

  // ============================================================
  // STUDIO
  // ============================================================

  return (
    <main className="min-h-screen bg-[#09090b] text-white">

      {/* ======================================================
          TOP BAR
      ======================================================= */}

      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-4">

            <Link
              href="/projects"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              ←
            </Link>

            <div>
              <div className="text-xs font-medium text-zinc-500">
                ClipForge AI
              </div>

              <div className="max-w-[220px] truncate text-sm font-semibold">
                {project.name}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                isProcessing
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                  : isCompleted
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : isError
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
              }`}
            >
              {isProcessing
                ? `${Math.round(progress)}% Processing`
                : isCompleted
                ? "Completed"
                : isError
                ? "Error"
                : project.status}
            </span>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ====================================================
            PROJECT HEADER
        ===================================================== */}

        <section className="mb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                ✨ AI Studio
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {project.name}
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {project.filename}
              </p>

            </div>

            <div className="flex gap-3">

              <div className="rounded-2xl border border-zinc-800 bg-[#111113] px-4 py-3">
                <div className="text-xs text-zinc-600">
                  Duration
                </div>

                <div className="mt-1 font-semibold">
                  {formatDuration(project.duration)}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#111113] px-4 py-3">
                <div className="text-xs text-zinc-600">
                  Shorts
                </div>

                <div className="mt-1 font-semibold">
                  {project.generated_count ||
                    generatedVideos.length}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ====================================================
            PROCESSING
        ===================================================== */}

        {isProcessing && job && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-violet-500/20 bg-violet-500/[0.05]">

            <div className="p-6">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400" />

                    <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      AI Processing
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold">
                    Generating your shorts
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {getStepText(job.step)}
                  </p>

                </div>

                <div className="sm:text-right">

                  <div className="text-3xl font-black text-violet-300">
                    {Math.round(progress)}%
                  </div>

                  <div className="text-xs text-zinc-600">
                    {job.generated || 0} / {job.total || 10} shorts
                  </div>

                </div>

              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">

                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

              {job.error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {job.error}
                </div>
              )}

            </div>
          </section>
        )}

        {/* ====================================================
            VIDEO EDITOR
        ===================================================== */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-zinc-800 bg-[#111113]">

          <div className="border-b border-zinc-800/70 px-5 py-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold">
                  Video Editor
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Select the part of the video you want AI to process.
                </p>
              </div>

              <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
                Selected: {formatDuration(selectedDuration)}
              </div>

            </div>

          </div>

          {/* VIDEO */}

          <div className="relative flex aspect-video items-center justify-center bg-black">

            <video
              ref={videoRef}
              src={originalVideoUrl}
              controls
              preload="metadata"
              className="h-full w-full object-contain"
              onLoadedMetadata={handleVideoLoaded}
              onTimeUpdate={handleTimeUpdate}
            />

          </div>

          {/* RANGE */}

          <div className="border-t border-zinc-800/70 p-5">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* START */}

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-xs text-zinc-600">
                      Start
                    </div>

                    <div className="mt-1 text-lg font-bold">
                      {formatTime(startTime)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={setStartFromCurrent}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                  >
                    Use current
                  </button>

                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.max(project.duration, 1)}
                  step={0.1}
                  value={Math.min(startTime, Math.max(project.duration - 1, 0))}
                  onChange={handleStartChange}
                  className="mt-5 w-full accent-violet-500"
                />

              </div>

              {/* END */}

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-xs text-zinc-600">
                      End
                    </div>

                    <div className="mt-1 text-lg font-bold">
                      {formatTime(endTime)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={setEndFromCurrent}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                  >
                    Use current
                  </button>

                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.max(project.duration, 1)}
                  step={0.1}
                  value={Math.min(
                    Math.max(endTime, 1),
                    Math.max(project.duration, 1)
                  )}
                  onChange={handleEndChange}
                  className="mt-5 w-full accent-violet-500"
                />

              </div>

            </div>

            {/* RANGE SUMMARY */}

            <div className="mt-4 rounded-2xl border border-violet-500/10 bg-violet-500/[0.04] p-4">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <div className="text-xs font-medium text-zinc-500">
                    Selected range
                  </div>

                  <div className="mt-1 text-sm font-semibold">
                    {formatTime(startTime)}
                    {" → "}
                    {formatTime(endTime)}
                  </div>

                </div>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={playSelectedRange}
                    disabled={selectedDuration <= 0}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ▶ Preview range
                  </button>

                  <button
                    type="button"
                    onClick={generateShorts}
                    disabled={
                      generating ||
                      isProcessing ||
                      selectedDuration <= 0
                    }
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating
                      ? "Starting..."
                      : isProcessing
                      ? "AI Processing..."
                      : "✨ Generate Shorts"}
                  </button>

                </div>

              </div>

              {generateError && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {generateError}
                </div>
              )}

            </div>

          </div>
        </section>

        {/* ====================================================
            MAIN INFO GRID
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ORIGINAL VIDEO INFO */}

          <section className="lg:col-span-2">

            <div className="rounded-3xl border border-zinc-800 bg-[#111113] p-6">

              <h2 className="font-bold">
                Source Video
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">

                <div>
                  <div className="text-xs text-zinc-600">
                    File
                  </div>

                  <div className="mt-1 truncate text-sm font-medium">
                    {project.filename}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Duration
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDuration(project.duration)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Selected
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDuration(selectedDuration)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Status
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {isCompleted
                      ? "Completed"
                      : isProcessing
                      ? "Processing"
                      : project.status}
                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* PROJECT INFO */}

          <aside>

            <div className="rounded-3xl border border-zinc-800 bg-[#111113] p-5">

              <h2 className="font-bold">
                Project Info
              </h2>

              <div className="mt-5 space-y-4">

                <div>
                  <div className="text-xs text-zinc-600">
                    Status
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {isCompleted
                      ? "Completed"
                      : isProcessing
                      ? "Processing"
                      : project.status}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Original duration
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDuration(project.duration)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Generated shorts
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {generatedVideos.length}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Created
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDate(project.created_at)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-600">
                    Updated
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {formatDate(project.updated_at)}
                  </div>
                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* ====================================================
            GENERATED SHORTS
        ===================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Generated Shorts
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                AI-generated short-form videos from this project.
              </p>
            </div>

            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500">
              {generatedVideos.length} videos
            </span>

          </div>

          {generatedVideos.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#111113] px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                🎬
              </div>

              <h3 className="mt-4 font-semibold">
                No shorts yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                {isProcessing
                  ? "Your AI shorts will appear here when processing is complete."
                  : "Select a range above and generate your first AI shorts."}
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {generatedVideos.map(
                (video, index) => (

                  <article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] transition hover:border-violet-500/30"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedVideo(video)
                      }
                      className="group relative flex aspect-[9/16] w-full items-center justify-center overflow-hidden bg-zinc-950"
                    >

                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-xl shadow-xl transition group-hover:scale-110 group-hover:bg-violet-500">
                        ▶
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-left">

                        <div className="text-xs font-semibold text-white">
                          Short #{index + 1}
                        </div>

                        <div className="mt-1 truncate text-[10px] text-zinc-400">
                          {video.filename}
                        </div>

                      </div>

                    </button>

                    <div className="p-4">

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="truncate text-sm font-semibold">
                            Short #{index + 1}
                          </h3>

                          <p className="mt-1 truncate text-xs text-zinc-600">
                            {video.filename}
                          </p>

                        </div>

                        <span className="shrink-0 rounded-lg bg-zinc-900 px-2 py-1 text-[10px] text-zinc-500">
                          {formatDuration(video.duration)}
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVideo(video)
                        }
                        className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                      >
                        ▶ Preview Short
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

      {/* ======================================================
          VIDEO MODAL
      ======================================================= */}

      {selectedVideo && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedVideo(null)
          }
        >

          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#111113] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">

              <div>

                <div className="text-sm font-semibold">
                  {selectedVideo.filename}
                </div>

                <div className="mt-1 text-[10px] text-zinc-600">
                  Generated Short
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedVideo(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="aspect-[9/16] bg-black">

              <video
                src={`${API_URL}/exports/${encodeURIComponent(
                  selectedVideo.filename
                )}`}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
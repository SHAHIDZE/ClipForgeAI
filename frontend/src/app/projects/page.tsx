"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../services/auth";

// ============================================================
// TYPES
// ============================================================

type GeneratedVideo = {
  id: number;
  filename: string;
  duration: number;
  production_id: number | null;
  created_at: string | null;
};

type ProcessingJob = {
  id: number;
  status: string;
  step: string;
  progress: number;
  generated: number;
  total: number;
  files: string[];
  error: string | null;
  start_time: number;
  end_time: number;
  created_at: string | null;
  updated_at: string | null;
};

type Project = {
  id: number;
  name: string;
  filename: string;
  status: string;
  duration: number;
  created_at: string | null;
  updated_at: string | null;
  active_job: ProcessingJob | null;
  generated_count: number;
  generated_videos: GeneratedVideo[];
};

// ============================================================
// CONSTANTS
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const QUEUED_STATUSES = [
  "queued",
  "waiting",
  "pending",
];

const PROCESSING_STATUSES = [
  "processing",
  "analyzing",
  "generating",
  "generating_shorts",
  "starting",
  "finishing",
];

const COMPLETED_STATUSES = [
  "completed",
  "finished",
  "done",
];

const ERROR_STATUSES = [
  "error",
  "failed",
];

const CANCELLED_STATUSES = [
  "cancelled",
  "canceled",
];

// ============================================================
// HELPERS
// ============================================================

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) {
    return "—";
  }

  const total = Math.round(seconds);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
}

function normalizeStatus(status?: string) {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

function normalizeProgress(progress: number | undefined) {
  const value = Number(progress ?? 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function isQueuedJob(job: ProcessingJob | null) {
  if (!job) {
    return false;
  }

  return QUEUED_STATUSES.includes(
    normalizeStatus(job.status)
  );
}

function isProcessingJob(job: ProcessingJob | null) {
  if (!job) {
    return false;
  }

  return PROCESSING_STATUSES.includes(
    normalizeStatus(job.status)
  );
}

function isCompletedJob(job: ProcessingJob | null) {
  if (!job) {
    return false;
  }

  return COMPLETED_STATUSES.includes(
    normalizeStatus(job.status)
  );
}

function isErrorJob(job: ProcessingJob | null) {
  if (!job) {
    return false;
  }

  return ERROR_STATUSES.includes(
    normalizeStatus(job.status)
  );
}

function isCancelledJob(job: ProcessingJob | null) {
  if (!job) {
    return false;
  }

  return CANCELLED_STATUSES.includes(
    normalizeStatus(job.status)
  );
}

function isActiveJob(job: ProcessingJob | null) {
  return (
    isQueuedJob(job) ||
    isProcessingJob(job)
  );
}

function getStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (COMPLETED_STATUSES.includes(normalized)) {
    return "Completed";
  }

  if (ERROR_STATUSES.includes(normalized)) {
    return "Error";
  }

  if (CANCELLED_STATUSES.includes(normalized)) {
    return "Cancelled";
  }

  if (QUEUED_STATUSES.includes(normalized)) {
    return "Queued";
  }

  if (PROCESSING_STATUSES.includes(normalized)) {
    return "Processing";
  }

  if (normalized === "uploaded") {
    return "Uploaded";
  }

  return status || "Unknown";
}

function getStatusClass(status: string) {
  const normalized = normalizeStatus(status);

  if (COMPLETED_STATUSES.includes(normalized)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (ERROR_STATUSES.includes(normalized)) {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  if (CANCELLED_STATUSES.includes(normalized)) {
    return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }

  if (QUEUED_STATUSES.includes(normalized)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (PROCESSING_STATUSES.includes(normalized)) {
    return "border-violet-500/20 bg-violet-500/10 text-violet-400";
  }

  if (normalized === "uploaded") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  return "border-zinc-800 bg-zinc-900 text-zinc-400";
}

function getStepLabel(step: string, status: string) {
  const normalizedStep = normalizeStatus(step);
  const normalizedStatus = normalizeStatus(status);

  if (
    QUEUED_STATUSES.includes(normalizedStatus)
  ) {
    return "Waiting in queue...";
  }

  switch (normalizedStep) {
    case "queued":
      return "Waiting in queue...";

    case "starting":
      return "Starting AI processing...";

    case "analyzing":
      return "AI is analyzing your video...";

    case "finding_highlights":
      return "Finding the best moments...";

    case "generating_shorts":
      return "Generating shorts...";

    case "finishing":
      return "Finishing your shorts...";

    case "completed":
      return "Processing completed";

    case "cancelled":
      return "Processing cancelled";

    case "error":
      return "Processing failed";

    default:
      return step || "Processing video...";
  }
}

function getVideoUrl(filename: string) {
  return `${API_BASE_URL}/download/${encodeURIComponent(
    filename
  )}`;
}

// ============================================================
// PAGE
// ============================================================

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD PROJECTS
  // ==========================================================

  const loadProjects = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const data = await authFetch("/projects");

        console.log(
          "PROJECTS RESPONSE:",
          data
        );

        const nextProjects = Array.isArray(
          data?.projects
        )
          ? data.projects
          : [];

        setProjects(nextProjects);
      } catch (err) {
        console.error(
          "Projects error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Projectsni yuklashda xatolik yuz berdi."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD + AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    loadProjects(true);

    const interval =
      window.setInterval(() => {
        loadProjects(false);
      }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadProjects]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                📁
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                ClipForge AI
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Projects
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your videos and generated AI shorts.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadProjects(false)
            }
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            >
              ↻
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0f] p-12 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-2xl">
              ⚡
            </div>

            <h2 className="mt-5 text-lg font-black text-white">
              Loading projects...
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Please wait while we load your projects.
            </p>

            <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-500" />
            </div>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    ⚠️
                  </span>

                  <h2 className="font-black text-red-400">
                    Something went wrong
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadProjects(true)
                }
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-zinc-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0f] p-12 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-3xl">
                📁
              </div>

              <h2 className="mt-6 text-xl font-black text-white">
                No projects yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Upload a video and generate your first AI shorts to see your project here.
              </p>
            </div>
          )}

        {/* PROJECT LIST */}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <div className="space-y-6">

              {projects.map(
                (project) => {
                  const job =
                    project.active_job;

                  const queued =
                    isQueuedJob(job);

                  const processing =
                    isProcessingJob(job);

                  const active =
                    isActiveJob(job);

                  const progress =
                    normalizeProgress(
                      job?.progress
                    );

                  const generatedCount =
                    project.generated_count ??
                    project.generated_videos
                      ?.length ??
                    0;

                  return (
                    <section
                      key={project.id}
                      className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] shadow-2xl shadow-black/20"
                    >

                      {/* PROJECT HEADER */}

                      <div className="border-b border-zinc-800 p-5 sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">

                              <h2 className="truncate text-xl font-black text-white">
                                {project.name}
                              </h2>

                              <span
                                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(
                                  project.status
                                )}`}
                              >
                                {getStatusLabel(
                                  project.status
                                )}
                              </span>
                            </div>

                            <p className="mt-2 break-all text-sm text-zinc-500">
                              {project.filename}
                            </p>

                            {project.created_at && (
                              <p className="mt-2 text-xs text-zinc-700">
                                Created{" "}
                                {formatDate(
                                  project.created_at
                                )}
                              </p>
                            )}
                          </div>

                          {/* STATS */}

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                            <div className="min-w-[100px] rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                Duration
                              </p>

                              <p className="mt-1 text-sm font-black text-white">
                                {formatDuration(
                                  project.duration
                                )}
                              </p>
                            </div>

                            <div className="min-w-[100px] rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                Shorts
                              </p>

                              <p className="mt-1 text-sm font-black text-violet-400">
                                {generatedCount}
                              </p>
                            </div>

                            <div className="col-span-2 min-w-[100px] rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 sm:col-span-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                Project ID
                              </p>

                              <p className="mt-1 text-sm font-black text-zinc-300">
                                #{project.id}
                              </p>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* ==================================================
                          QUEUED
                      ================================================== */}

                      {queued && (
                        <div className="border-b border-zinc-800 p-5 sm:p-6">
                          <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.04]">

                            <div className="p-5">

                              <div className="flex items-start justify-between gap-4">

                                <div className="flex min-w-0 items-start gap-3">

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                                    ⏳
                                  </div>

                                  <div className="min-w-0">

                                    <h3 className="font-black text-white">
                                      Waiting in queue
                                    </h3>

                                    <p className="mt-1 text-sm text-zinc-500">
                                      Your video is waiting for the AI worker.
                                    </p>

                                  </div>
                                </div>

                                <div className="shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">

                                  <p className="text-lg font-black text-amber-400">
                                    0%
                                  </p>

                                </div>

                              </div>

                              {/* QUEUE BAR */}

                              <div className="mt-6">

                                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

                                  <div
                                    className="h-full w-[4%] animate-pulse rounded-full bg-amber-500"
                                  />

                                </div>

                              </div>

                              <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">

                                <span className="font-semibold text-amber-400">
                                  Waiting for previous job to finish...
                                </span>

                                <span className="font-semibold text-zinc-400">
                                  {job?.generated ?? 0} / {job?.total ?? 10} shorts
                                </span>

                              </div>

                            </div>

                            <div className="border-t border-amber-500/10 bg-amber-500/[0.02] px-5 py-3">

                              <p className="text-center text-xs text-zinc-600">
                                You can leave this page — your job will start automatically.
                              </p>

                            </div>

                          </div>
                        </div>
                      )}

                      {/* ==================================================
                          PROCESSING
                      ================================================== */}

                      {processing && (
                        <div className="border-b border-zinc-800 p-5 sm:p-6">

                          <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/[0.04]">

                            <div className="p-5">

                              <div className="flex items-start justify-between gap-4">

                                <div className="flex min-w-0 items-start gap-3">

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                                    ⚡
                                  </div>

                                  <div className="min-w-0">

                                    <h3 className="font-black text-white">
                                      AI video generation in progress
                                    </h3>

                                    <p className="mt-1 text-sm text-zinc-500">
                                      {getStepLabel(
                                        job?.step ?? "",
                                        job?.status ?? ""
                                      )}
                                    </p>

                                  </div>

                                </div>

                                <div className="shrink-0 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-center">

                                  <p className="text-lg font-black text-violet-400">
                                    {Math.round(
                                      progress
                                    )}
                                    %
                                  </p>

                                </div>

                              </div>

                              {/* PROGRESS BAR */}

                              <div className="mt-6">

                                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 transition-all duration-700"
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />

                                </div>

                              </div>

                              {/* INFO */}

                              <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">

                                <span className="text-zinc-500">
                                  {getStepLabel(
                                    job?.step ?? "",
                                    job?.status ?? ""
                                  )}
                                </span>

                                <span className="font-semibold text-zinc-400">
                                  {job?.generated ?? 0} /{" "}
                                  {job?.total ?? 10} shorts
                                </span>

                              </div>

                            </div>

                            <div className="border-t border-violet-500/10 bg-violet-500/[0.02] px-5 py-3">

                              <p className="text-center text-xs text-zinc-600">
                                You can leave this page — processing continues in the background.
                              </p>

                            </div>

                          </div>
                        </div>
                      )}

                      {/* ==================================================
                          ERROR
                      ================================================== */}

                      {isErrorJob(job) && (
                        <div className="border-b border-zinc-800 p-5 sm:p-6">

                          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">

                            <div className="flex items-start gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                                ❌
                              </div>

                              <div>

                                <h3 className="font-black text-red-400">
                                  Processing failed
                                </h3>

                                <p className="mt-1 text-sm text-zinc-500">
                                  {job?.error ||
                                    "Video processing failed."}
                                </p>

                              </div>

                            </div>

                          </div>
                        </div>
                      )}

                      {/* ==================================================
                          CANCELLED
                      ================================================== */}

                      {isCancelledJob(job) && (
                        <div className="border-b border-zinc-800 p-5 sm:p-6">

                          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">

                            <div className="flex items-start gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                                ⏹
                              </div>

                              <div>

                                <h3 className="font-black text-orange-400">
                                  Processing cancelled
                                </h3>

                                <p className="mt-1 text-sm text-zinc-500">
                                  This video processing job was cancelled.
                                </p>

                              </div>

                            </div>

                          </div>
                        </div>
                      )}

                      {/* ==================================================
                          GENERATED SHORTS
                      ================================================== */}

                      <div className="p-5 sm:p-6">

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <div className="flex items-center gap-3">

                              <h3 className="text-lg font-black text-white">
                                Generated Shorts
                              </h3>

                              <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400">
                                {generatedCount}
                              </span>

                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                              AI-generated short videos from this project.
                            </p>

                          </div>

                          {active && (
                            <div className="flex items-center gap-2 text-xs font-semibold">

                              <span
                                className={`h-2 w-2 animate-pulse rounded-full ${
                                  queued
                                    ? "bg-amber-400"
                                    : "bg-violet-400"
                                }`}
                              />

                              <span
                                className={
                                  queued
                                    ? "text-amber-400"
                                    : "text-violet-400"
                                }
                              >
                                {queued
                                  ? "Queued"
                                  : "Processing"}
                              </span>

                            </div>
                          )}

                        </div>

                        {/* VIDEOS */}

                        {project.generated_videos &&
                        project.generated_videos.length > 0 ? (

                          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                            {project.generated_videos.map(
                              (video, index) => {

                                const videoUrl =
                                  getVideoUrl(
                                    video.filename
                                  );

                                return (
                                  <div
                                    key={
                                      video.id ??
                                      `${video.filename}-${index}`
                                    }
                                    className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-zinc-900/70"
                                  >

                                    {/* VIDEO */}

                                    <div className="relative aspect-[9/16] overflow-hidden bg-black">

                                      <video
                                        controls
                                        preload="metadata"
                                        playsInline
                                        className="h-full w-full object-contain"
                                        src={videoUrl}
                                      />

                                      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                                        SHORT{" "}
                                        {index + 1}
                                      </div>

                                    </div>

                                    {/* VIDEO INFO */}

                                    <div className="p-4">

                                      <div className="flex items-start justify-between gap-3">

                                        <div className="min-w-0">

                                          <p className="text-sm font-black text-white">
                                            Short{" "}
                                            {index + 1}
                                          </p>

                                          <p className="mt-1 truncate text-xs text-zinc-500">
                                            {video.filename}
                                          </p>

                                        </div>

                                        {video.duration >
                                          0 && (
                                            <span className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400">
                                              {formatDuration(
                                                video.duration
                                              )}
                                            </span>
                                          )}

                                      </div>

                                      {/* DOWNLOAD */}

                                      <a
                                        href={videoUrl}
                                        download={
                                          video.filename
                                        }
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-black text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                                      >
                                        <span>
                                          ↓
                                        </span>

                                        Download
                                      </a>

                                    </div>
                                  </div>
                                );
                              }
                            )}

                          </div>

                        ) : (

                          /* NO SHORTS */

                          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-10 text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-2xl">
                              🎬
                            </div>

                            {queued ? (
                              <>
                                <h4 className="mt-4 font-black text-white">
                                  Waiting in queue...
                                </h4>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                  This job will automatically start when the previous video finishes.
                                </p>
                              </>
                            ) : processing ? (
                              <>
                                <h4 className="mt-4 font-black text-white">
                                  Generating shorts...
                                </h4>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                  Your shorts will appear here automatically when AI finishes processing.
                                </p>
                              </>
                            ) : (
                              <>
                                <h4 className="mt-4 font-black text-white">
                                  No shorts yet
                                </h4>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                  No shorts have been created for this project yet.
                                </p>
                              </>
                            )}

                          </div>
                        )}

                      </div>
                    </section>
                  );
                }
              )}

            </div>
          )}
      </div>
    </main>
  );
}
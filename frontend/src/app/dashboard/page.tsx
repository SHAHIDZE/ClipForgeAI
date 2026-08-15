"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../../components/Navbar";
import UploadBox from "../../components/UploadBox";
import StatCard from "../../components/StatCard";
import AuthGuard from "../../components/AuthGuard";

const API_URL = "http://127.0.0.1:8000";

// ============================================================
// TYPES
// ============================================================

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  plan: string;
  ai_credits: number;
  credits_reset_at: string | null;
  role: string;
  is_active: boolean;
}

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

// ============================================================
// HOME CONTENT
// ============================================================

function HomeContent() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // ============================================================
  // LOAD CURRENT USER
  // ============================================================

  const loadCurrentUser = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("clipforge_token");

      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(
        `${API_URL}/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        console.warn(
          "Session expired while loading user."
        );

        setUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Current user loading failed."
        );
      }

      const data: CurrentUser =
        await response.json();

      setUser(data);

    } catch (error) {
      console.error(
        "LOAD CURRENT USER ERROR:",
        error
      );
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("clipforge_token");

      if (!token) {
        setProjects([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        console.warn(
          "Session expired while loading projects."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Projects loading failed."
        );
      }

      const data =
        await response.json();

      const loadedProjects =
        Array.isArray(data?.projects)
          ? data.projects
          : [];

      setProjects(loadedProjects);
      setLastUpdated(new Date());

    } catch (error) {
      console.error(
        "LOAD PROJECTS ERROR:",
        error
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadCurrentUser();
    loadProjects();

    const interval =
      setInterval(() => {
        loadCurrentUser();
        loadProjects();
      }, 3000);

    return () =>
      clearInterval(interval);

  }, [
    loadCurrentUser,
    loadProjects,
  ]);

  // ============================================================
  // ACTIVE PROJECTS
  // ============================================================

  const activeProjects =
    useMemo(() => {
      return projects.filter(
        (project) => {
          const status =
            project.active_job?.status
              ?.toLowerCase();

          return (
            status === "queued" ||
            status === "processing"
          );
        }
      );
    }, [projects]);

  // ============================================================
  // STATS
  // ============================================================

  const projectCount =
    projects.length;

  const videoCount =
    projects.reduce(
      (total, project) =>
        total +
        Number(
          project.generated_count || 0
        ),
      0
    );

  const totalMinutes =
    projects.reduce(
      (total, project) => {
        const duration =
          Number(project.duration) || 0;

        return (
          total +
          duration / 60
        );
      },
      0
    );

  const completedProjects =
    projects.filter(
      (project) =>
        project.status
          ?.toLowerCase() ===
        "completed"
    ).length;

  // ============================================================
  // HELPERS
  // ============================================================

  function getStepText(
    step?: string
  ) {
    switch (step) {
      case "queued":
        return "Queued";

      case "starting":
        return "Starting processing";

      case "analyzing":
        return "Analyzing video";

      case "finding_highlights":
        return "Finding the best moments";

      case "generating_shorts":
        return "Generating shorts";

      case "saving_results":
        return "Saving results";

      case "finishing":
        return "Finishing";

      case "completed":
        return "Processing completed successfully";

      case "cancelled":
        return "Processing cancelled";

      case "error":
        return "Processing failed";

      default:
        return "AI video processing";
    }
  }

  function formatDuration(
    seconds: number
  ) {
    const value =
      Number(seconds) || 0;

    if (value <= 0) {
      return "—";
    }

    const totalSeconds =
      Math.round(value);

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const secs =
      totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString();
    } catch {
      return "";
    }
  }

  function getProjectStatus(
    project: Project
  ) {
    const job =
      project.active_job;

    if (
      job &&
      [
        "queued",
        "processing",
      ].includes(
        job.status?.toLowerCase()
      )
    ) {
      return "processing";
    }

    return (
      project.status
        ?.toLowerCase() ||
      "uploaded"
    );
  }

  function formatPlan(
    plan?: string
  ) {
    if (!plan) {
      return "Free";
    }

    return (
      plan.charAt(0).toUpperCase() +
      plan.slice(1).toLowerCase()
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ======================================================
            HERO
        ======================================================= */}

        <section className="mb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">

                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

                AI Video Studio

              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Welcome to ClipForge AI
              </h1>

              <p className="mt-2 max-w-2xl text-zinc-400">
                Turn long videos into engaging
                short-form content with AI.
              </p>

            </div>

            {lastUpdated && (
              <div className="text-xs text-zinc-600">
                Updated{" "}
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}

          </div>

        </section>

        {/* ======================================================
            ACCOUNT OVERVIEW
        ======================================================= */}

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* PLAN */}

          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#111113] p-5 shadow-xl shadow-black/10">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Plan
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <h2 className="text-2xl font-black text-white">
                    {loadingUser
                      ? "..."
                      : formatPlan(
                          user?.plan
                        )}
                  </h2>

                  {!loadingUser &&
                    user?.plan && (
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        Active
                      </span>
                    )}

                </div>

                <p className="mt-1 text-sm text-zinc-600">
                  Current subscription plan
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
                ✦
              </div>

            </div>

          </div>

          {/* AI CREDITS */}

          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#111113] p-5 shadow-xl shadow-black/10">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  AI Credits
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <h2 className="text-2xl font-black text-white">
                    {loadingUser
                      ? "..."
                      : String(
                          user?.ai_credits ??
                            0
                        )}
                  </h2>

                  <span className="text-sm text-zinc-500">
                    credits
                  </span>

                </div>

                <p className="mt-1 text-sm text-zinc-600">
                  Available for AI processing
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
                ⚡
              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            ACTIVE PROCESSING
        ======================================================= */}

        {activeProjects.length > 0 && (
          <section className="mb-10 space-y-4">

            {activeProjects.map(
              (project) => {

                const job =
                  project.active_job!;

                const progress =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        job.progress
                      ) || 0
                    )
                  );

                return (
                  <div
                    key={job.id}
                    className="overflow-hidden rounded-3xl border border-violet-500/20 bg-violet-500/[0.06]"
                  >

                    <div className="p-5 md:p-6">

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400" />

                            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                              AI Processing
                            </span>

                          </div>

                          <h2 className="mt-2 text-xl font-bold text-white">
                            AI video generation in progress
                          </h2>

                          <p className="mt-1 truncate text-sm text-zinc-400">
                            {project.name}
                          </p>

                        </div>

                        <div className="sm:text-right">

                          <div className="text-3xl font-black text-violet-300">
                            {Math.round(
                              progress
                            )}
                            %
                          </div>

                          <p className="text-xs text-zinc-500">
                            {job.generated ||
                              0}{" "}
                            /{" "}
                            {job.total ||
                              10}{" "}
                            shorts
                          </p>

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

                      <div className="mt-4 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">

                        <span className="text-zinc-300">
                          {getStepText(
                            job.step
                          )}
                        </span>

                        <span className="text-zinc-500">
                          Processing continues in the background.
                        </span>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </section>
        )}

        {/* ======================================================
            PROJECT STATS
        ======================================================= */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Projects"
            value={
              loadingProjects
                ? "..."
                : String(
                    projectCount
                  )
            }
          />

          <StatCard
            title="Videos"
            value={
              loadingProjects
                ? "..."
                : String(
                    videoCount
                  )
            }
          />

          <StatCard
            title="Minutes"
            value={
              loadingProjects
                ? "..."
                : totalMinutes.toFixed(
                    1
                  )
            }
          />

          <StatCard
            title="Completed"
            value={
              loadingProjects
                ? "..."
                : String(
                    completedProjects
                  )
            }
          />

        </section>

        {/* ======================================================
            GENERATE SHORTS
        ======================================================= */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#111113] shadow-2xl shadow-black/20">

          <div className="border-b border-zinc-800/70 px-5 py-6 md:px-8">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold tracking-tight">
                  Generate Shorts
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Upload a video or import one
                  from YouTube.
                </p>

              </div>

              <div className="hidden rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-400 sm:block">
                ✨ AI Powered
              </div>

            </div>

          </div>

          <div className="p-5 md:p-8">
            <UploadBox />
          </div>

        </section>

        {/* ======================================================
            PROJECTS
        ======================================================= */}

        <section className="mt-12 pb-12">

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h2 className="text-xl font-bold tracking-tight">
                Your Projects
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Your uploaded videos and
                generated shorts.
              </p>

            </div>

            {!loadingProjects && (
              <span className="text-xs text-zinc-600">
                {projects.length} projects
              </span>
            )}

          </div>

          {/* LOADING */}

          {loadingProjects ? (

            <div className="rounded-3xl border border-zinc-800 bg-[#0f0f11] px-6 py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading projects...
              </p>

            </div>

          ) : projects.length ===
            0 ? (

            <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#0f0f11] px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                📁
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No projects yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Upload a video to create
                your first ClipForge AI
                project.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

              {projects.map(
                (project) => {

                  const job =
                    project.active_job;

                  const projectStatus =
                    getProjectStatus(
                      project
                    );

                  const isProcessing =
                    projectStatus ===
                    "processing";

                  const isCompleted =
                    projectStatus ===
                    "completed";

                  const isError =
                    projectStatus ===
                    "error";

                  const generatedVideos =
                    Array.isArray(
                      project.generated_videos
                    )
                      ? project.generated_videos
                      : [];

                  return (
                    <article
                      key={
                        project.id
                      }
                      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] transition hover:border-zinc-700"
                    >

                      {/* HEADER */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h3 className="truncate font-semibold text-white">
                              {
                                project.name
                              }
                            </h3>

                            <p className="mt-1 truncate text-xs text-zinc-500">
                              {
                                project.filename
                              }
                            </p>

                          </div>

                          <span
                            className={`
                              shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium
                              ${
                                isProcessing
                                  ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                  : isCompleted
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : isError
                                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
                              }
                            `}
                          >
                            {isProcessing
                              ? `${Math.round(
                                  Number(
                                    job?.progress
                                  ) || 0
                                )}%`
                              : isCompleted
                              ? "Completed"
                              : isError
                              ? "Error"
                              : project.status}
                          </span>

                        </div>

                        {/* PROCESSING */}

                        {isProcessing &&
                          job && (
                            <div className="mt-5">

                              <div className="flex justify-between text-xs">

                                <span className="text-zinc-400">
                                  {getStepText(
                                    job.step
                                  )}
                                </span>

                                <span className="text-zinc-600">
                                  {job.generated ||
                                    0}{" "}
                                  /{" "}
                                  {job.total ||
                                    10}
                                </span>

                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">

                                <div
                                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        Number(
                                          job.progress
                                        ) || 0
                                      )
                                    )}%`,
                                  }}
                                />

                              </div>

                            </div>
                          )}

                        {/* COMPLETED */}

                        {isCompleted && (
                          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] px-3 py-2.5 text-xs text-emerald-300">

                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                              ✓
                            </span>

                            Processing completed successfully

                          </div>
                        )}

                        {/* ERROR */}

                        {isError && (
                          <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/[0.05] px-3 py-2.5 text-xs text-red-300">

                            Processing failed.
                            {job?.error
                              ? ` ${job.error}`
                              : ""}

                          </div>
                        )}

                        {/* META */}

                        <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">

                          <span>
                            {formatDuration(
                              project.duration
                            )}
                          </span>

                          <span>
                            {formatDate(
                              project.created_at
                            )}
                          </span>

                        </div>

                      </div>

                      {/* GENERATED SHORTS */}

                      {generatedVideos.length >
                        0 && (
                        <div className="border-t border-zinc-800/70 bg-zinc-950/30 px-5 py-4">

                          <div className="mb-3 flex items-center justify-between">

                            <div className="flex items-center gap-2">

                              <span className="text-sm">
                                🎬
                              </span>

                              <span className="text-xs font-semibold text-zinc-300">
                                Generated shorts
                              </span>

                            </div>

                            <span className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-500">
                              {
                                generatedVideos.length
                              }
                            </span>

                          </div>

                          <div className="space-y-2">

                            {generatedVideos.map(
                              (video) => (
                                <div
                                  key={
                                    video.id
                                  }
                                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
                                >

                                  <div className="flex min-w-0 items-center gap-2">

                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs">
                                      ▶
                                    </span>

                                    <span className="truncate text-xs text-zinc-400">
                                      {
                                        video.filename
                                      }
                                    </span>

                                  </div>

                                  <span className="shrink-0 text-[10px] text-zinc-600">
                                    {formatDuration(
                                      video.duration
                                    )}
                                  </span>

                                </div>
                              )
                            )}

                          </div>

                        </div>
                      )}

                      {/* NO SHORTS */}

                      {!isProcessing &&
                        generatedVideos.length ===
                          0 &&
                        project.generated_count ===
                          0 && (
                          <div className="border-t border-zinc-800/70 px-5 py-4 text-xs text-zinc-600">
                            No generated shorts yet.
                          </div>
                        )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>
    </>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
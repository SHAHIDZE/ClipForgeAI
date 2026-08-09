"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Loading from "./Loading";
import VideoCard from "./VideoCard";
import UploadArea from "./UploadArea";

import {
  uploadVideo,
  startProcessing,
  getProcessingStatus,
  downloadVideoFromUrl,
  analyzeVideo,
} from "../services/video";

// ============================================================
// TYPES
// ============================================================

type RangeProps = {
  duration: number;
  startTime: number;
  endTime: number;
  onChange: (start: number, end: number) => void;
};

// ============================================================
// TIME FORMAT
// ============================================================

function formatTime(seconds: number) {
  const total = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    total / 3600
  );

  const minutes = Math.floor(
    (total % 3600) / 60
  );

  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

// ============================================================
// CLIP RANGE
// ============================================================

function ClipRange({
  duration,
  startTime,
  endTime,
  onChange,
}: RangeProps) {
  const trackRef =
    useRef<HTMLDivElement | null>(null);

  const maxRange = Math.min(
    duration,
    3600
  );

  const selectedDuration = Math.max(
    0,
    endTime - startTime
  );

  const startPercent =
    duration > 0
      ? (startTime / duration) * 100
      : 0;

  const endPercent =
    duration > 0
      ? (endTime / duration) * 100
      : 0;

  // ----------------------------------------------------------
  // POINTER → TIME
  // ----------------------------------------------------------

  function getValueFromPointer(
    clientX: number
  ) {
    const track =
      trackRef.current;

    if (
      !track ||
      duration <= 0
    ) {
      return 0;
    }

    const rect =
      track.getBoundingClientRect();

    if (rect.width <= 0) {
      return 0;
    }

    let percent =
      (clientX - rect.left) /
      rect.width;

    percent = Math.max(
      0,
      Math.min(1, percent)
    );

    return Math.round(
      percent * duration
    );
  }

  // ----------------------------------------------------------
  // UPDATE HANDLE
  // ----------------------------------------------------------

  function updateFromPointer(
    clientX: number,
    type: "start" | "end"
  ) {
    const value =
      getValueFromPointer(clientX);

    if (type === "start") {
      const maxStart =
        endTime - 1;

      const newStart =
        Math.max(
          0,
          Math.min(
            value,
            maxStart
          )
        );

      onChange(
        newStart,
        endTime
      );

      return;
    }

    const minEnd =
      startTime + 1;

    const maxEnd =
      Math.min(
        duration,
        startTime + maxRange
      );

    const newEnd =
      Math.max(
        minEnd,
        Math.min(
          value,
          maxEnd
        )
      );

    onChange(
      startTime,
      newEnd
    );
  }

  // ----------------------------------------------------------
  // DRAG
  // ----------------------------------------------------------

  function startDrag(
    type: "start" | "end"
  ) {
    function handleMove(
      event: PointerEvent
    ) {
      updateFromPointer(
        event.clientX,
        type
      );
    }

    function handleUp() {
      window.removeEventListener(
        "pointermove",
        handleMove
      );

      window.removeEventListener(
        "pointerup",
        handleUp
      );
    }

    window.addEventListener(
      "pointermove",
      handleMove
    );

    window.addEventListener(
      "pointerup",
      handleUp
    );
  }

  // ----------------------------------------------------------
  // TRACK CLICK
  // ----------------------------------------------------------

  function handleTrackPointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const value =
      getValueFromPointer(
        event.clientX
      );

    const distanceToStart =
      Math.abs(
        value - startTime
      );

    const distanceToEnd =
      Math.abs(
        value - endTime
      );

    const nearest =
      distanceToStart <=
      distanceToEnd
        ? "start"
        : "end";

    updateFromPointer(
      event.clientX,
      nearest
    );
  }

  return (
    <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15 text-lg">
              ✂️
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                Select Clip Range
              </h3>

              <p className="text-sm text-zinc-500">
                Choose the part AI should process
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Selected
          </span>

          <p className="mt-0.5 text-sm font-black text-violet-400">
            {formatTime(
              selectedDuration
            )}
          </p>
        </div>
      </div>

      {/* SLIDER */}

      <div className="mt-8">
        <div
          ref={trackRef}
          onPointerDown={
            handleTrackPointerDown
          }
          className="relative h-12 w-full cursor-pointer touch-none"
        >
          {/* BACKGROUND */}

          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-800" />

          {/* SELECTED */}

          <div
            className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-900/30"
            style={{
              left: `${startPercent}%`,
              right: `${100 - endPercent}%`,
            }}
          />

          {/* START HANDLE */}

          <button
            type="button"
            aria-label="Start time"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              startDrag("start");
            }}
            className="absolute top-1/2 z-30 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-4 border-violet-400 bg-white shadow-xl shadow-violet-950/50 transition-transform hover:scale-110 active:cursor-grabbing active:scale-125"
            style={{
              left: `${startPercent}%`,
            }}
          />

          {/* END HANDLE */}

          <button
            type="button"
            aria-label="End time"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              startDrag("end");
            }}
            className="absolute top-1/2 z-40 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-4 border-fuchsia-400 bg-white shadow-xl shadow-fuchsia-950/50 transition-transform hover:scale-110 active:cursor-grabbing active:scale-125"
            style={{
              left: `${endPercent}%`,
            }}
          />
        </div>
      </div>

      {/* TIME */}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            Start
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatTime(startTime)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            End
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatTime(endTime)}
          </p>
        </div>
      </div>

      {/* INFO */}

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
        <span>0:00</span>

        <span>
          Video: {formatTime(duration)}
        </span>

        <span>
          Max: {formatTime(maxRange)}
        </span>
      </div>

      {/* HELP */}

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-xs text-zinc-500">
        Drag the{" "}
        <span className="font-bold text-violet-400">
          left handle
        </span>{" "}
        to set start and the{" "}
        <span className="font-bold text-fuchsia-400">
          right handle
        </span>{" "}
        to set end.
      </div>
    </div>
  );
}

// ============================================================
// MAIN UPLOAD BOX
// ============================================================

export default function UploadBox() {
  // ==========================================================
  // VIDEO
  // ==========================================================

  const [
    videos,
    setVideos,
  ] = useState<string[]>([]);

  const [
    file,
    setFile,
  ] = useState<File | null>(null);

  const [
    filename,
    setFilename,
  ] = useState<string | null>(null);

  // ==========================================================
  // RANGE
  // ==========================================================

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
    startTime,
    setStartTime,
  ] = useState(0);

  const [
    endTime,
    setEndTime,
  ] = useState(0);

  // ==========================================================
  // PROCESSING
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(
    "Waiting..."
  );

  const [
    progress,
    setProgress,
  ] = useState(0);

  const progressRef =
    useRef(0);

  const animationRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  // ==========================================================
  // STOP PROGRESS
  // ==========================================================

  function stopProgressAnimation() {
    if (
      animationRef.current
    ) {
      clearInterval(
        animationRef.current
      );

      animationRef.current =
        null;
    }
  }

  // ==========================================================
  // START FAKE PROGRESS
  // ==========================================================

  function startProgressAnimation() {
    stopProgressAnimation();

    animationRef.current =
      setInterval(() => {
        setProgress(
          (current) => {
            if (
              current >= 88
            ) {
              return current;
            }

            let increase =
              0.4;

            if (
              current < 50
            ) {
              increase = 0.8;
            } else if (
              current < 65
            ) {
              increase = 0.5;
            } else if (
              current < 80
            ) {
              increase = 0.25;
            } else {
              increase = 0.1;
            }

            const next =
              Math.min(
                88,
                current +
                  increase
              );

            progressRef.current =
              next;

            return next;
          }
        );
      }, 1000);
  }

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      stopProgressAnimation();
    };
  }, []);

  // ==========================================================
  // RESET
  // ==========================================================

  function resetProject() {
    stopProgressAnimation();

    setFile(null);
    setFilename(null);
    setVideos([]);

    setDuration(0);
    setStartTime(0);
    setEndTime(0);

    setProgress(0);
    progressRef.current = 0;

    setStatus(
      "Waiting..."
    );

    setLoading(false);
  }

  // ==========================================================
  // ANALYZE RESULT
  // ==========================================================

  function applyVideoInfo(
    info: any
  ) {
    const videoDuration =
      Number(
        info?.duration
      );

    if (
      !Number.isFinite(
        videoDuration
      ) ||
      videoDuration <= 0
    ) {
      throw new Error(
        "Video davomiyligini aniqlab bo'lmadi."
      );
    }

    setDuration(
      videoDuration
    );

    setStartTime(0);

    setEndTime(
      Math.min(
        videoDuration,
        3600
      )
    );
  }

  // ==========================================================
  // FILE SELECT
  // ==========================================================

  async function handleFileSelect(
    selectedFile: File
  ) {
    stopProgressAnimation();

    setFile(
      selectedFile
    );

    setFilename(null);
    setVideos([]);

    setDuration(0);
    setStartTime(0);
    setEndTime(0);

    setLoading(true);

    setStatus(
      "Uploading video..."
    );

    setProgress(5);
    progressRef.current = 5;

    try {
      // UPLOAD

      const uploaded =
        await uploadVideo(
          selectedFile
        );

      if (
        !uploaded?.filename
      ) {
        throw new Error(
          "Backend filename qaytarmadi."
        );
      }

      const uploadedFilename =
        uploaded.filename;

      setFilename(
        uploadedFilename
      );

      // ANALYZE

      setStatus(
        "Analyzing video..."
      );

      setProgress(10);
      progressRef.current = 10;

      const info =
        await analyzeVideo(
          uploadedFilename
        );

      applyVideoInfo(info);

      setProgress(15);
      progressRef.current = 15;

      setStatus(
        "Ready"
      );

      setLoading(false);
    } catch (error) {
      console.error(
        "Upload/analyze error:",
        error
      );

      resetProject();

      setStatus(
        "Error"
      );

      alert(
        error instanceof Error
          ? error.message
          : "Videoni yuklashda xatolik yuz berdi."
      );
    }
  }

  // ==========================================================
  // URL DOWNLOAD
  // ==========================================================

  async function handleUrlSubmit(
    url: string
  ) {
    stopProgressAnimation();

    setLoading(true);

    setFile(null);
    setFilename(null);
    setVideos([]);

    setDuration(0);
    setStartTime(0);
    setEndTime(0);

    setStatus(
      "Downloading video..."
    );

    setProgress(5);
    progressRef.current = 5;

    try {
      // DOWNLOAD

      const result =
        await downloadVideoFromUrl(
          url
        );

      if (
        !result?.filename
      ) {
        throw new Error(
          "Backend filename qaytarmadi."
        );
      }

      const downloadedFilename =
        result.filename;

      setFilename(
        downloadedFilename
      );

      // ANALYZE

      setStatus(
        "Analyzing video..."
      );

      setProgress(10);
      progressRef.current = 10;

      const info =
        await analyzeVideo(
          downloadedFilename
        );

      applyVideoInfo(info);

      setProgress(15);
      progressRef.current = 15;

      setStatus(
        "Ready"
      );

      setLoading(false);
    } catch (error) {
      console.error(
        "URL error:",
        error
      );

      stopProgressAnimation();

      setFilename(null);
      setDuration(0);
      setStartTime(0);
      setEndTime(0);

      setProgress(0);
      progressRef.current = 0;

      setStatus(
        "Error"
      );

      setLoading(false);

      alert(
        error instanceof Error
          ? error.message
          : "Video yuklab bo'lmadi."
      );
    }
  }

  // ==========================================================
  // GENERATE
  // ==========================================================

  async function handleGenerate() {
    if (!filename) {
      alert(
        "Avval video yuklang."
      );

      return;
    }

    if (
      duration <= 0
    ) {
      alert(
        "Video davomiyligi aniqlanmadi."
      );

      return;
    }

    if (
      endTime <= startTime
    ) {
      alert(
        "Video oralig'i noto'g'ri."
      );

      return;
    }

    if (
      endTime - startTime >
      3600
    ) {
      alert(
        "Tanlangan oralig' maksimum 60 daqiqa bo'lishi kerak."
      );

      return;
    }

    try {
      setLoading(true);

      setVideos([]);

      stopProgressAnimation();

      setProgress(10);
      progressRef.current = 10;

      setStatus(
        "Starting AI processing..."
      );

      await startVideoProcessing(
        filename,
        startTime,
        endTime
      );
    } catch (error) {
      console.error(
        "Generation error:",
        error
      );

      stopProgressAnimation();

      setStatus(
        "Error"
      );

      setProgress(0);
      progressRef.current = 0;

      setLoading(false);

      alert(
        error instanceof Error
          ? error.message
          : "Video generate qilishda xatolik yuz berdi."
      );
    }
  }

  // ==========================================================
  // PROCESSING
  // ==========================================================

  async function startVideoProcessing(
    videoFilename: string,
    selectedStart: number,
    selectedEnd: number
  ) {
    setStatus(
      "Starting AI processing..."
    );

    setProgress(10);
    progressRef.current = 10;

    await startProcessing(
      videoFilename,
      selectedStart,
      selectedEnd
    );

    let finished =
      false;

    while (!finished) {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );

      const result =
        await getProcessingStatus(
          videoFilename
        );

      console.log(
        "PROCESS STATUS:",
        result
      );

      // ERROR

      if (
        result.status ===
        "error"
      ) {
        stopProgressAnimation();

        throw new Error(
          result.error ||
            "Video processingda xatolik yuz berdi."
        );
      }

      // BACKEND PROGRESS

      if (
        typeof result.progress ===
        "number"
      ) {
        const backendProgress =
          Math.max(
            0,
            Math.min(
              100,
              result.progress
            )
          );

        setProgress(
          (current) => {
            const next =
              Math.max(
                current,
                backendProgress
              );

            progressRef.current =
              next;

            return next;
          }
        );
      }

      // STATUS

      switch (
        result.step
      ) {
        case "starting":
          setStatus(
            "Starting video processing..."
          );
          break;

        case "analyzing":
          setStatus(
            "AI analyzing video..."
          );
          break;

        case "finding_highlights":
          setStatus(
            "Finding best moments..."
          );
          break;

        case "generating_shorts":
          setStatus(
            "Generating your shorts..."
          );

          if (
            progressRef.current <
            88
          ) {
            startProgressAnimation();
          }

          break;

        case "finishing":
          stopProgressAnimation();

          setProgress(95);
          progressRef.current = 95;

          setStatus(
            "Finishing your shorts..."
          );

          break;

        case "completed":
          stopProgressAnimation();

          setProgress(100);
          progressRef.current = 100;

          setStatus(
            "Completed!"
          );

          break;

        default:
          if (
            result.status ===
            "processing"
          ) {
            setStatus(
              "Processing video..."
            );
          }
      }

      // COMPLETED

      if (
        result.status ===
        "completed"
      ) {
        stopProgressAnimation();

        setProgress(100);
        progressRef.current = 100;

        setStatus(
          "Completed!"
        );

        if (
          !Array.isArray(
            result.files
          ) ||
          result.files.length ===
            0
        ) {
          throw new Error(
            "Hech qanday short yaratilmadi."
          );
        }

        setVideos(
          result.files
        );

        setLoading(false);

        finished = true;
      }
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  const ready =
    Boolean(
      filename &&
        duration > 0
    );

  return (
    <div className="space-y-8">
      {/* ======================================================
          TITLE
      ====================================================== */}

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-600/10 text-2xl">
          ✨
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Generate AI Shorts
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
          Upload a video and let
          ClipForge AI find the
          best moments for
          short-form content.
        </p>
      </div>

      {/* ======================================================
          UPLOAD
      ====================================================== */}

      {!loading &&
        !ready &&
        videos.length === 0 && (
          <UploadArea
            onSelect={
              handleFileSelect
            }
            onUrlSubmit={
              handleUrlSubmit
            }
          />
        )}

      {/* ======================================================
          READY VIDEO
      ====================================================== */}

      {ready &&
        !loading && (
          <div className="space-y-4">
            {/* VIDEO INFO */}

            <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                  ✓
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Video ready
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {file?.name ||
                      "Video loaded successfully"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  resetProject
                }
                className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
              >
                Change Video
              </button>
            </div>

            {/* RANGE */}

            <ClipRange
              duration={
                duration
              }
              startTime={
                startTime
              }
              endTime={
                endTime
              }
              onChange={(
                start,
                end
              ) => {
                setStartTime(
                  start
                );

                setEndTime(
                  end
                );
              }}
            />

            {/* GENERATE */}

            <button
              type="button"
              onClick={
                handleGenerate
              }
              disabled={
                endTime <=
                startTime
              }
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 text-base font-black text-white shadow-xl shadow-violet-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-950/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>✨</span>
                Generate Shorts
              </span>
            </button>
          </div>
        )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-3xl">
              ⚡
            </div>

            <Loading
              status={status}
              progress={
                progress
              }
            />

            <p className="mt-5 text-center text-xs text-zinc-600">
              Please keep this page open while ClipForge AI works.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!loading &&
        videos.length > 0 && (
          <div className="space-y-6">
            {/* RESULT HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Completed
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  Generated Shorts
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Your AI-generated
                  shorts are ready.
                </p>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-4 py-2 text-sm font-black text-violet-400">
                {videos.length}{" "}
                VIDEOS
              </div>
            </div>

            {/* VIDEOS */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videos.map(
                (video) => (
                  <VideoCard
                    key={video}
                    filename={
                      video
                    }
                  />
                )
              )}
            </div>

            {/* NEW PROJECT */}

            <button
              type="button"
              onClick={
                resetProject
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-4 text-sm font-bold text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white"
            >
              + Create Another Project
            </button>
          </div>
        )}
    </div>
  );
}
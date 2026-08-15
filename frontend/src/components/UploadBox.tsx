"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Loading from "./Loading";
import VideoCard from "./VideoCard";

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
// TIME
// ============================================================

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
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
  const trackRef = useRef<HTMLDivElement | null>(null);

  const maxRange = Math.min(duration, 3600);

  const selectedDuration = Math.max(
    0,
    endTime - startTime
  );

  const startPercent =
    duration > 0 ? (startTime / duration) * 100 : 0;

  const endPercent =
    duration > 0 ? (endTime / duration) * 100 : 0;

  function getValueFromPointer(clientX: number) {
    const track = trackRef.current;

    if (!track || duration <= 0) {
      return 0;
    }

    const rect = track.getBoundingClientRect();

    if (rect.width <= 0) {
      return 0;
    }

    let percent =
      (clientX - rect.left) / rect.width;

    percent = Math.max(
      0,
      Math.min(1, percent)
    );

    return Math.round(percent * duration);
  }

  function updateFromPointer(
    clientX: number,
    type: "start" | "end"
  ) {
    const value = getValueFromPointer(clientX);

    if (type === "start") {
      const maxStart = endTime - 1;

      const newStart = Math.max(
        0,
        Math.min(value, maxStart)
      );

      onChange(newStart, endTime);
      return;
    }

    const minEnd = startTime + 1;

    const maxEnd = Math.min(
      duration,
      startTime + maxRange
    );

    const newEnd = Math.max(
      minEnd,
      Math.min(value, maxEnd)
    );

    onChange(startTime, newEnd);
  }

  function startDrag(
    type: "start" | "end"
  ) {
    function handleMove(event: PointerEvent) {
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

  function handleTrackPointerDown(
    event: React.PointerEvent
  ) {
    const value =
      getValueFromPointer(
        event.clientX
      );

    const distanceToStart =
      Math.abs(value - startTime);

    const distanceToEnd =
      Math.abs(value - endTime);

    const nearest =
      distanceToStart <= distanceToEnd
        ? "start"
        : "end";

    updateFromPointer(
      event.clientX,
      nearest
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0d0d10] p-5 shadow-xl shadow-black/20 md:p-7">

      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-xl">
            ✂️
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              Select Clip Range
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Choose the part AI should process
            </p>
          </div>

        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Selected
          </p>

          <p className="mt-1 text-lg font-black text-violet-400">
            {formatTime(selectedDuration)}
          </p>
        </div>

      </div>

      {/* RANGE */}

      <div className="mt-8">

        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative h-14 w-full cursor-pointer touch-none"
        >

          {/* TRACK */}

          <div className="absolute left-0 right-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-zinc-800" />

          {/* SELECTED */}

          <div
            className="pointer-events-none absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 shadow-lg shadow-violet-950/40"
            style={{
              left: `${startPercent}%`,
              right: `${100 - endPercent}%`,
            }}
          />

          {/* START */}

          <button
            type="button"
            aria-label="Start time"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startDrag("start");
            }}
            className="absolute top-1/2 z-30 h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-4 border-violet-400 bg-white shadow-xl shadow-violet-950/60 transition-transform hover:scale-110 active:cursor-grabbing active:scale-125"
            style={{
              left: `${startPercent}%`,
            }}
          />

          {/* END */}

          <button
            type="button"
            aria-label="End time"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startDrag("end");
            }}
            className="absolute top-1/2 z-40 h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-4 border-fuchsia-400 bg-white shadow-xl shadow-fuchsia-950/60 transition-transform hover:scale-110 active:cursor-grabbing active:scale-125"
            style={{
              left: `${endPercent}%`,
            }}
          />

        </div>

      </div>

      {/* TIME CARDS */}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Start
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatTime(startTime)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            End
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatTime(endTime)}
          </p>
        </div>

      </div>

      {/* INFO */}

      <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-zinc-600">
        <span>0:00</span>

        <span>
          Video: {formatTime(duration)}
        </span>

        <span>
          Max: {formatTime(maxRange)}
        </span>
      </div>

      {/* TIP */}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500">
        <span>💡</span>

        <span>
          Drag the{" "}
          <b className="text-violet-400">
            left handle
          </b>{" "}
          and{" "}
          <b className="text-fuchsia-400">
            right handle
          </b>{" "}
          to choose your clip.
        </span>
      </div>

    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function UploadBox() {

  const [videos, setVideos] =
    useState<string[]>([]);

  const [file, setFile] =
    useState<File | null>(null);

  const [filename, setFilename] =
    useState<string | null>(null);

  const [duration, setDuration] =
    useState(0);

  const [startTime, setStartTime] =
    useState(0);

  const [endTime, setEndTime] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("Waiting...");

  const [progress, setProgress] =
    useState(0);

  const [videoPreview, setVideoPreview] =
    useState<string | null>(null);

  const [url, setUrl] =
    useState("");

  const [urlMode, setUrlMode] =
    useState(false);

  const progressRef =
    useRef(0);

  const animationRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  // ==========================================================
  // PROGRESS
  // ==========================================================

  function stopProgressAnimation() {
    if (animationRef.current) {
      clearInterval(
        animationRef.current
      );

      animationRef.current = null;
    }
  }

  function startProgressAnimation() {
    stopProgressAnimation();

    animationRef.current =
      setInterval(() => {
        setProgress((current) => {

          if (current >= 88) {
            return current;
          }

          let increase = 0.4;

          if (current < 50) {
            increase = 0.8;
          } else if (current < 65) {
            increase = 0.5;
          } else if (current < 80) {
            increase = 0.25;
          } else {
            increase = 0.1;
          }

          const next =
            Math.min(
              88,
              current + increase
            );

          progressRef.current =
            next;

          return next;
        });
      }, 1000);
  }

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      stopProgressAnimation();

      if (videoPreview) {
        URL.revokeObjectURL(
          videoPreview
        );
      }
    };
  }, [videoPreview]);

  // ==========================================================
  // RESET
  // ==========================================================

  function resetProject() {
    stopProgressAnimation();

    if (videoPreview) {
      URL.revokeObjectURL(
        videoPreview
      );
    }

    setFile(null);
    setFilename(null);
    setVideos([]);

    setDuration(0);
    setStartTime(0);
    setEndTime(0);

    setProgress(0);
    progressRef.current = 0;

    setStatus("Waiting...");

    setLoading(false);

    setVideoPreview(null);

    setUrl("");
    setUrlMode(false);
  }

  // ==========================================================
  // VIDEO INFO
  // ==========================================================

  function applyVideoInfo(info: any) {
    const videoDuration =
      Number(info?.duration);

    if (
      !Number.isFinite(videoDuration) ||
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

    if (videoPreview) {
      URL.revokeObjectURL(
        videoPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(
        selectedFile
      );

    setVideoPreview(
      previewUrl
    );

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

      setStatus("Ready");

      setLoading(false);

    } catch (error) {
      console.error(
        "Upload/analyze error:",
        error
      );

      resetProject();

      setStatus("Error");

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
    submittedUrl?: string
  ) {
    const targetUrl =
      (
        submittedUrl ??
        url
      ).trim();

    if (!targetUrl) {
      alert(
        "Video URL kiriting."
      );

      return;
    }

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
      const result =
        await downloadVideoFromUrl(
          targetUrl
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

      setStatus("Ready");

      setLoading(false);

    } catch (error) {
      console.error(
        "URL error:",
        error
      );

      setFilename(null);
      setDuration(0);
      setStartTime(0);
      setEndTime(0);

      setProgress(0);
      progressRef.current = 0;

      setStatus("Error");

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

    if (duration <= 0) {
      alert(
        "Video davomiyligi aniqlanmadi."
      );

      return;
    }

    if (endTime <= startTime) {
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

      setStatus("Error");

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

    let finished = false;

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
          result.files.length === 0
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

  const ready =
    Boolean(
      filename &&
      duration > 0
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-8">

      {/* ======================================================
          HERO
      ====================================================== */}

      {!ready &&
        !loading &&
        videos.length === 0 && (
          <div className="text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-3xl shadow-xl shadow-violet-950/20">
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
        )}

      {/* ======================================================
          UPLOAD CARD
      ====================================================== */}

      {!loading &&
        !ready &&
        videos.length === 0 && (

          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] shadow-2xl shadow-black/30">

            {/* TABS */}

            <div className="border-b border-zinc-800 bg-zinc-950/50 p-2">

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setUrlMode(false)
                  }
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    !urlMode
                      ? "bg-white text-black shadow-lg"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  📁 Upload Video
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUrlMode(true)
                  }
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    urlMode
                      ? "bg-white text-black shadow-lg"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  🔗 Video Link
                </button>

              </div>

            </div>

            {!urlMode ? (

              /* FILE UPLOAD */

              <label
                htmlFor="clipforge-video-upload"
                className="group block cursor-pointer p-6 md:p-10"
              >

                <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-950/60 px-6 py-12 text-center transition-all duration-300 group-hover:border-violet-500/50 group-hover:bg-violet-500/[0.03]">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-3xl shadow-xl transition-transform duration-300 group-hover:scale-105 group-hover:border-violet-500/30">
                    📹
                  </div>

                  <h3 className="mt-6 text-lg font-black text-white">
                    Drag & Drop your video
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    or{" "}
                    <span className="font-bold text-violet-400">
                      click to browse
                    </span>
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "MP4",
                      "MOV",
                      "AVI",
                      "MKV",
                    ].map(
                      (format) => (
                        <span
                          key={format}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-zinc-500"
                        >
                          {format}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-5 text-xs text-zinc-700">
                    Video files only
                  </p>

                </div>

                <input
                  id="clipforge-video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) => {
                    const selected =
                      event.target.files?.[0];

                    if (selected) {
                      handleFileSelect(
                        selected
                      );
                    }
                  }}
                />

              </label>

            ) : (

              /* URL */

              <div className="p-6 md:p-10">

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 md:p-8">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-2xl">
                    🔗
                  </div>

                  <div className="mt-5 text-center">
                    <h3 className="text-lg font-black text-white">
                      Import from a video link
                    </h3>

                    <p className="mt-2 text-sm text-zinc-500">
                      Paste your supported video URL below.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                    <input
                      type="url"
                      value={url}
                      onChange={(event) =>
                        setUrl(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          handleUrlSubmit();
                        }
                      }}
                      placeholder="https://..."
                      className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleUrlSubmit()
                      }
                      className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                    >
                      Import Video
                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>
        )}

      {/* ======================================================
          READY VIDEO
      ====================================================== */}

      {ready &&
        !loading && (

          <div className="space-y-5">

            {/* VIDEO PREVIEW */}

            {videoPreview && (
              <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] shadow-2xl">

                <div className="border-b border-zinc-800 px-5 py-4">
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                        Video ready
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-white">
                        {file?.name ||
                          "Video loaded successfully"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        resetProject
                      }
                      className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                    >
                      Change
                    </button>

                  </div>
                </div>

                <div className="bg-black">
                  <video
                    src={videoPreview}
                    controls
                    className="max-h-[520px] w-full object-contain"
                  />
                </div>

              </div>
            )}

            {/* RANGE */}

            <ClipRange
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              onChange={(
                start,
                end
              ) => {
                setStartTime(start);
                setEndTime(end);
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
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-4 text-base font-black text-white shadow-xl shadow-violet-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-950/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >

              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>✨</span>
                Generate Shorts
              </span>

            </button>

          </div>
        )}

      {/* ======================================================
          PROCESSING
      ====================================================== */}

      {loading && (

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0c0f] shadow-2xl">

          <div className="p-6 md:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-3xl">
              ⚡
            </div>

            <div className="mt-5 text-center">

              <h3 className="text-xl font-black text-white">
                AI is working
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                ClipForge AI is processing your video.
              </p>

            </div>

            <div className="mt-8">
              <Loading
                status={status}
                progress={progress}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Progress
                </p>

                <p className="mt-1 text-sm font-black text-white">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  AI
                </p>

                <p className="mt-1 text-sm font-black text-violet-400">
                  Active
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Status
                </p>

                <p className="mt-1 truncate text-sm font-black text-emerald-400">
                  Processing
                </p>
              </div>

            </div>

            <p className="mt-6 text-center text-xs text-zinc-700">
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

            <div className="flex flex-col gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                    Completed
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  Generated Shorts
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Your AI-generated shorts are ready.
                </p>

              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Created
                </p>

                <p className="mt-1 text-lg font-black text-violet-400">
                  {videos.length}
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

              {videos.map(
                (video) => (
                  <VideoCard
                    key={video}
                    filename={video}
                  />
                )
              )}

            </div>

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
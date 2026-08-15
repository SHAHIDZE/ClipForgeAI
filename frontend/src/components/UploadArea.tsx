"use client";

import { useRef, useState } from "react";

type Props = {
  onSelect: (file: File) => void;
  onUrlSubmit?: (url: string) => Promise<void>;
};

export default function UploadArea({
  onSelect,
  onUrlSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleUrlSubmit() {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      alert("Video linkini kiriting.");
      return;
    }

    if (!onUrlSubmit) {
      return;
    }

    try {
      setUrlLoading(true);

      await onUrlSubmit(trimmedUrl);

      setUrl("");
    } catch (error) {
      console.error("URL submit error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Video yuklab bo'lmadi."
      );
    } finally {
      setUrlLoading(false);
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      alert("Iltimos, video fayl tanlang.");
      return;
    }

    onSelect(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          MODE SWITCH
      ====================================================== */}

      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`
              flex items-center gap-2
              rounded-xl
              px-5
              py-3
              text-sm
              font-bold
              transition-all
              duration-200
              ${
                mode === "upload"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }
            `}
          >
            <span className="text-base">📁</span>
            Upload Video
          </button>

          <button
            type="button"
            onClick={() => setMode("url")}
            className={`
              flex items-center gap-2
              rounded-xl
              px-5
              py-3
              text-sm
              font-bold
              transition-all
              duration-200
              ${
                mode === "url"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }
            `}
          >
            <span className="text-base">🔗</span>
            Video Link
          </button>
        </div>
      </div>

      {/* =====================================================
          FILE UPLOAD
      ====================================================== */}

      {mode === "upload" && (
        <div className="space-y-4">
          <label
            htmlFor="video-upload"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={handleDrop}
            className={`
              group
              relative
              block
              cursor-pointer
              overflow-hidden
              rounded-3xl
              border
              bg-zinc-950/80
              px-6
              py-12
              text-center
              transition-all
              duration-300
              ${
                dragging
                  ? "border-violet-400 bg-violet-500/[0.08] shadow-2xl shadow-violet-950/30"
                  : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950"
              }
            `}
          >
            {/* TOP GLOW */}

            <div
              className={`
                pointer-events-none
                absolute
                left-1/2
                top-0
                h-40
                w-72
                -translate-x-1/2
                rounded-full
                bg-violet-600/10
                blur-3xl
                transition-all
                duration-500
                ${
                  dragging
                    ? "scale-125 opacity-100"
                    : "opacity-60 group-hover:opacity-100"
                }
              `}
            />

            {/* ICON */}

            <div
              className={`
                relative
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-2xl
                border
                text-3xl
                shadow-xl
                transition-all
                duration-300
                ${
                  dragging
                    ? "scale-110 border-violet-400/50 bg-violet-500/15"
                    : "border-zinc-800 bg-zinc-900 group-hover:scale-105 group-hover:border-violet-500/40 group-hover:bg-violet-500/10"
                }
              `}
            >
              {dragging ? "⬇️" : "📹"}
            </div>

            {/* TITLE */}

            <h2 className="relative mt-6 text-2xl font-black tracking-tight text-white">
              {dragging
                ? "Drop your video here"
                : "Drag & Drop your video"}
            </h2>

            <p className="relative mt-2 text-sm text-zinc-500">
              or{" "}
              <span className="font-semibold text-violet-400 transition-colors group-hover:text-violet-300">
                click to browse
              </span>
            </p>

            {/* FORMATS */}

            <div className="relative mt-7 flex flex-wrap justify-center gap-2">
              {["MP4", "MOV", "AVI", "MKV"].map((format) => (
                <span
                  key={format}
                  className="
                    rounded-lg
                    border
                    border-zinc-800
                    bg-zinc-900/80
                    px-3
                    py-1.5
                    text-[10px]
                    font-black
                    tracking-wider
                    text-zinc-500
                  "
                >
                  {format}
                </span>
              ))}
            </div>

            <p className="relative mt-4 text-xs text-zinc-600">
              Supported video formats
            </p>

            <input
              ref={inputRef}
              id="video-upload"
              hidden
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleFile(file);
                }

                event.target.value = "";
              }}
            />
          </label>

          {/* SMALL INFO CARDS */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center">
              <p className="text-sm">⚡</p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">
                Fast upload
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center">
              <p className="text-sm">🤖</p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">
                AI powered
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center">
              <p className="text-sm">✂️</p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">
                Auto clipping
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          URL IMPORT
      ====================================================== */}

      {mode === "url" && (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl md:p-8">
          {/* BACKGROUND GLOW */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-fuchsia-600/5 blur-3xl" />

          <div className="relative">
            {/* ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-3xl shadow-xl">
              🔗
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Import from a video link
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                Paste a supported video URL and ClipForge AI
                will download and analyze it automatically.
              </p>
            </div>

            {/* INPUT */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleUrlSubmit();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={urlLoading}
                className="
                  min-w-0
                  flex-1
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  px-5
                  py-4
                  text-sm
                  text-white
                  outline-none
                  transition-all
                  placeholder:text-zinc-600
                  focus:border-violet-500/60
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />

              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={urlLoading || !url.trim()}
                className="
                  flex
                  min-h-[54px]
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-gradient-to-r
                  from-violet-600
                  to-fuchsia-600
                  px-7
                  py-4
                  text-sm
                  font-black
                  text-white
                  shadow-lg
                  shadow-violet-950/20
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:shadow-xl
                  hover:shadow-violet-950/30
                  active:translate-y-0
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  disabled:hover:translate-y-0
                "
              >
                {urlLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Downloading...
                  </>
                ) : (
                  <>
                    Load Video
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {/* STATUS */}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              <span>
                Video will be downloaded before AI processing
              </span>
            </div>

            {/* SUPPORTED */}

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["YouTube", "Video URL"].map((source) => (
                <span
                  key={source}
                  className="
                    rounded-lg
                    border
                    border-zinc-800
                    bg-zinc-900/70
                    px-3
                    py-1.5
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-zinc-600
                  "
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
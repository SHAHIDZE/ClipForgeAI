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
    <div className="w-full">
      {/* MODE SWITCH */}
      <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`
              rounded-xl
              px-4
              py-3
              text-sm
              font-bold
              transition-all
              duration-200
              ${
                mode === "upload"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }
            `}
          >
            📁 Upload Video
          </button>

          <button
            type="button"
            onClick={() => setMode("url")}
            className={`
              rounded-xl
              px-4
              py-3
              text-sm
              font-bold
              transition-all
              duration-200
              ${
                mode === "url"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
              }
            `}
          >
            🔗 Video Link
          </button>
        </div>
      </div>

      {/* FILE UPLOAD */}
      {mode === "upload" && (
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
            border-2
            border-dashed
            px-6
            py-14
            text-center
            transition-all
            duration-300
            ${
              dragging
                ? "border-violet-500 bg-violet-600/10 shadow-xl shadow-violet-950/20"
                : "border-zinc-800 bg-zinc-950/60 hover:border-violet-500/60 hover:bg-zinc-950"
            }
          `}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl transition-opacity group-hover:opacity-100" />

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
              text-4xl
              shadow-lg
              transition-all
              duration-300
              ${
                dragging
                  ? "border-violet-500/50 bg-violet-600/20 scale-110"
                  : "border-zinc-800 bg-zinc-900 group-hover:border-violet-500/40 group-hover:bg-violet-600/10 group-hover:scale-105"
              }
            `}
          >
            📹
          </div>

          {/* TITLE */}
          <h2 className="relative mt-7 text-2xl font-black tracking-tight text-white">
            {dragging
              ? "Drop your video here"
              : "Drag & Drop Video"}
          </h2>

          <p className="relative mt-2 text-sm text-zinc-500">
            or{" "}
            <span className="font-semibold text-violet-400">
              click to browse
            </span>
          </p>

          {/* FORMAT BADGES */}
          <div className="relative mt-6 flex flex-wrap justify-center gap-2">
            {["MP4", "MOV", "AVI", "MKV"].map((format) => (
              <span
                key={format}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-zinc-500"
              >
                {format}
              </span>
            ))}
          </div>

          <p className="relative mt-4 text-xs text-zinc-600">
            Video files only
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
      )}

      {/* URL */}
      {mode === "url" && (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative text-center">
            {/* ICON */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-4xl shadow-lg">
              🔗
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
              Paste Video Link
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Paste a YouTube or supported video URL
              and ClipForge AI will download it automatically.
            </p>
          </div>

          {/* INPUT */}
          <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
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
                transition
                placeholder:text-zinc-600
                focus:border-violet-500
                focus:ring-2
                focus:ring-violet-500/10
                disabled:opacity-50
              "
            />

            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={urlLoading || !url.trim()}
              className="
                rounded-2xl
                bg-gradient-to-r
                from-violet-600
                to-fuchsia-600
                px-7
                py-4
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-violet-900/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-violet-900/40
                disabled:cursor-not-allowed
                disabled:opacity-40
                disabled:hover:translate-y-0
              "
            >
              {urlLoading ? "Downloading..." : "Load Video"}
            </button>
          </div>

          {/* INFO */}
          <div className="relative mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Video will be downloaded before AI processing
          </div>
        </div>
      )}
    </div>
  );
}
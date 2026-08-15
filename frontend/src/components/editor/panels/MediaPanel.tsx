"use client";

import {
  Film,
  Upload,
} from "lucide-react";

import { useEditorStore } from "../../../../store/editor/editorStore";

export default function MediaPanel() {
  const mediaUrl =
    useEditorStore(
      (state) => state.mediaUrl,
    );

  const filename =
    useEditorStore(
      (state) =>
        state.project.filename,
    );

  const duration =
    useEditorStore(
      (state) =>
        state.project.duration,
    );

  const setMedia =
    useEditorStore(
      (state) => state.setMedia,
    );

  const inputHandler = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/",
      )
    ) {
      return;
    }

    const url =
      URL.createObjectURL(file);

    setMedia(
      url,
      0,
      file.name,
    );

    event.target.value = "";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Film
            size={15}
            className="text-indigo-300"
          />

          <h2 className="text-sm font-semibold">
            Media
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Import and manage your
          project media.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center transition hover:border-indigo-400/30 hover:bg-indigo-500/[0.04]">
          <Upload
            size={22}
            className="mb-3 text-white/40"
          />

          <span className="text-xs font-medium">
            Import video
          </span>

          <span className="mt-1 text-[10px] text-white/25">
            MP4, MOV, WEBM
          </span>

          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={
              inputHandler
            }
          />
        </label>

        {mediaUrl && (
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <Film
                  size={16}
                  className="text-indigo-300"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {filename ||
                    "Video"}
                </div>

                <div className="mt-1 text-[10px] text-white/25">
                  {duration > 0
                    ? `${duration.toFixed(
                        1,
                      )} sec`
                    : "Loading metadata..."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
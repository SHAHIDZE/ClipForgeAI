"use client";

import {
  Download,
  FileVideo,
} from "lucide-react";

import { useEditorStore } from "../../../../store/editor/editorStore";

export default function ExportPanel() {
  const project =
    useEditorStore(
      (state) => state.project,
    );

  const canvas =
    useEditorStore(
      (state) => state.canvas,
    );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Download
            size={15}
            className="text-orange-300"
          />

          <h2 className="text-sm font-semibold">
            Export
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Configure and export your
          video.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/25">
            Format
          </label>

          <select className="w-full rounded-lg border border-white/[0.08] bg-[#101217] px-3 py-2 text-xs text-white outline-none">
            <option>
              MP4
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/25">
            Quality
          </label>

          <select className="w-full rounded-lg border border-white/[0.08] bg-[#101217] px-3 py-2 text-xs text-white outline-none">
            <option>
              1080p
            </option>

            <option>
              720p
            </option>

            <option>
              4K
            </option>
          </select>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center gap-3">
            <FileVideo
              size={18}
              className="text-orange-300"
            />

            <div>
              <div className="text-xs font-medium">
                {project.name}
              </div>

              <div className="mt-1 text-[9px] text-white/25">
                {canvas.width} ×{" "}
                {canvas.height}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-white/90"
        >
          <Download size={14} />
          Export video
        </button>
      </div>
    </div>
  );
}
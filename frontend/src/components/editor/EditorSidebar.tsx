"use client";

import React from "react";

import {
  useEditorStore,
} from "../../../store/editor/editorStore";

import type {
  EditorTool,
} from "../../../store/editor/editorTypes";

type ToolItem = {
  id: EditorTool;
  label: string;
  icon: string;
};

const tools: ToolItem[] = [
  {
    id: "select",
    label: "Select",
    icon: "⌁",
  },
  {
    id: "media",
    label: "Media",
    icon: "▣",
  },
  {
    id: "text",
    label: "Text",
    icon: "T",
  },
  {
    id: "caption",
    label: "Captions",
    icon: "CC",
  },
  {
    id: "audio",
    label: "Audio",
    icon: "♫",
  },
  {
    id: "element",
    label: "Elements",
    icon: "◇",
  },
  {
    id: "ai",
    label: "AI Studio",
    icon: "✦",
  },
];

export default function EditorSidebar() {
  const {
    activeTool,
    setActiveTool,
  } = useEditorStore();

  return (
    <aside className="flex w-[76px] shrink-0 flex-col border-r border-white/10 bg-[#0d0f14]">
      <div className="flex flex-1 flex-col items-center gap-1 py-3">
        {tools.map(
          (tool) => {
            const active =
              activeTool ===
              tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() =>
                  setActiveTool(
                    tool.id,
                  )
                }
                className={`group flex w-[62px] flex-col items-center justify-center gap-1 rounded-lg py-2 transition ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-white/35 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold ${
                    active
                      ? "bg-indigo-500/20"
                      : "bg-white/[0.03]"
                  }`}
                >
                  {tool.icon}
                </span>

                <span className="text-[9px]">
                  {tool.label}
                </span>
              </button>
            );
          },
        )}
      </div>

      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          className="flex w-full flex-col items-center gap-1 rounded-lg py-2 text-white/30 hover:bg-white/5 hover:text-white"
        >
          <span className="text-sm">
            ⚙
          </span>

          <span className="text-[9px]">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}
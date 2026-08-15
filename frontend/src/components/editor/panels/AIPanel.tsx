"use client";

import {
  Bot,
  Sparkles,
  WandSparkles,
} from "lucide-react";

export default function AIPanel() {
  const tools = [
    {
      title: "Auto highlights",
      description:
        "Find the most engaging moments.",
    },

    {
      title: "AI captions",
      description:
        "Generate captions automatically.",
    },

    {
      title: "Smart reframing",
      description:
        "Prepare video for vertical content.",
    },

    {
      title: "Shorts generator",
      description:
        "Turn long videos into shorts.",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Bot
            size={15}
            className="text-cyan-300"
          />

          <h2 className="text-sm font-semibold">
            AI Studio
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          AI tools for faster
          editing.
        </p>
      </div>

      <div className="space-y-2 p-4">
        {tools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            className="group flex w-full items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-cyan-400/20 hover:bg-cyan-500/[0.035]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.08]">
              <Sparkles
                size={14}
                className="text-cyan-300"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-medium text-white/75 group-hover:text-white">
                {tool.title}
              </div>

              <div className="mt-1 text-[9px] leading-4 text-white/25">
                {tool.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-3">
          <div className="flex items-center gap-2">
            <WandSparkles
              size={13}
              className="text-cyan-300"
            />

            <span className="text-[10px] font-medium text-cyan-100/60">
              ClipForge AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
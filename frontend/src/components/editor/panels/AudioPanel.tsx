"use client";

import {
  AudioLines,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useEditorStore } from "../../../../store/editor/editorStore";

export default function AudioPanel() {
  const tracks =
    useEditorStore(
      (state) =>
        state.timeline.tracks,
    );

  const audioTrack =
    tracks.find(
      (track) =>
        track.type === "audio",
    );

  const toggleMute = () => {
    if (!audioTrack) {
      return;
    }

    useEditorStore.setState(
      (state) => ({
        timeline: {
          ...state.timeline,

          tracks:
            state.timeline.tracks.map(
              (track) =>
                track.id ===
                audioTrack.id
                  ? {
                      ...track,
                      muted:
                        !track.muted,
                    }
                  : track,
            ),
        },
      }),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <AudioLines
            size={15}
            className="text-emerald-300"
          />

          <h2 className="text-sm font-semibold">
            Audio
          </h2>
        </div>

        <p className="mt-1 text-[11px] text-white/30">
          Control your video's
          original audio.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              Original audio
            </span>

            <button
              type="button"
              onClick={
                toggleMute
              }
              className="rounded-lg p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              {audioTrack?.muted ? (
                <VolumeX size={15} />
              ) : (
                <Volume2 size={15} />
              )}
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[10px] text-white/25">
              <span>
                Volume
              </span>

              <span>
                {audioTrack?.muted
                  ? "Muted"
                  : "100%"}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-full rounded-full bg-emerald-400/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import {
  useEffect,
  useRef,
} from "react";

type PlayheadProps = {
  currentTime: number;
  duration: number;
  width: number;
};

export default function Playhead({
  currentTime,
  duration,
  width,
}: PlayheadProps) {
  const ref =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const progress =
      duration > 0
        ? Math.max(
            0,
            Math.min(
              1,
              currentTime /
                duration,
            ),
          )
        : 0;

    const x =
      progress * width;

    ref.current.style.transform =
      `translate3d(${x}px,0,0)`;
  }, [
    currentTime,
    duration,
    width,
  ]);

  return (
    <div
      ref={ref}
      data-playhead
      className="pointer-events-none absolute left-0 top-0 z-50 h-full w-px will-change-transform"
    >
      <div className="absolute -left-[6px] top-0 h-3 w-3">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
      </div>

      <div className="absolute left-0 top-2 h-[calc(100%-8px)] w-px bg-white shadow-[0_0_10px_rgba(255,255,255,.55)]" />

      <div className="absolute -left-[3px] top-2 h-[calc(100%-8px)] w-[7px] bg-white/[0.035] blur-[3px]" />
    </div>
  );
}
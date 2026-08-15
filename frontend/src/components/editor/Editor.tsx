"use client";


import { useEffect, useRef } from "react";


import { useEditorStore } from "../../../store/editor/useEditorStore";


import EditorToolbar from "./EditorToolbar";
import EditorPreview from "./EditorPreview";
import Timeline from "./Timeline/Timeline";


import "./Editor.css";


export default function Editor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);


  const mediaUrl = useEditorStore((state) => state.mediaUrl);
  const playback = useEditorStore((state) => state.playback);
  const project = useEditorStore((state) => state.project);


  const setCurrentTime = useEditorStore(
    (state) => state.setCurrentTime,
  );


  const setPlaying = useEditorStore(
    (state) => state.setPlaying,
  );


  const setProjectDuration = useEditorStore(
    (state) => state.setProjectDuration,
  );


  const setPlaybackRate = useEditorStore(
    (state) => state.setPlaybackRate,
  );


  useEffect(() => {
    const video = videoRef.current;


    if (!video) {
      return;
    }


    if (
      Math.abs(
        video.currentTime - playback.currentTime,
      ) > 0.08
    ) {
      video.currentTime =
        playback.currentTime;
    }
  }, [playback.currentTime]);


  useEffect(() => {
    const video = videoRef.current;


    if (!video) {
      return;
    }


    video.playbackRate =
      playback.playbackRate;


    if (playback.playing) {
      video.play().catch(() => {
        setPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [
    playback.playing,
    playback.playbackRate,
    setPlaying,
  ]);


  const handleLoadedMetadata = () => {
    const video = videoRef.current;


    if (!video) {
      return;
    }


    if (
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      setProjectDuration(
        video.duration,
      );
    }
  };


  const handleTimeUpdate = () => {
    const video = videoRef.current;


    if (!video) {
      return;
    }


    setCurrentTime(
      video.currentTime,
    );
  };


  const handleEnded = () => {
    setPlaying(false);
  };


  return (
    <main className="cf-editor">
      <EditorToolbar
        videoRef={videoRef}
      />


      <section className="cf-editor-main">
        <aside className="cf-tools-panel">
          <div className="cf-tools-header">
            <span>TOOLS</span>
          </div>


          <ToolButton
            icon="↖"
            label="Select"
            tool="select"
          />


          <ToolButton
            icon="▣"
            label="Media"
            tool="media"
          />


          <ToolButton
            icon="T"
            label="Text"
            tool="text"
          />


          <ToolButton
            icon="T"
            label="Captions"
            tool="caption"
          />


          <ToolButton
            icon="♫"
            label="Audio"
            tool="audio"
          />


          <ToolButton
            icon="◆"
            label="Elements"
            tool="element"
          />


          <ToolButton
            icon="✦"
            label="AI"
            tool="ai"
          />
        </aside>


        <section className="cf-workspace">
          <EditorPreview
            videoRef={videoRef}
            mediaUrl={mediaUrl}
            project={project}
            playback={playback}
            onLoadedMetadata={
              handleLoadedMetadata
            }
            onTimeUpdate={
              handleTimeUpdate
            }
            onEnded={handleEnded}
            onTogglePlay={() => {
              setPlaying(
                !playback.playing,
              );
            }}
            onSpeedChange={
              setPlaybackRate
            }
          />


          <Timeline />
        </section>
      </section>
    </main>
  );
}


function ToolButton({
  icon,
  label,
  tool,
}: {
  icon: string;
  label: string;
  tool:
    | "select"
    | "split"
    | "text"
    | "caption"
    | "audio"
    | "element"
    | "ai"
    | "media";
}) {
  const activeTool =
    useEditorStore(
      (state) => state.activeTool,
    );


  const setActiveTool =
    useEditorStore(
      (state) => state.setActiveTool,
    );


  const active =
    activeTool === tool;


  return (
    <button
      type="button"
      className={`cf-tool-button ${
        active
          ? "cf-tool-button-active"
          : ""
      }`}
      onClick={() =>
        setActiveTool(tool)
      }
    >
      <span className="cf-tool-icon">
        {icon}
      </span>


      <span className="cf-tool-label">
        {label}
      </span>
    </button>
  );
}
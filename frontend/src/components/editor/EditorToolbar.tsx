"use client";

import { useEditorStore } from "../../../store/editor/useEditorStore";
import type { CanvasRatio } from "../../../store/editor/editorTypes";

export default function EditorToolbar() {
  const project = useEditorStore(
    (state) => state.project,
  );

  const canvas = useEditorStore(
    (state) => state.canvas,
  );

  const setCanvasRatio = useEditorStore(
    (state) => state.setCanvasRatio,
  );

  const undo = useEditorStore(
    (state) => state.undo,
  );

  const redo = useEditorStore(
    (state) => state.redo,
  );

  const canUndo = useEditorStore(
    (state) =>
      state.history.past.length > 0,
  );

  const canRedo = useEditorStore(
    (state) =>
      state.history.future.length > 0,
  );

  const saveProject = () => {
    alert(
      "Project save integration will be connected to the ClipForge backend next.",
    );
  };

  const exportVideo = () => {
    alert(
      "Export integration will be connected to the ClipForge backend next.",
    );
  };

  return (
    <header className="cf-topbar">
      {/* BRAND */}
      <div className="cf-brand">
        <div className="cf-brand-mark">
          C
        </div>

        <div>
          <div className="cf-brand-title">
            ClipForge
          </div>

          <div className="cf-brand-subtitle">
            Video Studio
          </div>
        </div>
      </div>

      {/* PROJECT */}
      <div className="cf-project-title">
        <span>
          {project.name || "Untitled Project"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="cf-top-actions">
        {/* HISTORY */}
        <div className="cf-history-buttons">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>
        </div>

        {/* RATIO */}
        <div className="cf-ratio-group">
          {(
            [
              "9:16",
              "16:9",
              "1:1",
            ] as CanvasRatio[]
          ).map((ratio) => (
            <button
              key={ratio}
              type="button"
              className={
                canvas.ratio === ratio
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCanvasRatio(ratio)
              }
            >
              {ratio}
            </button>
          ))}

          <button
            type="button"
            className={
              canvas.ratio === "custom"
                ? "active"
                : ""
            }
            onClick={() =>
              setCanvasRatio("custom")
            }
          >
            Custom
          </button>
        </div>

        {/* SAVE */}
        <button
          type="button"
          className="cf-save-button"
          onClick={saveProject}
        >
          Save
        </button>

        {/* EXPORT */}
        <button
          type="button"
          className="cf-export-button"
          onClick={exportVideo}
        >
          Export
        </button>
      </div>
    </header>
  );
}
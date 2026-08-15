"use client";

import { useMemo } from "react";

import { useEditorStore } from "../../../store/editor/useEditorStore";

export default function PropertiesPanel() {
  const tracks = useEditorStore(
    (state) => state.timeline.tracks,
  );

  const selection = useEditorStore(
    (state) => state.selection,
  );

  const selectClip = useEditorStore(
    (state) => state.selectClip,
  );

  const renameTrack = useEditorStore(
    (state) => state.renameTrack,
  );

  const moveClip = useEditorStore(
    (state) => state.moveClip,
  );

  const resizeClip = useEditorStore(
    (state) => state.resizeClip,
  );

  const selected = useMemo(() => {
    if (!selection.clipId) {
      return null;
    }

    for (const track of tracks) {
      const clip = track.clips.find(
        (item) => item.id === selection.clipId,
      );

      if (clip) {
        return {
          clip,
          track,
        };
      }
    }

    return null;
  }, [tracks, selection.clipId]);

  if (!selected) {
    return (
      <aside className="cf-properties-panel">
        <div className="cf-properties-header">
          <span>PROPERTIES</span>
        </div>

        <div className="cf-properties-empty">
          <div className="cf-properties-empty-icon">
            ◇
          </div>

          <div className="cf-properties-empty-title">
            Nothing selected
          </div>

          <div className="cf-properties-empty-text">
            Select a clip on the timeline
            to edit its properties.
          </div>
        </div>
      </aside>
    );
  }

  const { clip, track } = selected;

  const style = clip.style ?? {};

  /*
   * ----------------------------------------------------------
   * SAFE NUMBER
   * ----------------------------------------------------------
   */

  const numberValue = (
    value: string,
    fallback: number,
  ) => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  };

  /*
   * ----------------------------------------------------------
   * UPDATE CLIP
   * ----------------------------------------------------------
   */

  const updateClip = (
    updater: (current: typeof clip) => typeof clip,
  ) => {
    useEditorStore.setState((state) => ({
      timeline: {
        ...state.timeline,

        tracks: state.timeline.tracks.map(
          (currentTrack) =>
            currentTrack.id === track.id
              ? {
                  ...currentTrack,

                  clips: currentTrack.clips.map(
                    (currentClip) =>
                      currentClip.id === clip.id
                        ? updater(currentClip)
                        : currentClip,
                  ),
                }
              : currentTrack,
        ),
      },
    }));
  };

  /*
   * ----------------------------------------------------------
   * UPDATE STYLE
   * ----------------------------------------------------------
   */

  const updateStyle = (
    patch: Partial<NonNullable<typeof clip.style>>,
  ) => {
    updateClip((current) => ({
      ...current,

      style: {
        ...(current.style ?? {}),
        ...patch,
      },
    }));
  };

  /*
   * ----------------------------------------------------------
   * CLOSE
   * ----------------------------------------------------------
   */

  const closePanel = () => {
    selectClip(null, null);
  };

  /*
   * ----------------------------------------------------------
   * START
   * ----------------------------------------------------------
   */

  const handleStartChange = (
    value: string,
  ) => {
    const next = numberValue(
      value,
      clip.start,
    );

    if (!Number.isFinite(next)) {
      return;
    }

    moveClip(
      clip.id,
      track.id,
      Math.max(0, next),
    );
  };

  /*
   * ----------------------------------------------------------
   * DURATION
   * ----------------------------------------------------------
   */

  const handleDurationChange = (
    value: string,
  ) => {
    const next = numberValue(
      value,
      clip.duration,
    );

    if (!Number.isFinite(next)) {
      return;
    }

    const duration = Math.max(
      0.1,
      next,
    );

    resizeClip(
      clip.id,
      track.id,
      "right",
      clip.start + duration,
    );
  };

  /*
   * ----------------------------------------------------------
   * OPACITY
   * ----------------------------------------------------------
   */

  const opacityPercent = Math.round(
    (style.opacity ?? 1) * 100,
  );

  /*
   * ----------------------------------------------------------
   * RENDER
   * ----------------------------------------------------------
   */

  return (
    <aside className="cf-properties-panel">
      {/* HEADER */}
      <div className="cf-properties-header">
        <span>PROPERTIES</span>

        <button
          type="button"
          onClick={closePanel}
          title="Close"
          aria-label="Close properties"
        >
          ×
        </button>
      </div>

      {/* CONTENT */}
      <div className="cf-properties-scroll">
        {/* =====================================================
            CLIP
        ====================================================== */}

        <section className="cf-property-section">
          <div className="cf-property-section-title">
            CLIP
          </div>

          {/* NAME */}

          <div className="cf-property-row">
            <label>Name</label>

            <input
              type="text"
              value={clip.name}
              onChange={(event) => {
                updateClip((current) => ({
                  ...current,
                  name: event.target.value,
                }));
              }}
            />
          </div>

          {/* START + DURATION */}

          <div className="cf-property-grid">
            <div className="cf-property-field">
              <label>Start</label>

              <input
                type="number"
                min={0}
                step={0.01}
                value={clip.start}
                onChange={(event) =>
                  handleStartChange(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="cf-property-field">
              <label>Duration</label>

              <input
                type="number"
                min={0.1}
                step={0.01}
                value={clip.duration}
                onChange={(event) =>
                  handleDurationChange(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {/* TYPE */}

          <div className="cf-property-row">
            <label>Type</label>

            <div className="cf-property-readonly">
              {clip.type}
            </div>
          </div>

          {/* TRACK */}

          <div className="cf-property-row">
            <label>Track</label>

            <div className="cf-property-readonly">
              {track.name}
            </div>
          </div>
        </section>

        {/* =====================================================
            AUDIO
        ====================================================== */}

        {(clip.type === "video" ||
          clip.type === "audio") && (
          <section className="cf-property-section">
            <div className="cf-property-section-title">
              AUDIO
            </div>

            {/* VOLUME */}

            <div className="cf-property-row">
              <div className="cf-property-label-line">
                <label>Volume</label>

                <span>
                  {Math.round(
                    (clip.volume ?? 1) * 100,
                  )}
                  %
                </span>
              </div>

              <input
                className="cf-range"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={clip.volume ?? 1}
                onChange={(event) => {
                  const volume = numberValue(
                    event.target.value,
                    clip.volume ?? 1,
                  );

                  updateClip((current) => ({
                    ...current,

                    volume: Math.max(
                      0,
                      Math.min(1, volume),
                    ),
                  }));
                }}
              />
            </div>

            {/* SPEED */}
            <select
  className="cf-property-select"
  value={clip.speed ?? 1}
  onChange={(event) => {
    updateClip((current) => ({
      ...current,
      speed: Number(event.target.value),
    }));
  }}
>
  <option value={0.25}>0.25x</option>
  <option value={0.5}>0.5x</option>
  <option value={0.75}>0.75x</option>
  <option value={1}>1x</option>
  <option value={1.25}>1.25x</option>
  <option value={1.5}>1.5x</option>
  <option value={2}>2x</option>
  <option value={4}>4x</option>
</select>
          </section>
        )}

        {/* =====================================================
            TEXT
        ====================================================== */}

        {(clip.type === "caption" ||
          clip.type === "overlay") && (
          <section className="cf-property-section">
            <div className="cf-property-section-title">
              TEXT
            </div>

            {/* TEXT */}

            <div className="cf-property-row">
              <label>Text</label>

              <textarea
                value={clip.text ?? ""}
                onChange={(event) => {
                  updateClip((current) => ({
                    ...current,
                    text: event.target.value,
                  }));
                }}
                rows={3}
              />
            </div>

            {/* FONT */}

            <div className="cf-property-row">
              <label>Font</label>

              <select
                value={
                  style.fontFamily ??
                  "Inter"
                }
                onChange={(event) =>
                  updateStyle({
                    fontFamily:
                      event.target.value,
                  })
                }
              >
                <option value="Inter">
                  Inter
                </option>

                <option value="Montserrat">
                  Montserrat
                </option>

                <option value="Arial">
                  Arial
                </option>

                <option value="Roboto">
                  Roboto
                </option>

                <option value="Poppins">
                  Poppins
                </option>
              </select>
            </div>

            {/* SIZE + WEIGHT */}

            <div className="cf-property-grid">
              <div className="cf-property-field">
                <label>Size</label>

                <input
                  type="number"
                  min={8}
                  max={200}
                  value={
                    style.fontSize ?? 34
                  }
                  onChange={(event) => {
                    const value =
                      numberValue(
                        event.target.value,
                        style.fontSize ?? 34,
                      );

                    updateStyle({
                      fontSize: Math.max(
                        8,
                        Math.min(200, value),
                      ),
                    });
                  }}
                />
              </div>

              <div className="cf-property-field">
                <label>Weight</label>

                <select
                  value={String(
                    style.fontWeight ?? 700,
                  )}
                  onChange={(event) => {
                    updateStyle({
                      fontWeight:
                        Number(
                          event.target.value,
                        ),
                    });
                  }}
                >
                  <option value="400">
                    Regular
                  </option>

                  <option value="500">
                    Medium
                  </option>

                  <option value="600">
                    Semibold
                  </option>

                  <option value="700">
                    Bold
                  </option>

                  <option value="800">
                    ExtraBold
                  </option>
                </select>
              </div>
            </div>

            {/* ALIGNMENT */}

            <div className="cf-property-row">
              <label>Alignment</label>

              <div className="cf-segmented">
                {(
                  [
                    "left",
                    "center",
                    "right",
                  ] as const
                ).map((align) => (
                  <button
                    key={align}
                    type="button"
                    className={
                      style.align === align
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      updateStyle({
                        align,
                      })
                    }
                  >
                    {align === "left"
                      ? "L"
                      : align === "center"
                        ? "C"
                        : "R"}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            TRANSFORM
        ====================================================== */}

        <section className="cf-property-section">
          <div className="cf-property-section-title">
            TRANSFORM
          </div>

          {/* OPACITY + SCALE */}

          <div className="cf-property-grid">
            <div className="cf-property-field">
              <label>Opacity</label>

              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={opacityPercent}
                onChange={(event) => {
                  const value =
                    numberValue(
                      event.target.value,
                      opacityPercent,
                    );

                  const opacity =
                    Math.max(
                      0,
                      Math.min(
                        100,
                        value,
                      ),
                    ) / 100;

                  updateStyle({
                    opacity,
                  });
                }}
              />
            </div>

            <div className="cf-property-field">
              <label>Scale</label>

              <input
                type="number"
                min={0.1}
                max={10}
                step={0.01}
                value={
                  style.scale ?? 1
                }
                onChange={(event) => {
                  const value =
                    numberValue(
                      event.target.value,
                      style.scale ?? 1,
                    );

                  updateStyle({
                    scale: Math.max(
                      0.1,
                      Math.min(
                        10,
                        value,
                      ),
                    ),
                  });
                }}
              />
            </div>
          </div>

          {/* POSITION */}

          <div className="cf-property-grid">
            <div className="cf-property-field">
              <label>Position X</label>

              <input
                type="number"
                step={1}
                value={
                  style.positionX ?? 0
                }
                onChange={(event) => {
                  const value =
                    numberValue(
                      event.target.value,
                      style.positionX ?? 0,
                    );

                  updateStyle({
                    positionX: value,
                  });
                }}
              />
            </div>

            <div className="cf-property-field">
              <label>Position Y</label>

              <input
                type="number"
                step={1}
                value={
                  style.positionY ?? 0
                }
                onChange={(event) => {
                  const value =
                    numberValue(
                      event.target.value,
                      style.positionY ?? 0,
                    );

                  updateStyle({
                    positionY: value,
                  });
                }}
              />
            </div>
          </div>

          {/* ROTATION */}

          <div className="cf-property-row">
            <label>Rotation</label>

            <input
              type="number"
              min={-360}
              max={360}
              step={1}
              value={
                style.rotation ?? 0
              }
              onChange={(event) => {
                const value =
                  numberValue(
                    event.target.value,
                    style.rotation ?? 0,
                  );

                updateStyle({
                  rotation: Math.max(
                    -360,
                    Math.min(
                      360,
                      value,
                    ),
                  ),
                });
              }}
            />
          </div>
        </section>

        {/* =====================================================
            TRACK
        ====================================================== */}

        <section className="cf-property-section">
          <div className="cf-property-section-title">
            TRACK
          </div>

          {/* TRACK NAME */}

          <div className="cf-property-row">
            <label>Track name</label>

            <input
              type="text"
              value={track.name}
              onChange={(event) => {
                renameTrack(
                  track.id,
                  event.target.value,
                );
              }}
            />
          </div>

          {/* STATUS */}

          <div className="cf-track-status">
            <span
              className={
                track.locked
                  ? "status-off"
                  : "status-on"
              }
            >
              {track.locked
                ? "LOCKED"
                : "EDITABLE"}
            </span>

            <span
              className={
                track.visible
                  ? "status-on"
                  : "status-off"
              }
            >
              {track.visible
                ? "VISIBLE"
                : "HIDDEN"}
            </span>
          </div>
        </section>
      </div>
    </aside>
  );
}
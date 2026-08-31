/**
 * Controlled mobile/desktop toggle used above a live preview frame. Extracted
 * from ApplicationPreview.tsx so other preview surfaces (e.g. Trips) can
 * reuse the exact same markup/behavior instead of duplicating it.
 *
 * Purely presentational — it holds no state of its own. The caller owns
 * `mode` and re-renders with the new value from `onMode`.
 */
export function DeviceToggle({
  mode,
  onMode,
}: {
  mode: "mobile" | "desktop";
  onMode: (mode: "mobile" | "desktop") => void;
}) {
  return (
    <div className="device-toggle" role="group" aria-label="Preview device">
      <button
        type="button"
        className={mode === "desktop" ? "on" : ""}
        onClick={() => onMode("desktop")}
      >
        Desktop
      </button>
      <button
        type="button"
        className={mode === "mobile" ? "on" : ""}
        onClick={() => onMode("mobile")}
      >
        Mobile
      </button>
    </div>
  );
}

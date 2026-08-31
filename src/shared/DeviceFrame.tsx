import type { ReactNode } from "react";

/**
 * Device chrome wrappers extracted from ApplicationPreview.tsx. These are
 * purely cosmetic frames — content-agnostic, they just lay `children` inside
 * a monitor or phone chassis. Styling lives in
 * src/styles/application-preview.css (`.monitor-*` / `.phone-*` rules),
 * which is imported globally so any consumer gets correct styling for free.
 */
export function MonitorDevice({ children }: { children: ReactNode }) {
  return (
    <div className="monitor-stage">
      <div className="monitor-device">
        <div className="monitor-chassis">
          <div className="monitor-screen">{children}</div>
        </div>
        <div className="monitor-neck" aria-hidden="true" />
        <div className="monitor-base" aria-hidden="true" />
      </div>
    </div>
  );
}

export function PhoneDevice({ children }: { children: ReactNode }) {
  return (
    <div className="phone-stage">
      <div className="phone-device">
        <span className="phone-btn silent" aria-hidden="true" />
        <span className="phone-btn vol-up" aria-hidden="true" />
        <span className="phone-btn vol-down" aria-hidden="true" />
        <span className="phone-btn power" aria-hidden="true" />
        <div className="phone-chassis">
          <div className="phone-island" aria-hidden="true" />
          <div className="phone-screen">
            <div className="phone-status-bar" aria-hidden="true">
              <span className="phone-status-time">9:41</span>
              <span className="phone-status-glyphs">
                <svg
                  className="phone-status-signal"
                  viewBox="0 0 18 12"
                  width="18"
                  height="12"
                >
                  <rect x="0" y="7" width="3" height="5" rx="0.5" fill="currentColor" />
                  <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" />
                  <rect x="10" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
                  <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
                </svg>
                <svg
                  className="phone-status-wifi"
                  viewBox="0 0 16 12"
                  width="16"
                  height="12"
                >
                  <path
                    d="M8 10.5a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6zM4.7 7a4.7 4.7 0 016.6 0M2 4.3a8.4 8.4 0 0112 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="phone-status-battery">
                  <span className="phone-status-battery-shell">
                    <span className="phone-status-battery-fill" />
                  </span>
                  <span className="phone-status-battery-cap" />
                </span>
              </span>
            </div>
            {children}
          </div>
          <div className="phone-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience switcher: picks the phone or monitor chrome based on `mode`.
 * Callers that already branch on mode for other reasons (like
 * ApplicationPreview, which needs `mode` for its own content logic too) can
 * keep using MonitorDevice/PhoneDevice directly instead.
 */
export function DeviceFrame({
  mode,
  children,
}: {
  mode: "mobile" | "desktop";
  children: ReactNode;
}) {
  return mode === "mobile" ? (
    <PhoneDevice>{children}</PhoneDevice>
  ) : (
    <MonitorDevice>{children}</MonitorDevice>
  );
}

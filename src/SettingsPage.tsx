import { Link } from "react-router-dom";
import { PROFILE } from "./profile";

export function SettingsPage() {
  return (
    <div className="app-shell">
      <header className="jobs-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Placeholder account details. Sign-in is not wired up yet.
          </p>
        </div>
      </header>
      <div className="card">
        <p className="lab">Name</p>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          {PROFILE.name}
        </p>
        <p className="lab">Email</p>
        <p className="page-sub" style={{ marginBottom: 0 }}>
          {PROFILE.email}
        </p>
        <p style={{ marginTop: 20, marginBottom: 0 }}>
          <Link to="/" className="back-link">
            ← Jobs
          </Link>
        </p>
      </div>
    </div>
  );
}

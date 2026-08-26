import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { jobsNavActive } from "./jobsNavActive";
import { PROFILE, truncateEmail } from "./profile";
import { Stepper } from "./Stepper";
import {
  loadSidenavCollapsed,
  saveSidenavCollapsed,
  sidenavToggleLabel,
} from "./sidenavPref";
import {
  wizardBackAriaLabel,
  wizardBackTo,
  wizardTitle,
} from "./wizardHeader";

export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(loadSidenavCollapsed);
  const [profileOpen, setProfileOpen] = useState(false);
  const jobsOn = jobsNavActive(pathname);
  const isWizard =
    pathname.startsWith("/create-job") ||
    pathname.startsWith("/step-2") ||
    pathname.startsWith("/step-3");
  const step = pathname.startsWith("/step-3")
    ? 3
    : pathname.startsWith("/step-2")
      ? 2
      : 1;

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (collapsed) setProfileOpen(false);
  }, [collapsed]);

  function toggleSidenav() {
    setCollapsed((current) => {
      const next = !current;
      saveSidenavCollapsed(next);
      return next;
    });
  }

  const label = sidenavToggleLabel(collapsed);

  return (
    <div className={`layout${collapsed ? " sidenav-collapsed" : ""}`}>
      <aside
        id="workspace-sidenav"
        className="sidenav"
        aria-label="Workspace"
      >
        <div className="sidenav-profile-block">
          <div className="sidenav-profile">
            <button
              type="button"
              className="sidenav-profile-btn"
              aria-expanded={profileOpen}
              aria-controls="sidenav-profile-panel"
              aria-label={collapsed ? PROFILE.name : undefined}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="sidenav-avatar" aria-hidden="true">
                {PROFILE.initials}
              </span>
              <span className="sidenav-profile-text">
                <span className="sidenav-profile-name">
                  {PROFILE.name}
                  <span
                    className={`sidenav-profile-caret${profileOpen ? " open" : ""}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </span>
                <span className="sidenav-profile-email">
                  {truncateEmail(PROFILE.email)}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="sidenav-toggle"
              aria-label={label}
              aria-expanded={!collapsed}
              aria-controls="workspace-sidenav"
              title={label}
              onClick={toggleSidenav}
            >
              <SidebarIcon />
            </button>
          </div>
          {profileOpen ? (
            <div id="sidenav-profile-panel" className="sidenav-profile-panel">
              <p className="sidenav-profile-panel-name">{PROFILE.name}</p>
              <p className="sidenav-profile-panel-email">{PROFILE.email}</p>
              <Link to="/settings" className="sidenav-profile-settings">
                Settings
              </Link>
            </div>
          ) : null}
        </div>
        <nav className="sidenav-nav">
          <NavLink
            to="/"
            className={() => `sidenav-item${jobsOn ? " on" : ""}`}
          >
            <BriefcaseIcon />
            <span className={collapsed ? "sr-only" : undefined}>Jobs</span>
          </NavLink>
        </nav>
      </aside>
      <div className="layout-main">
        {isWizard ? (
          <header className="wizard-header">
            <div className="wizard-header-inner">
              <div className="wizard-header-title">
                <Link
                  to={wizardBackTo(step)}
                  className="back-link"
                  aria-label={wizardBackAriaLabel(step)}
                >
                  <BackArrowIcon />
                </Link>
                <h1 className="page-title">{wizardTitle(step)}</h1>
              </div>
              <Stepper current={step} />
            </div>
          </header>
        ) : null}
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 10H5M9.25 5.75 4.5 10l4.75 4.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="2"
        width="13"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M6 2v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="5.5"
        width="13"
        height="8.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 5.5V4.2C6 3.5 6.5 3 7.2 3h1.6C9.5 3 10 3.5 10 4.2v1.3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M1.5 9h13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

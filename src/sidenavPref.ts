export const SIDENAV_COLLAPSED_KEY = "cp.sidenavCollapsed.v1";

export function loadSidenavCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDENAV_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSidenavCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDENAV_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // Private mode / blocked storage should not break the shell.
  }
}

export function sidenavToggleLabel(collapsed: boolean): string {
  return collapsed ? "Open sidebar" : "Collapse sidebar";
}

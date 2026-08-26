import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import {
  SIDENAV_COLLAPSED_KEY,
  loadSidenavCollapsed,
  saveSidenavCollapsed,
  sidenavToggleLabel,
} from "./sidenavPref";

const mem = new Map<string, string>();

beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    },
  });
});

describe("sidenavPref", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts expanded when nothing is stored", () => {
    expect(loadSidenavCollapsed()).toBe(false);
  });

  it("round-trips collapsed state", () => {
    saveSidenavCollapsed(true);
    expect(localStorage.getItem(SIDENAV_COLLAPSED_KEY)).toBe("1");
    expect(loadSidenavCollapsed()).toBe(true);

    saveSidenavCollapsed(false);
    expect(loadSidenavCollapsed()).toBe(false);
  });

  it("treats unknown stored values as expanded", () => {
    localStorage.setItem(SIDENAV_COLLAPSED_KEY, "maybe");
    expect(loadSidenavCollapsed()).toBe(false);
  });
});

describe("sidenavToggleLabel", () => {
  it("names the action for the current state", () => {
    expect(sidenavToggleLabel(false)).toBe("Collapse sidebar");
    expect(sidenavToggleLabel(true)).toBe("Open sidebar");
  });
});

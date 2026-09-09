import { memoryStorage } from "./memoryStore";

/** Only remove this prototype's data, never other apps sharing the origin. */
export function resetPrototypeOnRefresh(
  enabled: boolean,
  navigationType: string | undefined,
  stores: Array<Storage | null>,
): boolean {
  if (!enabled || navigationType !== "reload") return false;
  memoryStorage.clear();
  for (const storage of stores) {
    if (!storage) continue;
    try {
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
      for (const key of keys) if (key?.startsWith("cp.")) storage.removeItem(key);
    } catch { /* Storage can be unavailable in restricted browser contexts. */ }
  }
  return true;
}

export function browserStorage(kind: "localStorage" | "sessionStorage"): Storage | null {
  try { return window[kind]; } catch { return null; }
}

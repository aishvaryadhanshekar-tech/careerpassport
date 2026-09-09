const store = new Map<string, string>();
// Keep the existing store API while surviving refreshes within a browser session.
const prefix = 'cp.session.';
function session(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; }
}

export const memoryStorage = {
  getItem(key: string): string | null {
    return store.get(key) ?? session()?.getItem(prefix + key) ?? null;
  },
  setItem(key: string, value: string): void {
    store.set(key, value);
    try { session()?.setItem(prefix + key, value); } catch { /* retain memory fallback */ }
  },
  removeItem(key: string): void {
    store.delete(key);
    session()?.removeItem(prefix + key);
  },
  clear(): void {
    store.clear();
    const storage = session();
    if (storage) Object.keys(storage).filter(key => key.startsWith(prefix)).forEach(key => storage.removeItem(key));
  },
};

/** Storage boundary: replace this adapter with an API-backed implementation later. */
export interface Repository<T extends { id: string }> {
  get(id: string): T | null;
  put(value: T): void;
  list(): T[];
  subscribe(listener: () => void): () => void;
}

export function createRepository<T extends { id: string }>(storage: Storage, namespace: string): Repository<T> {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  const read = (key: string): T | null => {
    const raw = storage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  };
  return {
    get: id => read(`${namespace}${id}`),
    put: value => { storage.setItem(`${namespace}${value.id}`, JSON.stringify(value)); notify(); },
    list: () => Array.from({ length: storage.length }, (_, i) => storage.key(i))
      .filter((key): key is string => key !== null && key.startsWith(namespace))
      .map(read).filter((value): value is T => value !== null),
    subscribe: listener => {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => { if (event.key?.startsWith(namespace)) listener(); };
      if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => { listeners.delete(listener); if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
    },
  };
}

/**
 * localStorage wrapper that never throws.
 * Storage can be missing (SSR, tests) or throw SecurityError / QuotaExceededError
 * (blocked site data, private mode, full quota).
 */
function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' && localStorage ? localStorage : null;
  } catch {
    return null;
  }
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      return storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      const s = storage();
      if (!s) return false;
      s.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    try {
      storage()?.removeItem(key);
    } catch { /* noop */ }
  },
  getJson<T>(key: string, fallback: T): T {
    const raw = safeStorage.get(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  setJson(key: string, value: unknown): boolean {
    try {
      return safeStorage.set(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};

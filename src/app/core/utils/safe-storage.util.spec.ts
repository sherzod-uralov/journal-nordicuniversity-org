import { safeStorage } from './safe-storage.util';

/** Node 26 leaves `localStorage` undefined in the jsdom test env, so every test stubs its own. */
class MemoryStorage {
  private readonly items = new Map<string, string>();
  get length() { return this.items.size; }
  key(i: number) { return [...this.items.keys()][i] ?? null; }
  getItem(k: string) { return this.items.get(k) ?? null; }
  setItem(k: string, v: string) { this.items.set(k, String(v)); }
  removeItem(k: string) { this.items.delete(k); }
  clear() { this.items.clear(); }
}

const throwing = (name: string) => () => {
  throw new DOMException('storage error', name);
};

describe('safeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('with working storage', () => {
    let storage: MemoryStorage;
    beforeEach(() => {
      storage = new MemoryStorage();
      vi.stubGlobal('localStorage', storage);
    });

    it('reads, writes and removes values', () => {
      expect(safeStorage.get('k')).toBeNull();
      expect(safeStorage.set('k', 'v')).toBe(true);
      expect(storage.getItem('k')).toBe('v');
      expect(safeStorage.get('k')).toBe('v');
      safeStorage.remove('k');
      expect(safeStorage.get('k')).toBeNull();
    });

    it('round-trips JSON and falls back on missing or corrupt values', () => {
      expect(safeStorage.setJson('obj', { a: 1 })).toBe(true);
      expect(safeStorage.getJson('obj', null)).toEqual({ a: 1 });
      expect(safeStorage.getJson('missing', 'fallback')).toBe('fallback');
      storage.setItem('bad', '{not json');
      expect(safeStorage.getJson('bad', 42)).toBe(42);
    });

    it('setJson returns false for values JSON.stringify cannot serialize', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      expect(safeStorage.setJson('c', circular)).toBe(false);
    });
  });

  it('returns null / false instead of throwing when storage methods throw', () => {
    vi.stubGlobal('localStorage', {
      getItem: throwing('SecurityError'),
      setItem: throwing('QuotaExceededError'),
      removeItem: throwing('SecurityError'),
    });

    expect(safeStorage.get('k')).toBeNull();
    expect(safeStorage.set('k', 'v')).toBe(false);
    expect(() => safeStorage.remove('k')).not.toThrow();
    expect(safeStorage.getJson('k', 'fallback')).toBe('fallback');
    expect(safeStorage.setJson('k', { a: 1 })).toBe(false);
  });

  it('returns null / false when accessing localStorage itself throws (blocked site data)', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: throwing('SecurityError'),
    });
    try {
      expect(safeStorage.get('k')).toBeNull();
      expect(safeStorage.set('k', 'v')).toBe(false);
      expect(() => safeStorage.remove('k')).not.toThrow();
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it('returns null / false when localStorage is missing (SSR)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(safeStorage.get('k')).toBeNull();
    expect(safeStorage.set('k', 'v')).toBe(false);
  });
});

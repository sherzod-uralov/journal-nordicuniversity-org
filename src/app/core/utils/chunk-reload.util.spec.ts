import { EnvironmentInjector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationError } from '@angular/router';
import { reloadOnChunkLoadError } from './chunk-reload.util';

const KEY = 'chunk_reload_at';
let navCounter = 0;

/**
 * jsdom can't do real navigations, but hash-only ones work — so the fake Location maps the
 * target URL to a unique fragment and `window.location.hash` tells whether a reload happened.
 */
function setup(platform: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platform },
      { provide: Location, useValue: { prepareExternalUrl: (url: string) => `#reload-${++navCounter}${url}` } },
    ],
  });
  const injector = TestBed.inject(EnvironmentInjector);
  return (error: unknown, url = '/articles') => {
    const before = window.location.hash;
    runInInjectionContext(injector, () => reloadOnChunkLoadError(new NavigationError(1, url, error)));
    return window.location.hash !== before;
  };
}

describe('reloadOnChunkLoadError', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it.each([
    new TypeError('Failed to fetch dynamically imported module: https://x/chunk-ABC.js'),
    new TypeError('Importing a module script failed.'),
    new TypeError('error loading dynamically imported module'),
    new Error('Loading chunk 123 failed.'),
    Object.assign(new Error('boom'), { name: 'ChunkLoadError' }),
    'Failed to fetch dynamically imported module',
  ])('reloads to the target URL on a chunk load error (%s)', (error) => {
    const navigate = setup();
    expect(navigate(error, '/volumes/5')).toBe(true);
    expect(window.location.hash).toMatch(/\/volumes\/5$/);
    expect(Number(sessionStorage.getItem(KEY))).toBeGreaterThan(0);
  });

  it.each([new Error('Http failure response for /api: 500'), new Error('NG04002: Cannot match any routes'), null, undefined])(
    'ignores unrelated errors (%s)',
    (error) => {
      const navigate = setup();
      expect(navigate(error)).toBe(false);
      expect(sessionStorage.getItem(KEY)).toBeNull();
    },
  );

  it('does not reload a second time within the guard window (reload loop)', () => {
    const navigate = setup();
    const err = new TypeError('Failed to fetch dynamically imported module');
    expect(navigate(err)).toBe(true);
    expect(navigate(err)).toBe(false);
  });

  it('reloads again once the guard window has passed', () => {
    const navigate = setup();
    sessionStorage.setItem(KEY, String(Date.now() - 60_000));
    expect(navigate(new TypeError('Failed to fetch dynamically imported module'))).toBe(true);
  });

  it('does not reload when sessionStorage is unavailable (no loop guard possible)', () => {
    const navigate = setup();
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked });
    expect(navigate(new TypeError('Failed to fetch dynamically imported module'))).toBe(false);
  });

  it('does nothing on the server', () => {
    const navigate = setup('server');
    expect(navigate(new TypeError('Failed to fetch dynamically imported module'))).toBe(false);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
});

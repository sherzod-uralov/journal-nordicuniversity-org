import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { NavigationError } from '@angular/router';

/** Messages browsers/bundlers use when a lazy chunk can't be loaded (typically after a deploy). */
const CHUNK_LOAD_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|ChunkLoadError/i;
const RELOAD_AT_KEY = 'chunk_reload_at';
/** A second chunk failure within this window is treated as a reload loop and ignored. */
const RELOAD_GUARD_MS = 10_000;

/**
 * Router navigation error handler (withNavigationErrorHandler): when a lazy route chunk
 * fails to load, do a one-time full reload to the target URL so the new build is fetched.
 * Browser only; must run in an injection context.
 */
export function reloadOnChunkLoadError(event: NavigationError): void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
  const location = inject(Location);

  const error = event.error as { message?: unknown; name?: unknown } | null | undefined;
  const message = `${error?.name ?? ''} ${error?.message ?? error ?? ''}`;
  if (!CHUNK_LOAD_ERROR.test(message)) return;

  try {
    const lastReloadAt = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0);
    if (Date.now() - lastReloadAt < RELOAD_GUARD_MS) return;
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    // Without storage we can't guard against reload loops, so don't reload.
    return;
  }

  window.location.assign(location.prepareExternalUrl(event.url));
}

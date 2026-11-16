import { HttpErrorResponse } from '@angular/common/http';

/** True when the API reports that the requested entity doesn't exist. */
export function isNotFoundError(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 404;
}

export function errorMessage(err: unknown): string {
  return (err as { message?: string } | null)?.message || 'Request failed';
}

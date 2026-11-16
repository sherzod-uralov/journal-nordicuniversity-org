import { isCompletePhone } from '@shared/data/countries';

/**
 * Shared validation for the login, register and profile forms.
 * Every function returns an i18n key (shown inline) or null when valid.
 */

export const PASSWORD_MIN_LENGTH = 6;

export type AuthorFormField =
  | 'phone'
  | 'password'
  | 'full_name'
  | 'science_degree'
  | 'job'
  | 'place_position'
  | 'birthday';

export type AuthorFormErrors = Partial<Record<AuthorFormField, string>>;

export function phoneError(phone: string | null | undefined): string | null {
  if (!(phone ?? '').trim()) return 'validation.phone_required';
  return isCompletePhone(phone) ? null : 'validation.phone_invalid';
}

/**
 * `required: false` → an empty password is fine (profile: keep the current one).
 * `checkLength: false` → only presence is checked (login: accounts created before the
 * minimum was enforced may still have shorter passwords and must be able to sign in).
 */
export function passwordError(
  password: string | null | undefined,
  { required = true, checkLength = true }: { required?: boolean; checkLength?: boolean } = {},
): string | null {
  const value = password ?? '';
  if (!value.trim()) return required ? 'validation.password_required' : null;
  if (checkLength && value.length < PASSWORD_MIN_LENGTH) return 'validation.password_min';
  return null;
}

export function requiredError(value: string | Date | null | undefined): string | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? 'validation.required' : null;
  return (value ?? '').trim() ? null : 'validation.required';
}

export interface AuthorFormValue {
  phone: string;
  password: string;
  full_name: string;
  science_degree: string;
  job: string;
  place_position: string;
  birthday: Date | null;
}

/**
 * Register: everything starred is required (incl. password and birthday).
 * Profile: password is optional (change only), birthday may be cleared.
 */
export function validateAuthorForm(
  value: AuthorFormValue,
  { mode }: { mode: 'register' | 'profile' },
): AuthorFormErrors {
  const errors: AuthorFormErrors = {
    phone: phoneError(value.phone) ?? undefined,
    password: passwordError(value.password, { required: mode === 'register' }) ?? undefined,
    full_name: requiredError(value.full_name) ?? undefined,
    science_degree: requiredError(value.science_degree) ?? undefined,
    job: requiredError(value.job) ?? undefined,
    place_position: requiredError(value.place_position) ?? undefined,
    birthday: mode === 'register' ? requiredError(value.birthday) ?? undefined : undefined,
  };
  return compact(errors);
}

export function validateLoginForm(value: { phone: string; password: string }): AuthorFormErrors {
  return compact({
    phone: phoneError(value.phone) ?? undefined,
    password: passwordError(value.password, { checkLength: false }) ?? undefined,
  });
}

export function hasErrors(errors: AuthorFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Returns `errors` without `field` (same object when there was nothing to remove). */
export function withoutError(errors: AuthorFormErrors, field: AuthorFormField): AuthorFormErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

function compact(errors: AuthorFormErrors): AuthorFormErrors {
  const out: AuthorFormErrors = {};
  for (const [key, msg] of Object.entries(errors) as [AuthorFormField, string | undefined][]) {
    if (msg) out[key] = msg;
  }
  return out;
}

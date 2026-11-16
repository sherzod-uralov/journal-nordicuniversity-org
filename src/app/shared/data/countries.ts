import { countries } from 'country-codes-flags-phone-codes';

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const ALL_COUNTRIES: CountryCode[] = (countries as CountryCode[])
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY = ALL_COUNTRIES.find(c => c.code === 'UZ')!;

/** E.164: at most 15 digits including the country code. */
const E164_MAX_DIGITS = 15;
/** Shortest national number we accept when the country has no explicit rule. */
const FALLBACK_MIN_LOCAL_DIGITS = 6;

/**
 * National (local) number length per ISO country code, for the countries we see most.
 * Others fall back to the E.164 cap (15 digits minus the dial code).
 */
const LOCAL_LENGTHS: Record<string, { min: number; max: number }> = {
  UZ: { min: 9, max: 9 },
  KZ: { min: 10, max: 10 },
  RU: { min: 10, max: 10 },
  KG: { min: 9, max: 9 },
  TJ: { min: 9, max: 9 },
  TM: { min: 8, max: 8 },
  AF: { min: 9, max: 9 },
  AZ: { min: 9, max: 9 },
  BY: { min: 9, max: 9 },
  UA: { min: 9, max: 9 },
  GE: { min: 9, max: 9 },
  AM: { min: 8, max: 8 },
  MN: { min: 8, max: 8 },
  TR: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 9, max: 10 },
  IN: { min: 10, max: 10 },
  PK: { min: 10, max: 10 },
  IR: { min: 10, max: 10 },
  CN: { min: 10, max: 11 },
  KR: { min: 9, max: 10 },
  JP: { min: 9, max: 10 },
  FR: { min: 9, max: 9 },
  ES: { min: 9, max: 9 },
  PL: { min: 9, max: 9 },
  SA: { min: 9, max: 9 },
  AE: { min: 8, max: 9 },
  EG: { min: 10, max: 10 },
};

function dialDigits(country: CountryCode): number {
  return country.dialCode.replace(/\D/g, '').length;
}

/** Allowed local-digit range for a country (per-country rule, else E.164 fallback). */
export function phoneLocalLength(country: CountryCode): { min: number; max: number } {
  const rule = LOCAL_LENGTHS[country.code];
  if (rule) return rule;
  const max = Math.max(E164_MAX_DIGITS - dialDigits(country), 1);
  return { min: Math.min(FALLBACK_MIN_LOCAL_DIGITS, max), max };
}

/** Finds the country whose dial code prefixes `phone` (longest match wins, e.g. +1242 over +1). */
export function findCountryByPhone(phone: string, preferred?: CountryCode): CountryCode | null {
  if (!phone.startsWith('+')) return null;
  if (preferred && phone.startsWith(preferred.dialCode)) {
    const longer = ALL_COUNTRIES.some(c => c.dialCode.length > preferred.dialCode.length && phone.startsWith(c.dialCode));
    if (!longer) return preferred;
  }
  let best: CountryCode | null = null;
  for (const c of ALL_COUNTRIES) {
    if (phone.startsWith(c.dialCode) && (!best || c.dialCode.length > best.dialCode.length)) {
      best = c;
    }
  }
  return best;
}

/** True when `phone` is `+<dial code><local digits>` with a valid local length. */
export function isCompletePhone(phone: string | null | undefined): boolean {
  const value = (phone ?? '').trim();
  if (!/^\+\d+$/.test(value) || value.length - 1 > E164_MAX_DIGITS) return false;
  const country = findCountryByPhone(value);
  if (!country) return false;
  const local = value.length - 1 - dialDigits(country);
  const { min, max } = phoneLocalLength(country);
  return local >= min && local <= max;
}

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

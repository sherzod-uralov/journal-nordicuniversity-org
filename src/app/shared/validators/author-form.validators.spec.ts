import {
  AuthorFormValue,
  hasErrors,
  passwordError,
  phoneError,
  requiredError,
  validateAuthorForm,
  validateLoginForm,
  withoutError,
} from './author-form.validators';

const validForm: AuthorFormValue = {
  phone: '+998901234567',
  password: 'secret1',
  full_name: 'John Doe',
  science_degree: 'PhD',
  job: 'University',
  place_position: 'Professor',
  birthday: new Date(1990, 0, 1),
};

describe('author-form validators', () => {
  describe('passwordError', () => {
    it('requires a password by default (whitespace counts as empty)', () => {
      expect(passwordError('')).toBe('validation.password_required');
      expect(passwordError(null)).toBe('validation.password_required');
      expect(passwordError('   ')).toBe('validation.password_required');
    });

    it('enforces the 6-character minimum', () => {
      expect(passwordError('12345')).toBe('validation.password_min');
      expect(passwordError('123456')).toBeNull();
    });

    it('allows an empty password when not required (profile)', () => {
      expect(passwordError('', { required: false })).toBeNull();
      expect(passwordError('123', { required: false })).toBe('validation.password_min');
    });

    it('skips the length check for login (legacy short passwords)', () => {
      expect(passwordError('123', { checkLength: false })).toBeNull();
      expect(passwordError('', { checkLength: false })).toBe('validation.password_required');
    });
  });

  describe('phoneError', () => {
    it('requires a phone', () => {
      expect(phoneError('')).toBe('validation.phone_required');
      expect(phoneError(null)).toBe('validation.phone_required');
      expect(phoneError('  ')).toBe('validation.phone_required');
    });

    it('accepts a complete Uzbek number', () => {
      expect(phoneError('+998901234567')).toBeNull();
    });

    it('rejects incomplete, too long or malformed numbers', () => {
      expect(phoneError('+99890123')).toBe('validation.phone_invalid');
      expect(phoneError('+9989012345678')).toBe('validation.phone_invalid');
      expect(phoneError('998901234567')).toBe('validation.phone_invalid');
      expect(phoneError('+998 90 123 45 67')).toBe('validation.phone_invalid');
      expect(phoneError('+99890abc4567')).toBe('validation.phone_invalid');
    });
  });

  describe('requiredError', () => {
    it('flags empty / whitespace strings and invalid dates', () => {
      expect(requiredError('')).toBe('validation.required');
      expect(requiredError('  ')).toBe('validation.required');
      expect(requiredError(null)).toBe('validation.required');
      expect(requiredError(undefined)).toBe('validation.required');
      expect(requiredError(new Date('invalid'))).toBe('validation.required');
    });

    it('accepts non-empty strings and valid dates', () => {
      expect(requiredError('x')).toBeNull();
      expect(requiredError(new Date(2000, 0, 1))).toBeNull();
    });
  });

  describe('validateAuthorForm', () => {
    it('returns no errors for a valid register form', () => {
      expect(validateAuthorForm(validForm, { mode: 'register' })).toEqual({});
    });

    it('register: password and birthday are required', () => {
      const errors = validateAuthorForm({ ...validForm, password: '', birthday: null }, { mode: 'register' });
      expect(errors).toEqual({ password: 'validation.password_required', birthday: 'validation.required' });
      expect(hasErrors(errors)).toBe(true);
    });

    it('profile: password and birthday are optional, but a short new password is rejected', () => {
      expect(validateAuthorForm({ ...validForm, password: '', birthday: null }, { mode: 'profile' })).toEqual({});
      expect(validateAuthorForm({ ...validForm, password: '123' }, { mode: 'profile' })).toEqual({
        password: 'validation.password_min',
      });
    });

    it('flags every empty required text field', () => {
      const errors = validateAuthorForm(
        { ...validForm, full_name: ' ', science_degree: '', job: '', place_position: '' },
        { mode: 'profile' },
      );
      expect(Object.keys(errors).sort()).toEqual(['full_name', 'job', 'place_position', 'science_degree']);
    });
  });

  describe('validateLoginForm', () => {
    it('only checks presence of the password', () => {
      expect(validateLoginForm({ phone: '+998901234567', password: '1' })).toEqual({});
      expect(validateLoginForm({ phone: '', password: '' })).toEqual({
        phone: 'validation.phone_required',
        password: 'validation.password_required',
      });
    });
  });

  describe('withoutError / hasErrors', () => {
    it('removes a single field and returns the same object when nothing changes', () => {
      const errors = { phone: 'x', password: 'y' };
      expect(withoutError(errors, 'phone')).toEqual({ password: 'y' });
      expect(withoutError(errors, 'job')).toBe(errors);
      expect(hasErrors({})).toBe(false);
    });
  });
});

/**
 * Validation utilities for phone numbers and email addresses.
 */

// RFC 5322 compliant email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Phone characters allowed: digits, spaces, dashes, parentheses, and leading '+'
const PHONE_CHARS_REGEX = /^\+?[0-9\s\-()]+$/;

/**
 * Checks if an email string is well-formed.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates an email field and returns a user-friendly error message, or null if valid.
 */
export function validateEmail(email?: string | null, required: boolean = false): string | null {
  const value = (email || '').trim();
  if (!value) {
    return required ? 'Email address is required.' : null;
  }
  if (!EMAIL_REGEX.test(value)) {
    return 'Please enter a valid email address (e.g., name@domain.com).';
  }
  return null;
}

/**
 * Checks if a phone number consists only of valid phone characters and has 7-15 digits.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!PHONE_CHARS_REGEX.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Validates a phone field and returns a user-friendly error message, or null if valid.
 */
export function validatePhone(phone?: string | null, required: boolean = false): string | null {
  const value = (phone || '').trim();
  if (!value) {
    return required ? 'Phone number is required.' : null;
  }

  // Check for invalid characters (letters, symbols)
  if (!PHONE_CHARS_REGEX.test(value)) {
    return 'Phone number can only contain digits, spaces, hyphens, and an optional leading "+".';
  }

  // Count total digits
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7) {
    return 'Phone number is too short (minimum 7 digits required).';
  }
  if (digits.length > 15) {
    return 'Phone number is too long (maximum 15 digits allowed).';
  }

  return null;
}


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
 * Checks if a phone number consists only of valid phone characters and respects digit limits:
 * - Max 10 digits when starting with 09
 * - Max 12 digits when starting with 251
 * - 7 to 15 digits for general international numbers
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!PHONE_CHARS_REGEX.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('09')) {
    return digits.length >= 9 && digits.length <= 10;
  }
  if (digits.startsWith('251')) {
    return digits.length >= 11 && digits.length <= 12;
  }
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Enforces digit limits on phone number input strings in real time:
 * - Prevents exceeding 10 digits when starting with 09
 * - Prevents exceeding 12 digits when starting with 251
 */
export function sanitizePhoneInput(value: string): string {
  if (!value) return '';
  const hasLeadingPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('09')) {
    return digits.slice(0, 10);
  }
  if (digits.startsWith('251')) {
    const limited = digits.slice(0, 12);
    return hasLeadingPlus ? `+${limited}` : limited;
  }
  return value;
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

  if (digits.startsWith('09')) {
    if (digits.length > 10) {
      return 'Phone number starting with 09 cannot exceed 10 digits.';
    }
    if (digits.length < 9) {
      return 'Phone number starting with 09 is incomplete.';
    }
    return null;
  }

  if (digits.startsWith('251')) {
    if (digits.length > 12) {
      return 'Phone number starting with 251 cannot exceed 12 digits.';
    }
    if (digits.length < 11) {
      return 'Phone number starting with 251 is incomplete.';
    }
    return null;
  }

  if (digits.length < 7) {
    return 'Phone number is too short.';
  }
  if (digits.length > 15) {
    return 'Phone number is too long (maximum 15 digits allowed).';
  }

  return null;
}


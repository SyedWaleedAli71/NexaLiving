/**
 * Authentication form rules. Pure functions so screens stay readable and the
 * same rules can be reused (and unit tested) anywhere.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 03XXXXXXXXX or +92XXXXXXXXXX — 10 to 15 digits, optional +. */
export const isValidPhone = value => {
  const digits = value.replace(/\D/g, '');
  if (value.trim().startsWith('+')) {
    return digits.length >= 11 && digits.length <= 15;
  }
  return digits.length === 11 && digits.startsWith('03');
};

/** Keeps only digits and formats as 00000-0000000-0 while typing. */
export const formatCnic = value => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 12));
  if (digits.length > 12) parts.push(digits.slice(12, 13));
  return parts.join('-');
};

export const isValidCnic = value => /^\d{5}-\d{7}-\d$/.test(value);

/** Pakistani mobile numbers are entered as 03XXXXXXXXX. */
export const formatPhone = value => {
  if (value.trim().startsWith('+')) {
    return `+${value.replace(/\D/g, '').slice(0, 12)}`;
  }
  return value.replace(/\D/g, '').slice(0, 11);
};

export const firstNameOf = fullName => {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
};

export const validateEmail = value => {
  if (!value.trim()) return 'Email address is required.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address (name@example.com).';
  return undefined;
};

export const validatePassword = value => {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Use a mix of letters and numbers.';
  }
  return undefined;
};

export const validateFullName = value => {
  if (!value.trim()) return 'Full name is required.';
  if (value.trim().length < 3) return 'Enter your complete name (min. 3 characters).';
  if (!/^[A-Za-z .'-]+$/.test(value.trim())) return 'Name may only contain letters.';
  return undefined;
};

export const validatePhone = value => {
  if (!value.trim()) return 'Phone number is required.';
  if (!isValidPhone(value)) return 'Enter a valid number, e.g. 03XX XXXXXXX.';
  return undefined;
};

export const validateCnic = value => {
  if (!value.trim()) return 'CNIC is required.';
  if (!isValidCnic(value)) return 'Use the format 00000-0000000-0.';
  return undefined;
};

export const validateAddress = value => {
  if (!value.trim()) return 'Complete address is required.';
  if (value.trim().length < 8) return 'Please provide a more detailed address.';
  return undefined;
};

export const validateConfirmPassword = (confirm, password) => {
  if (!confirm) return 'Please confirm your password.';
  if (confirm !== password) return 'Passwords do not match.';
  return undefined;
};

/** Filters a set of field errors down to the ones that are still present. */
export const firstErrorMessage = errors => {
  const key = Object.keys(errors).find(name => Boolean(errors[name]));
  return key ? errors[key] : undefined;
};

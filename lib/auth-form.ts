export type AuthFailure = {
  error?: string;
  message?: string;
  statusCode?: number;
  responseData?: {
    data?: { details?: VerificationDetails };
    details?: VerificationDetails;
  };
};
type VerificationDetails = {
  code?: string;
  requires_verification?: boolean;
  email?: string;
};
export function emailError(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? undefined
    : 'Enter a valid email address.';
}
export function loginErrors(
  email: string,
  password: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const invalidEmail = emailError(email);
  if (invalidEmail) errors.email = invalidEmail;
  if (password.length < 6)
    errors.password = 'Enter your password (at least 6 characters).';
  return errors;
}
export function signupErrors(form: {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}): Record<string, string> {
  const errors = loginErrors(form.email, form.password);
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';
  if (!/^(\+234|0)\d{10}$/.test(normalizePhone(form.phone)))
    errors.phone = 'Use 08012345678 or +2348012345678.';
  return errors;
}
export function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, '');
}
export function authError(cause: unknown, fallback: string) {
  const error = cause as AuthFailure | null;
  return error?.error || error?.message || fallback;
}
export function verificationEmail(
  cause: unknown,
  email: string,
): string | null {
  const error = cause as AuthFailure | null;
  const details =
    error?.responseData?.data?.details || error?.responseData?.details;
  const message = authError(cause, '').toLowerCase();
  return details?.code === 'EMAIL_NOT_VERIFIED' ||
    details?.requires_verification ||
    message.includes('email not verified') ||
    message.includes('verify your email')
    ? details?.email || email.trim()
    : null;
}

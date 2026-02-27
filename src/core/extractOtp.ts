export type OtpDigits = 4 | 5 | 6;

const OTP_REGEX: Record<OtpDigits, RegExp> = {
  4: /\b(\d{4})\b/,
  5: /\b(\d{5})\b/,
  6: /\b(\d{6})\b/,
};

const DEFAULT_DIGITS: OtpDigits = 6;

function isValidOtpDigits(n: number): n is OtpDigits {
  return n === 4 || n === 5 || n === 6;
}

export function extractOtp(
  sms: string,
  numberOfDigits: OtpDigits = DEFAULT_DIGITS
): string | null {
  if (typeof sms !== 'string' || sms.length === 0) return null;
  if (!isValidOtpDigits(numberOfDigits)) return null;
  const trimmed = sms.trim();
  if (trimmed.length === 0) return null;
  const re = OTP_REGEX[numberOfDigits];
  const match = trimmed.match(re);
  return match?.[1] ?? null;
}

export { DEFAULT_DIGITS };

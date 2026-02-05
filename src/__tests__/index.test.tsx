import { extractOtp } from '../index';

describe('extractOtp', () => {
  it('extracts 6-digit OTP from message', () => {
    expect(extractOtp('Your code is 123456', 6)).toBe('123456');
    expect(extractOtp('123456 is your OTP', 6)).toBe('123456');
  });

  it('extracts 4-digit OTP from message', () => {
    expect(extractOtp('Code: 4521', 4)).toBe('4521');
  });

  it('extracts 5-digit OTP from message', () => {
    expect(extractOtp('OTP 98765 for login', 5)).toBe('98765');
  });

  it('returns null for empty or invalid input', () => {
    expect(extractOtp('', 6)).toBeNull();
    expect(extractOtp('no digits here', 6)).toBeNull();
  });

  it('defaults to 6 digits when numberOfDigits not provided', () => {
    expect(extractOtp('Use 555666')).toBe('555666');
  });
});

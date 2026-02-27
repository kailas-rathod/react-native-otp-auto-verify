import * as React from 'react';
import { Platform } from 'react-native';
import {
  getHash,
  activateOtpListener,
  removeListener,
  TIMEOUT_MESSAGE,
  type OtpListenerSubscription,
} from '../native/bridge';
import { DEFAULT_DIGITS, type OtpDigits } from '../core/extractOtp';

export interface UseOtpVerificationOptions {
  numberOfDigits?: OtpDigits;
}

export interface UseOtpVerificationResult {
  hashCode: string;
  otp: string | null;
  sms: string | null;
  timeoutError: boolean;
  error: Error | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useOtpVerification(
  options: UseOtpVerificationOptions = {}
): UseOtpVerificationResult {
  const numberOfDigits = options.numberOfDigits ?? DEFAULT_DIGITS;
  const [hashCode, setHashCode] = React.useState('');
  const [otp, setOtp] = React.useState<string | null>(null);
  const [sms, setSms] = React.useState<string | null>(null);
  const [timeoutError, setTimeoutError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const subscriptionRef = React.useRef<OtpListenerSubscription | null>(null);

  const stopListening = React.useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    removeListener();
  }, []);

  const handleOtpEvent = React.useCallback(
    (smsText: string, extractedOtp: string | null) => {
      setSms(smsText);
      if (smsText === TIMEOUT_MESSAGE) {
        setTimeoutError(true);
        return;
      }
      if (extractedOtp !== null) setOtp(extractedOtp);
    },
    []
  );

  const startListening = React.useCallback(async () => {
    if (Platform.OS !== 'android') return;
    setOtp(null);
    setSms(null);
    setTimeoutError(false);
    setError(null);
    try {
      const hashes = await getHash();
      setHashCode(hashes[0] ?? '');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    try {
      const sub = await activateOtpListener(handleOtpEvent, { numberOfDigits });
      subscriptionRef.current = sub;
    } catch (err) {
      subscriptionRef.current = null;
      const wrapped = new Error('Failed to start OTP listener', { cause: err });
      setError(wrapped);
      throw wrapped;
    }
  }, [numberOfDigits, handleOtpEvent]);

  React.useEffect(() => () => stopListening(), [stopListening]);

  return React.useMemo(
    () => ({
      hashCode,
      otp,
      sms,
      timeoutError,
      error,
      startListening,
      stopListening,
    }),
    [hashCode, otp, sms, timeoutError, error, startListening, stopListening]
  );
}

import * as React from 'react';
import { NativeEventEmitter, Platform } from 'react-native';
import { getOtpNativeModule } from './NativeOtpAutoVerify';

/** Must match native `OTP_RECEIVED_EVENT` (Android/iOS). */
export const OTP_RECEIVED_EVENT = 'otpReceived';

export const TIMEOUT_MESSAGE = 'Timeout Error.';
const DEFAULT_DIGITS = 6;

const MIN_OTP_DIGITS = 4;
const MAX_OTP_DIGITS = 8;

export type OtpDigits = 4 | 5 | 6 | 7 | 8;

let androidEventEmitter: NativeEventEmitter | null | undefined;

function getAndroidEventEmitter(): NativeEventEmitter | null {
  if (Platform.OS !== 'android') return null;
  if (androidEventEmitter !== undefined) {
    return androidEventEmitter;
  }
  try {
    androidEventEmitter = new NativeEventEmitter(getOtpNativeModule());
    return androidEventEmitter;
  } catch {
    androidEventEmitter = null;
    return null;
  }
}

function getOtpRegex(digits: number): RegExp {
  const d =
    digits >= MIN_OTP_DIGITS && digits <= MAX_OTP_DIGITS
      ? digits
      : DEFAULT_DIGITS;
  // Prefer non-`\b` boundaries so OTPs still match after ":" and similar (e.g. "OTP:123456").
  return new RegExp(`(^|[^0-9])(\\d{${d}})(?!\\d)`);
}

export interface UseOtpVerificationOptions {
  /** Extract OTP with this many digits (4–8). OTP is set when SMS is received. */
  numberOfDigits?: OtpDigits;
}

export interface UseOtpVerificationResult {
  /** App hash string for SMS (e.g. "uW87Uq6teXc"). Use at end of your OTP message. */
  hashCode: string;
  /** Extracted OTP when numberOfDigits is set and an SMS was received. */
  otp: string | null;
  /** Full SMS text when received. */
  sms: string | null;
  /** True when the 5-minute SMS Retriever timeout occurred. */
  timeoutError: boolean;
  /** Set when getHash fails (non-fatal) or when startListening fails. Cleared when startListening is called again. */
  error: Error | null;
  /** Start listening for OTP again (e.g. after timeout or error). */
  startListening: () => Promise<void>;
  /** Stop listening and clean up. Call on unmount. */
  stopListening: () => void;
}

export interface OtpListenerSubscription {
  remove: () => void;
}

/**
 * Extracts a numeric OTP of 4–8 digits from SMS text.
 */
export function extractOtp(
  sms: string,
  numberOfDigits: OtpDigits = DEFAULT_DIGITS
): string | null {
  if (!sms || typeof sms !== 'string') return null;
  const trimmed = sms.trim();
  if (!trimmed) return null;
  const regex = getOtpRegex(numberOfDigits);
  const match = trimmed.match(regex);
  return match ? match[2]! : null;
}

/** Returns app hash strings for the current app. Android only; iOS returns []. */
export async function getHash(): Promise<string[]> {
  if (Platform.OS !== 'android') return [];
  const arr = await getOtpNativeModule().getHash();
  return Array.from(arr);
}

/** No-op subscription for platforms where SMS Retriever is not supported (e.g. iOS). */
const NOOP_SUBSCRIPTION: OtpListenerSubscription = {
  remove: () => {},
};

/** Starts SMS Retriever and subscribes to OTP events. Returns subscription with remove(). On iOS, returns no-op (call remove() safely). */
export async function activateOtpListener(
  handler: (sms: string, extractedOtp?: string | null) => void,
  options?: { numberOfDigits?: OtpDigits }
): Promise<OtpListenerSubscription> {
  if (Platform.OS !== 'android') {
    return NOOP_SUBSCRIPTION;
  }

  const emitter = getAndroidEventEmitter();
  if (!emitter) {
    return NOOP_SUBSCRIPTION;
  }

  const numberOfDigits = options?.numberOfDigits ?? DEFAULT_DIGITS;
  const subscription = emitter.addListener(
    OTP_RECEIVED_EVENT,
    (...args: unknown[]) => {
      const smsText = String(args[0] ?? '');
      handler(smsText, extractOtp(smsText, numberOfDigits));
    }
  );

  try {
    await getOtpNativeModule().startSmsRetriever();
  } catch (err) {
    subscription.remove();
    throw err;
  }

  return {
    remove: () => {
      subscription.remove();
      try {
        getOtpNativeModule().removeListeners(0);
      } catch {
        // Native may be unavailable during teardown
      }
    },
  };
}

/**
 * Stops SMS listening and removes all listeners.
 * The native module ignores the count parameter and always unregisters the SMS receiver.
 */
export function removeListener(): void {
  if (Platform.OS !== 'android') return;
  try {
    getOtpNativeModule().removeListeners(0);
  } catch {
    // Native not linked or already torn down
  }
}

/** Hook for OTP verification. Call startListening() to begin; listener is stopped on unmount. */
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
  const isStartingRef = React.useRef(false);

  const stopListening = React.useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    isStartingRef.current = false;
    removeListener();
  }, []);

  const startListening = React.useCallback(async () => {
    if (Platform.OS !== 'android') return;
    if (isStartingRef.current) return;

    isStartingRef.current = true;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setOtp(null);
    setSms(null);
    setTimeoutError(false);
    setError(null);

    try {
      try {
        const hashes = await getHash();
        setHashCode(hashes[0] ?? '');
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        return;
      }

      const sub = await activateOtpListener(
        (smsText, extractedOtp) => {
          setSms(smsText);
          if (smsText === TIMEOUT_MESSAGE) {
            setTimeoutError(true);
            return;
          }
          if (extractedOtp) setOtp(extractedOtp);
        },
        { numberOfDigits }
      );
      subscriptionRef.current = sub;
    } catch (err) {
      subscriptionRef.current = null;
      const wrapped = new Error('Failed to start OTP listener', { cause: err });
      setError(wrapped);
      throw wrapped;
    } finally {
      isStartingRef.current = false;
    }
  }, [numberOfDigits]);

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

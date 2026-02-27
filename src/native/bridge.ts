import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import NativeOtpAutoVerify from '../NativeOtpAutoVerify';
import { extractOtp, DEFAULT_DIGITS, type OtpDigits } from '../core/extractOtp';

const { OtpAutoVerify } = NativeModules;
const eventEmitter: NativeEventEmitter | null =
  Platform.OS === 'android' && OtpAutoVerify != null
    ? new NativeEventEmitter(OtpAutoVerify)
    : null;

const OTP_RECEIVED_EVENT: string =
  (NativeOtpAutoVerify.getConstants?.()?.OTP_RECEIVED_EVENT as string) ??
  'otpReceived';

export const TIMEOUT_MESSAGE = 'Timeout Error.';

export interface OtpListenerSubscription {
  remove: () => void;
}

export async function getHash(): Promise<string[]> {
  if (Platform.OS !== 'android') return [];
  const arr = await NativeOtpAutoVerify.getHash();
  return Array.from(arr);
}

export async function activateOtpListener(
  handler: (sms: string, extractedOtp: string | null) => void,
  options?: { numberOfDigits?: OtpDigits }
): Promise<OtpListenerSubscription> {
  if (Platform.OS !== 'android' || eventEmitter == null) {
    throw new Error('SMS Retriever is only supported on Android.');
  }
  const numberOfDigits = options?.numberOfDigits ?? DEFAULT_DIGITS;
  let active = true;
  const subscription = eventEmitter.addListener(
    OTP_RECEIVED_EVENT,
    (payload: unknown) => {
      if (!active) return;
      const smsText =
        typeof payload === 'string' ? payload : String(payload ?? '');
      handler(smsText, extractOtp(smsText, numberOfDigits));
    }
  );
  const cleanup = (): void => {
    if (!active) return;
    active = false;
    subscription.remove();
    NativeOtpAutoVerify.removeListeners(0);
  };
  try {
    await NativeOtpAutoVerify.startSmsRetriever();
  } catch (err) {
    cleanup();
    throw err;
  }
  return { remove: cleanup };
}

export function removeListener(): void {
  if (Platform.OS === 'android') {
    NativeOtpAutoVerify.removeListeners(0);
  }
}

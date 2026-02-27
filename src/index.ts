export { extractOtp, type OtpDigits } from './core/extractOtp';
export {
  getHash,
  activateOtpListener,
  removeListener,
  type OtpListenerSubscription,
} from './native/bridge';
export {
  useOtpVerification,
  type UseOtpVerificationOptions,
  type UseOtpVerificationResult,
} from './hooks/useOtpVerification';

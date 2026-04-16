import { NativeModules, TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getConstants(): { OTP_RECEIVED_EVENT: string };
  getHash(): Promise<ReadonlyArray<string>>;
  startSmsRetriever(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

function getNativeModule(): Spec {
  try {
    return TurboModuleRegistry.getEnforcing<Spec>('OtpAutoVerify');
  } catch {
    const legacy = NativeModules.OtpAutoVerify;
    if (!legacy) {
      throw new Error(
        'OtpAutoVerify native module is not available. Ensure the library is properly linked.'
      );
    }
    return legacy as Spec;
  }
}

export default getNativeModule();



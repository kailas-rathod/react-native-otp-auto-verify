import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface OtpAutoVerifySpec extends TurboModule {
  getConstants(): { OTP_RECEIVED_EVENT: string };
  getHash(): Promise<ReadonlyArray<string>>;
  startSmsRetriever(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<OtpAutoVerifySpec>(
  'OtpAutoVerify'
);

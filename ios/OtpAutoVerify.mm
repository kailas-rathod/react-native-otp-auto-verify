#import "OtpAutoVerify.h"

@implementation OtpAutoVerify

- (NSDictionary *)getConstants {
  return @{ @"OTP_RECEIVED_EVENT": @"otpReceived" };
}

- (void)getHash:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@[]);
}

- (void)startSmsRetriever:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@NO);
}

- (void)addListener:(NSString *)eventName {
  // No-op on iOS; SMS Retriever is Android-only.
}

- (void)removeListeners:(double)count {
  // No-op on iOS.
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeOtpAutoVerifySpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"OtpAutoVerify";
}

@end

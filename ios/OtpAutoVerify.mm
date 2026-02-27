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

- (void)addListener:(NSString *)eventName {}

- (void)removeListeners:(double)count {}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeOtpAutoVerifySpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"OtpAutoVerify";
}

@end

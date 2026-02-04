package com.otpautoverify

import com.facebook.react.bridge.ReactApplicationContext

class OtpAutoVerifyModule(reactContext: ReactApplicationContext) :
  NativeOtpAutoVerifySpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeOtpAutoVerifySpec.NAME
  }
}

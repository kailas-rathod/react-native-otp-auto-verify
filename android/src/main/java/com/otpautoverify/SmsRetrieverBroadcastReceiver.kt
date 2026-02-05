package com.otpautoverify

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * Receives SMS Retriever API results and forwards the message or timeout to JS via RCTDeviceEventEmitter.
 * No READ_SMS permission required; fully Play Store compliant.
 */
class SmsRetrieverBroadcastReceiver(
    private val reactContext: ReactApplicationContext,
    private val eventName: String
) : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsRetrieverReceiver"
        const val TIMEOUT_MESSAGE = "Timeout Error."
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
        val extras: Bundle = intent.extras ?: return
        val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

        when (status.statusCode) {
            CommonStatusCodes.SUCCESS -> {
                val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
                if (message != null) {
                    Log.d(TAG, "SMS received")
                    emitMessage(message)
                }
            }
            CommonStatusCodes.TIMEOUT -> {
                Log.d(TAG, "SMS retriever timeout")
                emitMessage(TIMEOUT_MESSAGE)
            }
            else -> {
                Log.w(TAG, "SMS retriever status: ${status.statusCode}")
            }
        }
    }

    private fun emitMessage(message: String) {
        if (!reactContext.hasActiveReactInstance()) return
        reactContext.runOnJSQueueThread {
            try {
                reactContext.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, message)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit OTP event", e)
            }
        }
    }
}

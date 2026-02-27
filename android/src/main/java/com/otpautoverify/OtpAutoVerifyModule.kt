package com.otpautoverify

import android.annotation.SuppressLint
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.tasks.OnFailureListener
import com.google.android.gms.tasks.OnSuccessListener

class OtpAutoVerifyModule(reactContext: ReactApplicationContext) :
    NativeOtpAutoVerifySpec(reactContext), LifecycleEventListener {

    companion object {
        const val NAME = NativeOtpAutoVerifySpec.NAME
        const val OTP_RECEIVED_EVENT = "otpReceived"
    }

    private var smsReceiver: SmsRetrieverBroadcastReceiver? = null
    private var isReceiverRegistered = false
    private var isListening = false

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getTypedExportedConstants(): MutableMap<String, Any> {
        return mutableMapOf("OTP_RECEIVED_EVENT" to OTP_RECEIVED_EVENT)
    }

    override fun getHash(promise: Promise) {
        try {
            val helper = AppSignatureHelper(reactApplicationContext)
            val signatures = helper.getAppSignatures()
            val arr = Arguments.createArray()
            for (s in signatures) {
                arr.pushString(s)
            }
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("GET_HASH_ERROR", e.message ?: "Unknown error", e)
        }
    }

    override fun startSmsRetriever(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity. Ensure the app is in the foreground.")
            return
        }
        registerReceiverIfNecessary(activity)
        val client = SmsRetriever.getClient(reactApplicationContext)
        client.startSmsRetriever()
            .addOnSuccessListener(OnSuccessListener {
                isListening = true
                promise.resolve(true)
            })
            .addOnFailureListener(OnFailureListener { e ->
                promise.reject("START_SMS_RETRIEVER_ERROR", e.message ?: "Failed to start SMS retriever", e)
            })
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private fun registerReceiverIfNecessary(activity: android.app.Activity) {
        if (isReceiverRegistered) return
        try {
            smsReceiver = SmsRetrieverBroadcastReceiver(reactApplicationContext, OTP_RECEIVED_EVENT)
            val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.registerReceiver(
                    smsReceiver,
                    filter,
                    SmsRetriever.SEND_PERMISSION,
                    null,
                    android.content.Context.RECEIVER_EXPORTED
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                activity.registerReceiver(
                    smsReceiver,
                    filter,
                    android.content.Context.RECEIVER_EXPORTED
                )
            } else {
                activity.registerReceiver(smsReceiver, filter)
            }
            isReceiverRegistered = true
            Log.d(TAG, "SMS receiver registered")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register SMS receiver", e)
        }
    }

    private fun unregisterReceiver() {
        val activity = currentActivity
        if (isReceiverRegistered && activity != null && smsReceiver != null) {
            try {
                activity.unregisterReceiver(smsReceiver)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to unregister SMS receiver", e)
            }
            isReceiverRegistered = false
            smsReceiver = null
        }
        isListening = false
    }

    override fun addListener(eventName: String) {}

    override fun removeListeners(count: Double) {
        unregisterReceiver()
    }

    override fun onHostResume() {
        if (isListening && currentActivity != null && !isReceiverRegistered) {
            currentActivity?.let { registerReceiverIfNecessary(it) }
        }
    }

    override fun onHostPause() {
        unregisterReceiver()
    }

    override fun onHostDestroy() {
        unregisterReceiver()
        reactApplicationContext.removeLifecycleEventListener(this)
    }

    override fun invalidate() {
        unregisterReceiver()
        reactApplicationContext.removeLifecycleEventListener(this)
        super.invalidate()
    }
}

package com.otpautoverify

import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.util.ArrayList
import java.util.Arrays

class AppSignatureHelper(context: Context) : ContextWrapper(context) {

    companion object {
        private const val HASH_TYPE = "SHA-256"
        private const val NUM_HASHED_BYTES = 9
        private const val NUM_BASE64_CHAR = 11
    }

    fun getAppSignatures(): ArrayList<String> {
        val appCodes = ArrayList<String>()
        try {
            val packageName = packageName
            val packageManager = packageManager
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val packageInfo = packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                val packageInfo = packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNATURES
                )
                packageInfo.signatures
            } ?: return appCodes
            for (signature in signatures) {
                val hash = hash(packageName, signature.toCharsString())
                if (hash != null) appCodes.add(hash)
            }
        } catch (e: PackageManager.NameNotFoundException) {
            Log.e(TAG, "Unable to find package to obtain hash.", e)
        }
        return appCodes
    }

    private fun hash(packageName: String, signature: String): String? {
        return try {
            val appInfo = "$packageName $signature"
            val messageDigest = MessageDigest.getInstance(HASH_TYPE)
            messageDigest.update(appInfo.toByteArray(StandardCharsets.UTF_8))
            var hashSignature = messageDigest.digest()
            hashSignature = Arrays.copyOfRange(hashSignature, 0, NUM_HASHED_BYTES)
            var base64Hash = Base64.encodeToString(hashSignature, Base64.NO_PADDING or Base64.NO_WRAP)
            base64Hash = base64Hash.substring(0, minOf(NUM_BASE64_CHAR, base64Hash.length))
            base64Hash
        } catch (e: NoSuchAlgorithmException) {
            Log.e(TAG, "hash: NoSuchAlgorithm", e)
            null
        }
    }
}

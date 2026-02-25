# react-native-otp-auto-verify — Example App

This folder contains a **standalone React Native example app** that demonstrates how to use **react-native-otp-auto-verify** for automatic OTP detection on Android and manual entry with iOS AutoFill on iOS.

---

## What this example demonstrates

| Feature | Description |
|--------|-------------|
| **Android** | Uses the Google SMS Retriever API to automatically detect OTP from SMS without any SMS permissions. The app shows the **app hash** (for your backend to append to SMS), Start/Stop listener controls, and displays the **detected OTP** when an SMS matching the hash is received. |
| **iOS** | Automatic SMS reading is not supported. The example shows a manual OTP input field configured with `textContentType="oneTimeCode"` and `autoComplete="sms-otp"` so iOS can suggest the OTP above the keyboard when the user receives an SMS. |
| **Hook usage** | The screen uses `useOtpVerification({ numberOfDigits: 6 })` and calls `startListening()` on mount (Android) with cleanup via `stopListening()` on unmount. |
| **Error handling** | Displays errors from the hook (e.g. getHash or startListening failures) and from the manual Start button. |
| **Timeout** | When the 5-minute SMS Retriever window expires, a message prompts the user to tap "Start OTP listener" again. |

---

## Code overview

The main logic lives in `src/App.tsx`. Below are all relevant snippets and the full example file.

### 1. Imports and hook

```tsx
import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useOtpVerification } from 'react-native-otp-auto-verify';

const OTP_LENGTH = 6;

function OtpVerifyScreen() {
  const {
    hashCode,
    otp,
    sms,
    timeoutError,
    error: hookError,
    startListening,
    stopListening,
  } = useOtpVerification({ numberOfDigits: OTP_LENGTH });
```

### 2. Local state and error display

```tsx
  const [manualOtp, setManualOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const displayError = hookError?.message ?? startError;
```

### 3. Start on mount, stop on unmount (Android)

```tsx
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      startListening().catch(() => {});
    }
    return () => stopListening();
  }, [startListening, stopListening]);
```

### 4. Manual "Start" button (retry / restart listener)

```tsx
  const handleStart = React.useCallback(async () => {
    setStartError(null);
    setLoading(true);
    try {
      await startListening();
    } catch (e) {
      setStartError(
        e instanceof Error ? e.message : 'Failed to start OTP listener'
      );
    } finally {
      setLoading(false);
    }
  }, [startListening]);
```

### 5. Error box (hook or start failure)

```tsx
        {displayError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}
```

### 6. Android Start / Stop buttons

```tsx
        {Platform.OS === 'android' && (
          <>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleStart}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start OTP listener</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={stopListening}
            >
              <Text style={styles.buttonTextSecondary}>Stop listening</Text>
            </TouchableOpacity>
          </>
        )}
```

### 7. Timeout message (5-minute window expired)

```tsx
        {timeoutError && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Listener timed out (5 min). Tap "Start OTP listener" to try again.
            </Text>
          </View>
        )}
```

### 8. App hash (for backend to append to SMS)

```tsx
        {hashCode ? (
          <View style={styles.infoBox}>
            <Text style={styles.label}>
              App hash — your backend must append this exact string to the end of the OTP SMS:
            </Text>
            <Text style={styles.hashCodeText} selectable>
              {hashCode}
            </Text>
          </View>
        ) : null}
```

### 9. Last received SMS (for debugging; hide timeout message)

```tsx
        {sms && sms !== 'Timeout Error.' && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Last received SMS (for debugging):</Text>
            <Text style={styles.smsText} selectable numberOfLines={3}>
              {sms}
            </Text>
          </View>
        )}
```

### 10. Detected OTP

```tsx
        {otp ? (
          <View style={styles.otpBox}>
            <Text style={styles.label}>Detected OTP (extracted from SMS):</Text>
            <Text style={styles.otpValue}>{otp}</Text>
          </View>
        ) : null}
```

### 11. Manual OTP input with iOS AutoFill

```tsx
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Or enter OTP manually (iOS: keyboard AutoFill when you receive an SMS):
          </Text>
          <TextInput
            style={styles.input}
            value={manualOtp}
            onChangeText={setManualOtp}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            placeholderTextColor="#999"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
          />
        </View>
```

### 12. App entry point

```tsx
export default function App() {
  return (
    <View style={styles.container}>
      <OtpVerifyScreen />
    </View>
  );
}
```

### 13. Get app hash for your backend (standalone)

```ts
import { getHash } from 'react-native-otp-auto-verify';

const hashes = await getHash();
const appHash = hashes[0]; // Send to backend; backend appends this to OTP SMS
```

### 14. Imperative API (without hook)

```ts
import { activateOtpListener, removeListener } from 'react-native-otp-auto-verify';

const sub = await activateOtpListener(
  (sms, extractedOtp) => {
    if (extractedOtp) console.log('OTP:', extractedOtp);
  },
  { numberOfDigits: 6 }
);

// When done:
sub.remove();
// or
removeListener();
```

### 15. Config: `react-native.config.js`

Links the example to the parent library so it uses the repo root as `react-native-otp-auto-verify`:

```js
const path = require('path');
const pkg = require('../package.json');

module.exports = {
  project: {
    ios: { automaticPodsInstallation: true },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: { ios: {}, android: {} },
    },
  },
};
```

### 16. Config: `metro.config.js`

Resolves the library from the repository root (monorepo-style):

```js
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '..');

const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

module.exports = config;
```

### 17. Entry: `index.js`

```js
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

### 18. App manifest: `app.json`

```json
{
  "name": "OtpAutoVerifyExample",
  "displayName": "OTP Auto-Verify Example",
  "description": "Example app demonstrating react-native-otp-auto-verify."
}
```

### Full example: `src/App.tsx`

The complete screen is in **`src/App.tsx`** in this folder. It wires together sections 1–12: hook, state, `useEffect` start/stop, Start/Stop buttons, timeout message, app hash, last SMS, detected OTP, manual input with iOS AutoFill, and `StyleSheet`. Copy that file into your app and adjust styles/labels as needed.

---

## Prerequisites

- **Node.js** ≥ 18  
- **React Native development environment** — [Set up your environment](https://reactnative.dev/docs/set-up-your-environment)  
- **Android:** A physical device or emulator with **Google Play Services** (required for SMS Retriever)  
- **iOS:** Xcode and CocoaPods  

---

## Setup

### Step 1 — Build the library

From the **repository root** (parent of `example/`), install dependencies and build the library so the example can resolve it:

```bash
cd ..          # if you are inside example/, go to repo root
yarn install
yarn prepare   # builds the library into lib/
cd example
```

### Step 2 — Install example dependencies

Inside the `example/` folder, install dependencies and (for iOS) install pods:

```bash
yarn install
# iOS only:
cd ios && pod install && cd ..
```

---

## How to run

1. **Start the Metro bundler** (from the `example/` directory):

   ```bash
   yarn start
   ```

2. **In a second terminal**, run the app on a device or simulator:

   ```bash
   yarn android   # for Android
   yarn ios       # for iOS
   ```

> **Tip:** If the example reports that the library cannot be found, ensure you have run `yarn prepare` from the **repository root** so that the `lib/` folder exists.

---

## Testing OTP on Android

1. Run the example on a **real device** or an emulator that has **Google Play Services**.
2. Open the app. On Android, the listener may auto-start; otherwise tap **Start OTP listener**. The **App hash** (e.g. `uW87Uq6teXc`) appears — this is the 11-character string your backend must **append at the end** of the OTP SMS.
3. Send an SMS to this device that:
   - Is **at most 140 bytes** in length,
   - Contains a **4-, 5-, or 6-digit** OTP (this example uses 6 digits),
   - **Ends with** the app hash exactly (no extra space or characters after the hash).

   **Example SMS:**
   ```
   Your code is 123456. Valid for 10 minutes. uW87Uq6teXc
   ```

4. With the app in the **foreground**, the app should display **Detected OTP: 123456** (or whatever code you used).
5. If the OTP is not detected, verify: (a) the SMS ends with the exact hash shown in the app, (b) the app is in the foreground, and (c) you are still within the 5-minute listener window (tap **Start OTP listener** again if it has timed out).

---

## Testing on iOS

- **Automatic SMS reading is not supported** on iOS for privacy/security reasons.
- Use the **manual OTP** field to type or paste the code.
- The manual input is configured with **Security Code AutoFill**: when the user receives an SMS containing an OTP, iOS may show the code above the keyboard; tapping it fills the field. No SMS permissions are required.

---

## Project structure

| Path | Description |
|------|-------------|
| `src/App.tsx` | Single OTP screen: uses `useOtpVerification`, shows app hash, Start/Stop buttons (Android), detected OTP, timeout message, and a manual OTP input with iOS AutoFill props. |
| `react-native.config.js` | Configures the example app to use the parent directory as the `react-native-otp-auto-verify` dependency (so the library is linked from the repo root). |
| `metro.config.js` | Metro configuration so that the bundler resolves the library from the repository root (monorepo-style setup). |
| `package.json` | Declares `react-native-otp-auto-verify` as `link:..` and aligns React/React Native versions with the library. |

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| **Library not found** | From the repository root, run `yarn prepare` to build the library into `lib/`, then run the example again from `example/`. |
| **Android: "No current activity"** | The SMS Retriever requires a visible activity. Ensure the app is in the foreground (OTP screen visible) when starting the listener. |
| **OTP not detected** | Confirm the SMS is ≤ 140 bytes, ends with the exact app hash (no trailing space), contains a 4–6 digit OTP, and the app is in the foreground. Restart the listener if the 5-minute window has expired. |
| **iOS: No AutoFill suggestion** | Ensure the input has `textContentType="oneTimeCode"` and `autoComplete="sms-otp"`. The SMS must be from a sender iOS can associate with your app (e.g. same domain or known format). |

For more details, see the main [README](../README.md) and [Troubleshooting](../README.md#troubleshooting).

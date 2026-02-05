Got it — you want **library user guidelines only**, not a full README or contributor docs.
Here’s a **clean, developer-facing User Guide** you can drop into your docs or README as a dedicated section.

---

# User Guide — `react-native-otp-auto-verify`

This guide explains how to **use** the library in your app to automatically read OTPs on Android using Google’s SMS Retriever API.

---

## What this library does

* Automatically reads **4–6 digit OTPs** from SMS on **Android**
* Uses **Google SMS Retriever API**
* **No SMS permissions required** (Play Store compliant)
* Works only while the app is **foregrounded**
* iOS is supported as a **safe no-op**

---

## Platform support

| Platform | Support                      |
| -------- | ---------------------------- |
| Android  | ✅ Fully supported            |
| iOS      | ⚠️ No auto-read (safe no-op) |

---

## Installation

```sh
npm install react-native-otp-auto-verify
# or
yarn add react-native-otp-auto-verify
```

> React Native `0.60+` supports autolinking. No manual setup required.

---

## Step 1: Get your App Hash

Google SMS Retriever only delivers SMS messages that include your **11-character app hash**.

### Get the hash in your app

```ts
import { getHash } from 'react-native-otp-auto-verify';

const hashes = await getHash();
// Use hashes[0]
```

Send this hash to your backend and store it.

---

## Step 2: Format your OTP SMS (Required)

Your backend **must** format OTP messages correctly.

### SMS requirements

* Must be **≤ 140 bytes**
* Must contain a **4–6 digit OTP**
* Must **end with the app hash**

### Recommended format

```
<#> Your verification code is 123456
AbCdEfGhIjK
```

* `123456` → OTP
* `AbCdEfGhIjK` → App hash from `getHash()`

If the hash is missing or incorrect, OTP auto-detection will **not work**.

---

## Step 3: Start the OTP listener (Hook – Recommended)

Start listening **only when the OTP screen is visible and the app is in the foreground**.

```tsx
import { useOtpVerify } from 'react-native-otp-auto-verify';

function OtpScreen() {
  const {
    hash,
    otp,
    timeoutError,
    startListener,
    stopListener,
  } = useOtpVerify({ numberOfDigits: 6 });

  useEffect(() => {
    startListener();
    return () => stopListener();
  }, []);

  return (
    <>
      {otp && <Text>OTP: {otp}</Text>}
      {timeoutError && <Text>OTP timed out. Try again.</Text>}
    </>
  );
}
```

### Hook options

| Option           | Description                     |
| ---------------- | ------------------------------- |
| `numberOfDigits` | `4`, `5`, or `6` (default: `6`) |

---

## Timeout behavior

* SMS Retriever waits **up to 5 minutes**
* If no SMS arrives:

  * `timeoutError` becomes `true`
  * You must call `startListener()` again to retry

---

## Manual (Imperative) Usage

Use this if you don’t want React hooks.

```ts
import { startOtpListener, removeListener } from 'react-native-otp-auto-verify';

const subscription = await startOtpListener(
  (message, otp) => {
    if (otp) {
      console.log('Detected OTP:', otp);
    }
  },
  { numberOfDigits: 6 }
);

// Cleanup
subscription.remove();
// or
removeListener();
```

---

## Important usage rules

* ✅ Start listening **only in foreground**
* ❌ Do not start listener in background
* ✅ Always clean up listeners on unmount
* ❌ Do not register multiple listeners at once

---

## iOS behavior

On iOS, all APIs are safe no-ops:

| Method               | iOS result                      |
| -------------------- | ------------------------------- |
| `getHash()`          | `[]`                            |
| `useOtpVerify()`     | Does nothing                    |
| `startOtpListener()` | Rejects with Android-only error |

You must implement **manual OTP input** on iOS.

---

## Common issues

### OTP not detected

* SMS does **not end with app hash**
* SMS exceeds **140 bytes**
* OTP length does not match `numberOfDigits`

### Listener fails to start

* App is not in foreground
* Google Play Services unavailable

### Timeout

* No valid SMS received within 5 minutes
* Call `startListener()` again

---

## Best practices

* Fetch and store the app hash **once**
* Start listener only on OTP screen
* Provide a **manual retry** button
* Always allow **manual OTP entry** as fallback

---

If you want, I can also:

* Slim this down further for a README
* Convert it into **docs-site friendly** markdown
* Add a **minimal quick-start only** version

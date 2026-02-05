# react-native-otp-auto-verify

Automatic OTP verification on Android using the **Google SMS Retriever API** — no `READ_SMS` or `RECEIVE_SMS` permissions, fully Play Store compliant.

### In simple terms

| Term | Simple meaning |
|------|----------------|
| **OTP** | One-time code (e.g. 123456) sent by SMS to verify the user. |
| **App hash / hashCode** | Your app’s 11-character unique ID (e.g. `uW87Uq6teXc`). The SMS Retriever only delivers SMS that **end** with this hash. Your backend must append it to every OTP SMS. |
| **SMS Retriever** | Google’s way to read only OTP SMS — no “read all SMS” permission, so it’s Play Store friendly. It matches SMS by the app hash at the end of the message. |
| **Start listening** | Tell the app to watch for the OTP SMS (e.g. when the user is on the “Enter code” screen). |
| **Timeout** | No OTP SMS arrived in 5 minutes; user can tap “Try again” to listen again. |

**What this library does:** On the “Enter code” screen, it listens for the OTP SMS and fills in the code automatically so the user doesn’t have to type it.

## Features

- **No SMS permissions** – Uses SMS Retriever API only; no user-facing permissions
- **App hash generation** – Get the 11-character hash to include in your SMS
- **Auto-detect 4–6 digit OTP** – Extracts OTP from the message automatically
- **Simple API** – Start/stop listening, get hashCode and OTP, handle timeout and lifecycle
- **TypeScript** – Full typings included
- **Android only** – iOS stubs return safe defaults; no breaking changes

## Requirements

- **React Native**: `>= 0.60` (autolinking supported). Tested with **React Native `0.83.3`**.
- **Android**: Google Play Services on the device (SMS Retriever relies on it)
- **iOS**: Supported as a safe no-op (no OTP auto-read on iOS)

## Installation

```sh
npm install react-native-otp-auto-verify
# or
yarn add react-native-otp-auto-verify
```

### Linking

- **Autolinking (default)** – React Native 0.60+ links the library automatically. No extra steps.
- **iOS** – After adding the dependency, run `pod install` in your app’s `ios` folder.
- **Local link (development)** – To use the package from your filesystem:

  ```json
  "dependencies": {
    "react-native-otp-auto-verify": "file:../path/to/react-native-otp-auto-verify"
  }
  ```

  Then run `yarn install` (or `npm install`) and, for iOS, `cd ios && pod install`. Autolinking will use the local package.

## Quick start

### hashCode and SMS Retriever

The **SMS Retriever API** only delivers an SMS to your app if the message **ends with your app’s 11-character hash** (the `hashCode`). This is how Google ensures only your app receives your OTP messages — no broad SMS permissions needed.

**How to use `hashCode`:**

1. **Get the hash in your app** (see below). It looks like `uW87Uq6teXc`.
2. **Send it to your backend** (e.g. via your API or config). Your server must store it.
3. **Backend appends it to every OTP SMS** — the last 11 characters of the SMS body must be exactly this hash (see [SMS message format](#sms-message-format)).
4. When the user receives that SMS, the Retriever matches it and delivers the message to your app; the library then extracts the OTP.

Without the correct hash at the end of the SMS, the Retriever will **not** deliver the message to your app.

### 1) Get the app hash (`hashCode`)

Get the 11-character hash in your app, then give it to your backend so they can append it to OTP SMS.

**Option A – Using the hook (recommended):** Call `startListening()` on your OTP screen; the hook sets `hashCode` (e.g. `"uW87Uq6teXc"`). Use it in your UI or send it to your backend.

```tsx
const { hashCode, startListening } = useOtpVerification();

await startListening();
// hashCode is now e.g. "uW87Uq6teXc" — send this to your backend
```

**Option B – Imperative:** Call `getHash()` and use the first element.

```tsx
import { getHash } from 'react-native-otp-auto-verify';

const hashes = await getHash();
const hashCode = hashes[0] ?? '';
// Send hashCode to your backend or show in UI for testing
```

Your backend must store this value and append it to every OTP SMS (see next step).

### 2) Configure your backend SMS (critical)

Your server must send OTP SMS that:

- Are **≤ 140 bytes** in length.
- **End** with the 11-character **hashCode** (the app hash from `getHash()` or the hook’s `hashCode`). The Retriever matches on this; typically put it on the last line.

Example message body (replace the last line with your actual `hashCode`):

```
<#> Your code is 123456
uW87Uq6teXc
```

So the **last 11 characters** of the SMS must be exactly your app’s hash. See [SMS message format](#sms-message-format) and [Google’s SMS Retriever guide](https://developers.google.com/identity/sms-retriever/verify) for the exact requirements.

### 3) Start listening on the OTP screen (foreground only)

**Option A – Hook (recommended)**

- Call `startListening()` when the OTP screen is visible and the app is in the **foreground**.
- Use `otp` when it’s set (auto-filled from SMS).
- If `timeoutError` becomes `true`, show a retry that calls `startListening()` again.

```tsx
import { useOtpVerification } from 'react-native-otp-auto-verify';

function OtpScreen() {
  const { hashCode, otp, sms, timeoutError, startListening, stopListening } =
    useOtpVerification({ numberOfDigits: 6 });

  const handleStart = async () => {
    try {
      await startListening();
    } catch (e) {
      // Handle error (e.g. SMS Retriever not supported or app not in a valid state)
    }
  };

  return (
    <View>
      {hashCode ? <Text>App hash: {hashCode}</Text> : null}
      {otp && <Text>OTP: {otp}</Text>}
      {timeoutError && (
        <Text onPress={handleStart}>Timed out. Tap to try again.</Text>
      )}
      <Button onPress={handleStart} title="Start OTP listener" />
      <Button onPress={stopListening} title="Stop listening" />
    </View>
  );
}
```

**Option B – Imperative API**

See [Usage](#usage) for complete examples.

## SMS message format

Your SMS must **end** with the **hashCode** (app hash) so the SMS Retriever can deliver it to your app.

Minimum requirements (per Google):

- Message must be **≤ 140 bytes**
- Must contain a one-time code (OTP)
- Must **end** with the 11-character **hashCode** (from `getHash()` or the hook’s `hashCode`)

Recommended example (use your actual `hashCode` as the last line):

```
<#> Your code is 123456
uW87Uq6teXc
```

**Usage summary:** Get `hashCode` in the app → send it to your backend → backend appends it to every OTP SMS as the last line. The Retriever then delivers only SMS that end with that hash.

See [Google’s SMS Retriever guide](https://developers.google.com/identity/sms-retriever/verify) for the exact format.

## Usage

### Hook (recommended)

Use `useOtpVerification` for hashCode, extracted OTP, timeout state, and start/stop. Call `startListening()` when the user reaches the OTP step (e.g. on button press). The hook cleans up on unmount.

```tsx
import { useOtpVerification } from 'react-native-otp-auto-verify';

function OtpScreen() {
  const { hashCode, otp, sms, timeoutError, startListening, stopListening } =
    useOtpVerification({ numberOfDigits: 6 });

  const handleStart = async () => {
    try {
      await startListening();
    } catch (e) {
      // e.g. no activity (app in background)
    }
  };

  return (
    <View>
      {hashCode ? <Text>App hash (for backend): {hashCode}</Text> : null}
      {otp && <Text>OTP: {otp}</Text>}
      {timeoutError && <Text>Timed out. Tap to try again.</Text>}
      <Button onPress={handleStart} title="Start OTP listener" />
      <Button onPress={stopListening} title="Stop listening" />
    </View>
  );
}
```

- **`numberOfDigits`** – `4`, `5`, or `6` (default `6`) for OTP extraction.
- **When to start** – Call `startListening()` when the OTP screen is visible and in the foreground.
- **Cleanup** – `stopListening()` runs on unmount; you can also call it when verification is done.

### Imperative API

```tsx
import {
  getHash,
  activateOtpListener,
  removeListener,
  extractOtp,
} from 'react-native-otp-auto-verify';

// Get app hash (e.g. for your backend to put in the SMS)
const hashes = await getHash();

// Start listening; handler is called with full SMS (or "Timeout Error." after 5 min)
const subscription = await activateOtpListener(
  (sms, extractedOtp) => {
    if (sms === 'Timeout Error.') return;
    // extractedOtp is already computed using numberOfDigits (if provided)
    const code = extractedOtp ?? extractOtp(sms, 6);
    if (code) {
      setOtp(code);
    }
  },
  { numberOfDigits: 6 }
);

// When done or on component unmount: stop listening and clean up
subscription.remove();
// or
removeListener();
```

### API

| Method / hook        | Description |
|----------------------|-------------|
| `getHash()`          | Returns `Promise<string[]>` – app hashes to include in SMS. |
| `activateOtpListener(handler, options?)` | Starts SMS Retriever and subscribes to OTP events. Returns `Promise<{ remove }>`; the handler receives `(sms, extractedOtp?)`. |
| `removeListener()`   | Stops listening and removes listeners. |
| `extractOtp(sms, numberOfDigits?)` | Extracts 4–6 digit OTP from SMS. `numberOfDigits` is `4`, `5`, or `6` (default `6`). |
| `useOtpVerification(options)` | Hook: `{ hashCode, otp, sms, timeoutError, startListening, stopListening }`. `options.numberOfDigits` optional. |

### Hook result

| Property         | Type              | Description |
|------------------|-------------------|-------------|
| `hashCode`       | `string`          | **SMS Retriever app hash** (e.g. `"uW87Uq6teXc"`). Set after `startListening()`. Send this to your backend; they must append it to the end of every OTP SMS so the Retriever can deliver the message to your app. |
| `otp`            | `string \| null`  | Extracted OTP when `numberOfDigits` is set. |
| `sms`            | `string \| null`  | Full SMS text when received. |
| `timeoutError`   | `boolean`         | `true` when the 5-minute Retriever timeout occurred. |
| `startListening` | `() => Promise<void>` | Start listening again. |
| `stopListening`  | `() => void`      | Stop and clean up (call on unmount). |

## Edge cases and lifecycle

- **Foreground only** – Start listening when the OTP screen is visible and the app is in the foreground.
- **Timeout** – SMS Retriever waits up to **5 minutes**. On timeout, the handler receives `"Timeout Error."` and the hook sets `timeoutError = true`. Call `startListening()` again to retry.
- **Cleanup** – Always call `stopListening()` (or `subscription.remove()`) on unmount so listeners are cleaned up.
- **Avoid duplicate listeners** – If you call `startListening()` multiple times (e.g. retry flows), call `stopListening()` first to avoid multiple active subscriptions.
- **iOS** – Safe no-op:
  - `getHash()` resolves to `[]`
  - `useOtpVerification().startListening()` does nothing
  - `activateOtpListener()` rejects with `"SMS Retriever is only supported on Android."`

## Troubleshooting

- **No OTP detected**
  - Confirm the SMS **ends** with the exact 11-character **hashCode** (from `getHash()` or the hook). Last line of the SMS should be this hash.
  - Keep the SMS under **140 bytes**.
  - Ensure the OTP is **4–6 digits** and `numberOfDigits` matches your code length.
- **Start listener fails**
  - Call it only when the app is in the **foreground** and the OTP screen is visible.
  - Ensure the device has **Google Play Services** available and enabled.
- **Timeout**
  - `"Timeout Error."` means no matching SMS arrived within **5 minutes**. Provide a retry button that calls `startListening()` again.

## Example

See the [example](./example) app for a full screen that starts/stops the listener, shows app hash and detected OTP, and handles timeout.

```sh
yarn example
yarn android
```

## License

MIT

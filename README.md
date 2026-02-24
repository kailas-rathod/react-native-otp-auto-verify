# react-native-otp-auto-verify


[![npm version](https://img.shields.io/npm/v/react-native-otp-auto-verify.svg?style=flat-square)](https://www.npmjs.com/package/react-native-otp-auto-verify)      [![npm downloads](https://img.shields.io/npm/dm/react-native-otp-auto-verify.svg?style=flat-square)](https://www.npmjs.com/package/react-native-otp-auto-verify)      [![license](https://img.shields.io/npm/l/react-native-otp-auto-verify.svg?style=flat-square)](https://github.com/kailas-rathod/react-native-otp-auto-verify/blob/main/LICENSE)         [![typescript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

**react-native-otp-auto-verify** is a lightweight and secure React Native OTP auto-verification library for Android, built on the official Google SMS Retriever API. It enables automatic OTP detection without requiring READ_SMS or RECEIVE_SMS permissions, ensuring full Google Play Store compliance and enhanced user trust. Designed for modern authentication flows, this library is ideal for fintech apps, banking applications, e-commerce platforms, and secure login systems.

With minimal dependencies and clean architecture, it integrates seamlessly into both React Native Old Architecture and the New Architecture (TurboModule) environments. The solution improves user experience by eliminating manual OTP entry on Android while maintaining strong server-side validation standards.

Works best for onboarding/login flows in **banking**, **fintech**, and authentication-heavy apps.
Supports both RN Old Architecture and React Native **New Architecture** (TurboModule).
**Android**: automatic OTP detection.
**iOS**: auto-OTP is not supported—use manual OTP entry as fallback.

---
<img width="1536" height="1024" alt="otp" src="https://github.com/user-attachments/assets/e4908e99-e7d1-4a96-a6d2-b92c50090db0" />


## Features

- ✅ **Automatic OTP detection**: receives OTP from matching SMS and exposes it as `otp` (hook) or `extractedOtp` (listener)
- ✅ **No SMS permissions**: no access to inbox, avoids sensitive permissions and reduces compliance friction
- ✅ **App hash security**: OTP SMS must end with your **11-character hash** (only your app can receive it)
- ✅ **Hook + Imperative API**: `useOtpVerification()` for screens, `activateOtpListener()` for custom flows
- ✅ **TypeScript**: typed options and return values
- ✅ **New Architecture ready**: TurboModule implementation; works with Old Architecture too
---

## Platform Support

| Platform | Support | Notes |
|----------|----------|-------|
| Android  | ✅ | Requires Google Play Services on device |
| iOS      | ✅ Native Only | Uses iOS Security Code AutoFill (manual tap required) |

## Requirements

- React Native: **0.60+** (autolinking)
- Android: **minSdkVersion 24+**

## Installation

```sh
npm install react-native-otp-auto-verify
# or
yarn add react-native-otp-auto-verify
# or
pnpm add react-native-otp-auto-verify
```


## Usage

### 1) Get your app hash

SMS Retriever only delivers messages that include your **11-character app hash**.

```ts
import { getHash } from 'react-native-otp-auto-verify';

const hashes = await getHash();
const appHash = hashes[0]; // send this to your backend
```

### 2) Format your OTP SMS

Your backend **must** include the app hash at the **end** of the SMS.

Requirements:

- Message must be **≤ 140 bytes**
- Must contain a **4–6 digit** OTP
- Must **end with** the app hash from `getHash()`

Recommended format:

```
Dear Kailas Rathod, 321500 is your OTP for mobile authentication. This OTP is valid for the next 15 minutes. Please DO NOT share it with anyone.
uW87Uq6teXc
```
nots :- not need for <#> starting 

### 3) Hook usage (recommended)

Start listening only while the OTP screen is visible (foreground).

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useOtpVerification } from 'react-native-otp-auto-verify';

export function OtpScreen() {
  const { hashCode, otp, timeoutError, startListening, stopListening } =
    useOtpVerification({ numberOfDigits: 6 });

  React.useEffect(() => {
    void startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  return (
    <View>
      {!!hashCode && <Text>Hash: {hashCode}</Text>}
      {!!otp && <Text>OTP: {otp}</Text>}
      {timeoutError && <Text>Timeout. Tap resend and try again.</Text>}
    </View>
  );
}
```

### 4) Imperative usage

```ts
import {
  activateOtpListener,
  removeListener,
} from 'react-native-otp-auto-verify';

const sub = await activateOtpListener(
  (sms, extractedOtp) => {
    if (extractedOtp) {
      console.log('OTP:', extractedOtp);
    }
  },
  { numberOfDigits: 6 }
);

// cleanup
sub.remove();
// or
removeListener();
```

# iOS OTP AutoFill (Native)

iOS does **not** allow third-party libraries to read SMS messages.

Automatic SMS reading is restricted by Apple for privacy and security reasons.  
Instead, iOS provides a native feature called **Security Code AutoFill**, which suggests the OTP above the keyboard when properly configured.

This library does **not** auto-read OTP on iOS.

---

## How iOS OTP AutoFill Works

1. User receives an SMS containing an OTP.
2. iOS detects the code.
3. The OTP appears above the keyboard.
4. User taps the suggestion.
5. The code fills automatically into the input field.

No SMS permissions required.

---

## React Native Setup

Use the following configuration in your OTP input field:

```tsx
<TextInput
  style={styles.input}
  keyboardType="number-pad"
  textContentType="oneTimeCode"
  autoComplete="sms-otp"
  importantForAutofill="yes"
  maxLength={6}
/>

```


## react-native-otp-auto-verify Architecture Flow
<img width="1536" height="1024" alt="react-native-otp-auto-verify Architecture Flow" src="https://github.com/user-attachments/assets/11582523-81cb-4904-9de0-56af05b3a3b4" />

## API Reference

### `useOtpVerification(options?)`

Use this on your OTP screen. It manages:
- getting the app hash (`hashCode`)
- starting/stopping the SMS Retriever listener
- extracting OTP and exposing it as `otp`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `numberOfDigits` | `4 \| 5 \| 6` | `6` | OTP length to extract |
| `hashCode` | `string` | `''` | App hash (send to backend) |
| `otp` | `string \| null` | `null` | Extracted OTP |
| `sms` | `string \| null` | `null` | Full SMS text |
| `timeoutError` | `boolean` | `false` | Timeout occurred |
| `startListening` | `() => Promise<void>` | — | Start listening |
| `stopListening` | `() => void` | — | Stop listening |


### `getHash(): Promise<string[]>`

Android only. On iOS returns `[]`.

### `activateOtpListener(handler, options?): Promise<{ remove(): void }>`

Android only. Throws on iOS.

### `removeListener(): void`

Android only. Removes native listeners.

### `extractOtp(sms: string, numberOfDigits?: 4 | 5 | 6): string | null`

Pure helper to extract the OTP from an SMS string.

## Timeout behavior

SMS Retriever waits up to **5 minutes**. When it times out:

- `timeoutError` becomes `true`
- call `startListening()` again to retry

## React Native New Architecture

This library is built with **TurboModules** and fully supports React Native's **New Architecture**.

### What is the New Architecture?

The New Architecture (also known as Fabric + TurboModules) is React Native's new rendering system and native module architecture that provides:

- Better performance and type safety
- Synchronous native module calls
- Improved interoperability with native code

### Enabling New Architecture

The library works automatically with both **Old Architecture** and **New Architecture**. No code changes needed.

**For Android:**

Enable New Architecture in `android/gradle.properties`:

```properties
newArchEnabled=true
```

**For iOS:**

Enable New Architecture in `ios/Podfile`:

```ruby
use_react_native!(
  :fabric_enabled => true,
  # ... other options
)
```

Or set the environment variable:

```sh
RCT_NEW_ARCH_ENABLED=1 pod install
```

### Compatibility

- ✅ Works with **Old Architecture** (React Native < 0.68)
- ✅ Works with **New Architecture** (React Native 0.68+)
- ✅ Automatically detects and uses the correct architecture
- ✅ No breaking changes when migrating

## Troubleshooting

- OTP not detected
  - Ensure the SMS **ends with** the app hash
  - Keep the SMS **≤ 140 bytes**
  - Match `numberOfDigits` to your OTP length
  - Keep the app in **foreground**
- Listener fails to start
  - Ensure Google Play services are available on the device
  - Avoid multiple active listeners at once

## Example app

See [`./example`](./example).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).


## Keywork
react native otp auto verify, react native sms retriever api, automatic otp detection android, react native otp autofill, sms retriever react native, otp verification library react native, google play compliant otp library

## License

MIT

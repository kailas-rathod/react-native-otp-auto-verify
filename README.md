# react-native-otp-auto-verify

<div align="center">

[![npm version](https://img.shields.io/npm/v/react-native-otp-auto-verify.svg?style=flat-square)](https://www.npmjs.com/package/react-native-otp-auto-verify)
[![npm downloads](https://img.shields.io/npm/dm/react-native-otp-auto-verify.svg?style=flat-square)](https://www.npmjs.com/package/react-native-otp-auto-verify)
[![license](https://img.shields.io/npm/l/react-native-otp-auto-verify.svg?style=flat-square)](https://github.com/kailas-rathod/react-native-otp-auto-verify/blob/main/LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

Automatic OTP detection on **Android** using the **Google SMS Retriever API** (no `READ_SMS` permission required).

</div>

## Table of contents

- [Features](#features)
- [Platform support](#platform-support)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [1) Get your app hash](#1-get-your-app-hash)
  - [2) Format your OTP SMS](#2-format-your-otp-sms)
  - [3) Hook usage (recommended)](#3-hook-usage-recommended)
  - [4) Imperative usage](#4-imperative-usage)
- [API](#api)
- [Timeout behavior](#timeout-behavior)
- [React Native New Architecture](#react-native-new-architecture)
- [Troubleshooting](#troubleshooting)
- [Example app](#example-app)
- [Contributing](#contributing)
- [License](#license)

## Features

- Automatically extracts **4–6 digit** OTPs from SMS on Android
- Uses Google **SMS Retriever API** (Play Store compliant, **no SMS permissions**)
- Includes a **React hook** and an **imperative** API
- Fully typed (**TypeScript**)
- **React Native New Architecture** (TurboModules) supported
- iOS is a **safe no-op** (manual OTP entry required)

## Platform support

| Platform | Support | Notes                                   |
| -------- | ------- | --------------------------------------- |
| Android  | ✅      | Requires Google Play services on device |
| iOS      | ⚠️      | Safe no-op (no auto-read)               |

## Requirements

- React Native: **0.60+** (autolinking)
- Android: **minSdkVersion 24+**
- iOS: supported as a **no-op** (you still need manual OTP UI)

## Installation

```sh
npm install react-native-otp-auto-verify
# or
yarn add react-native-otp-auto-verify
# or
pnpm add react-native-otp-auto-verify
```

iOS (React Native CLI projects):

```sh
npx pod-install
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
<#> Your verification code is 123456
AbCdEfGhIjK
```

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

## API

### `useOtpVerification(options?)`

- **options**
  - `numberOfDigits?: 4 | 5 | 6` (default `6`)
- **returns**
  - `hashCode: string`
  - `otp: string | null`
  - `sms: string | null`
  - `timeoutError: boolean`
  - `startListening(): Promise<void>`
  - `stopListening(): void`

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

## License

MIT

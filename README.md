# Clinic Reception

A local-first Expo application for managing clinic patients and appointments.

## Requirements

- Node.js 20 LTS or later
- pnpm 9 or later
- Xcode (for iOS) or Android Studio (for Android), when running native simulators

## Run locally

```sh
pnpm install
pnpm start
```

Use `pnpm ios`, `pnpm android`, or `pnpm web` to open a platform directly.

## Quality checks

```sh
pnpm typecheck
pnpm format
pnpm build
```

## Data and security

Patient and appointment data is stored locally on the device with AsyncStorage. It is not encrypted and should only be used on managed, access-controlled devices. Do not place service-account JSON, Telegram tokens, API keys, or other credentials in the app or in `EXPO_PUBLIC_*` variables. Future integrations must use an authenticated backend and short-lived user/session tokens.

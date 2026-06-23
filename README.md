# Field Service Assistant

Expo iOS app for organizing field service groups and leader assignments.

## Development

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm run ios
```

The current app shell is intentionally minimal: a single start screen at
`src/app/index.tsx` rendered through Expo Router.

## Architecture

This project uses an MVC-inspired structure that fits React Native and Expo Router:

- `src/models`: domain shapes and constants.
- `src/services`: backend and optimization boundaries.
- `src/controllers`: screen state, navigation, and service orchestration.
- `src/views`: presentational UI components.
- `src/app`: Expo Router route entry points kept as thin screen adapters.

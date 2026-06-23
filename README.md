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

## Theme

Use `src/styles/theme.ts` for all UI colors. The current palette is dark base
`#0F1117`, off-white text `#F9FAFB`, mint `#3DD6A0`, deep forest `#105542`,
and purple `#5B2D8E`.

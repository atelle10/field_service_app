<img width="250" height="250" alt="field_service_assistant1024" src="https://github.com/user-attachments/assets/c3856fe4-9de9-49e1-bc91-37dec7d6c8cc" />



# Service Group Planner

Service Group Planner is an Expo React Native app for organizing field service groups into vehicles. It helps a user choose the number of publishers and vehicles, generate a suggested distribution, edit the result, save useful assignments, and use the active group during service.

The app is currently optimized for iOS, with shared React Native code that can also support Android through Expo/EAS.

## Purpose

The app is designed for a practical field-service workflow:

- Select the number of publishers in the group.
- Select the number of available vehicles.
- Generate a vehicle assignment using a configurable distribution strategy.
- Rename vehicles and publishers.
- Manually move publishers between vehicles with drag and drop.
- Save and restore previous results.
- Maintain a saved publisher list.
- Use Service View to count repeated publisher selections during an active service session.
- Switch between English and Spanish.

The goal is to reduce repeated manual planning while still allowing the user to adjust the final arrangement.

## Development

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Run on iOS:

```bash
npm run ios
```

Run validation:

```bash
npm test
npm run lint
npx tsc --noEmit
```

Create an iOS EAS build:

```bash
npx eas build --platform ios --profile preview
```

## Architecture

This project uses an MVC-inspired structure adapted for Expo Router and React Native.

React Native apps do not map perfectly to traditional server-side MVC, so this codebase uses the pattern pragmatically:

- Models define domain data shapes and constants.
- Services contain business rules, persistence, and pure state helpers.
- Controllers connect views to session state, navigation, and service actions.
- Views render UI and keep styling separated in stylesheet files.
- Routes stay thin and delegate to controllers/views.

This keeps calculation logic, persistence, and UI behavior separated enough to test and evolve independently.

## Project Structure

```text
src/
  app/          Expo Router route entry points
  assets/       App logos and image assets
  context/      App-wide session provider
  controllers/  View controllers and screen-facing hooks
  i18n/         English/Spanish translations and helpers
  models/       Domain types, constants, and option lists
  services/     Distribution, session, and persistence logic
  styles/       Shared theme values
  views/        Presentational screens, drawers, and modals
tests/          Unit tests for pure services and persistence helpers
```

### Routes

`src/app` contains thin route files for:

- Start screen
- Language selection
- Publisher count selection
- Vehicle count selection
- Results
- Publishers
- Options
- History
- Info

Route files should stay small. New UI should generally live in `src/views`, and route behavior should generally live in `src/controllers`.

### Models

`src/models/group-assignment.ts` defines the core domain objects:

- publishers/passengers
- publisher profiles
- vehicles
- vehicle assignments
- distribution requests/responses
- result summaries
- app preferences
- distribution strategy IDs

It also defines defaults such as the default vehicle capacity and picker option ranges.

### Services

`src/services/group-assignment-service.ts` owns the distribution algorithm. It currently supports:

- minimizing vehicles
- maximizing comfort
- default publisher and vehicle creation
- localized validation messages
- rerun checks

`src/services/group-session-service.ts` owns pure session transformations, including:

- creating active result state
- marking results stale
- resizing publisher/vehicle counts
- editing vehicle labels and capacities
- assigning publisher names
- restoring default labels
- moving publishers between vehicles
- enabling/disabling Service View
- restoring saved results

`src/services/persistent-storage-service.ts` owns AsyncStorage access for:

- active session snapshots
- saved publisher profiles
- saved results
- preferences
- first-launch/start-screen state
- language-selection state
- storage usage estimates

### Context

`src/context/group-session-context.tsx` is the app-level session provider. It hydrates persisted data, exposes session actions, handles save/clear feedback, coordinates destructive-action confirmation, and keeps active results available across routes.

### Controllers

Controllers in `src/controllers` are screen-facing hooks. They translate app/session behavior into props that views can render. This keeps view components from directly owning routing and persistence details.

### Views

Views in `src/views` render the app UI. New complex views should use a sibling stylesheet file, for example:

```text
results-screen.tsx
results-screen.styles.ts
```

The app uses a dark outdoor-readable palette from `src/styles/theme.ts`.

## Persistence

The app uses `@react-native-async-storage/async-storage` for on-device persistence.

Persisted app-owned data includes:

- saved publisher profiles
- saved result history
- active session state
- app preferences
- first-launch state
- selected language state

Saved results are not automatic unless the user enables auto-save. Publisher names are saved automatically when created.

## Localization

The app has an in-app localization layer in `src/i18n`.

Supported languages:

- English
- Spanish

The product name remains `Service Group Planner`, while generated labels such as publisher and vehicle names are localized when appropriate.

## Open Source Credits

This app is built with and depends on several open-source libraries:

- Expo
- React
- React Native
- Expo Router
- Expo Dev Client
- Expo Splash Screen
- Expo Status Bar
- Expo Constants
- Expo Linking
- AsyncStorage
- React Native Picker
- Lucide React Native
- React Native Reanimated
- React Native Gesture Handler
- React Native Safe Area Context
- React Native Screens
- React Native SVG
- React Native Web
- TypeScript
- ESLint

Additional transitive dependencies are managed through npm and Expo.

## Repository

GitHub:

```text
https://github.com/atelle10/field_service_app
```

## Notes

The Expo project slug remains `field_service_app` so EAS builds stay linked to the existing Expo project ID. The native display name is shortened to `SG Planner` for iOS/Android home-screen labels, while the full app name is retained in the app UI and project documentation.

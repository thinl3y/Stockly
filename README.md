# Stockly – Household Essentials and Shopping Tracker

> Know what you have. Remember what you need.

Stockly is a React Native (Expo) app for Android and iOS that tracks household essentials, flags items that are running low, builds a shopping list and keeps a purchase history. Data is stored per user in Firebase (Authentication + Cloud Firestore).

University Project II.

---

## Contents

1. [Status by phase](#1-status-by-phase)
2. [Architecture](#2-architecture)
3. [Dependencies](#3-dependencies)
4. [Folder structure](#4-folder-structure)
5. [Getting the project running on Windows](#5-getting-the-project-running-on-windows)
6. [Firebase setup](#6-firebase-setup)
7. [Firestore security rules](#7-firestore-security-rules)
8. [Running on Android](#8-running-on-android)
9. [Testing on iOS](#9-testing-on-ios)
10. [Troubleshooting](#10-troubleshooting)
11. [Git and GitHub](#11-git-and-github)

---

## 1. Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup, navigation, theme, reusable components, Firebase connection, security rules | ✅ Done |
| 2 | Register, login, forgot password, persistent session, logout | Next |
| 3 | Inventory CRUD, categories, stock status, search and filters | |
| 4 | Shopping list, purchase workflow, purchase history | |
| 5 | Dashboard statistics, polish, validation, Android and iOS testing | |

Screens built in later phases currently show a small "Built in Phase N" placeholder so the navigation can be tested now. The placeholder component (`src/components/PhasePlaceholder.tsx`) is removed in Phase 5.

---

## 2. Architecture

```
┌──────────────────────────── Stockly app (one TypeScript codebase) ─────────────────────────────┐
│                                                                                                 │
│   Screens (UI only)  ──uses──▶  Reusable components (AppButton, ItemCard, StatusBadge, …)       │
│        │                                                                                        │
│        │ reads user from                       calls                                            │
│        ▼                                         ▼                                              │
│   AuthContext (React Context)          Services (inventoryService, shoppingService, …)          │
│        │                                         │                                              │
│        └───────────────┬─────────────────────────┘                                              │
│                        ▼                                                                        │
│              services/firebase.ts  (initialises Firebase once, reads keys from .env)            │
└────────────────────────┼────────────────────────────────────────────────────────────────────────┘
                         ▼
          Firebase Authentication  +  Cloud Firestore  (users/{uid}/…)
```

Key decisions:

- **No custom backend.** Firebase handles accounts and data. The Firebase JS SDK runs inside the app.
- **Screens never talk to Firestore directly.** All reads and writes go through `src/services/*`, which convert Firestore `Timestamp`s to normal `Date`s. This keeps screens simple and makes the data layer easy to explain in the report.
- **Live data.** Later phases use Firestore `onSnapshot` listeners, so a change on one screen (e.g. marking something purchased) instantly updates the dashboard, inventory and history.
- **Auth-driven navigation.** `RootNavigator` shows the Welcome/Login/Register screens when signed out and the tabbed app when signed in. Signing in or out swaps the screen group automatically.
- **Session persistence.** Firebase Auth is initialised with `getReactNativePersistence(AsyncStorage)`, so the user stays signed in after closing the app.
- **Per-user isolation.** Every document is stored under `users/{uid}`, and the security rules only allow access when `uid` matches the signed-in user.

### Navigation map

```
NavigationContainer
└── Root native stack
    ├── (signed out)  Welcome → Login / Register
    └── (signed in)   Tabs ─┬─ Home
                            ├─ Inventory
                            ├─ ShoppingList
                            ├─ History
                            └─ Profile
                      ItemDetails   (pushed on top of tabs)
                      AddItem       (modal on iOS)
                      EditItem      (same form screen as AddItem)
```

### Firestore data model

```
users/{userId}                         fullName, email, createdAt
users/{userId}/items/{itemId}          name, category, status, quantity, unit, notes, createdAt, updatedAt
users/{userId}/shoppingList/{id}       itemId|null, name, category, quantity, unit, purchased, createdAt, purchasedAt
users/{userId}/purchaseHistory/{id}    itemId|null, shoppingItemId, name, category, quantity, unit, purchasedAt
```

`status` is stored as `available`, `low_stock` or `out_of_stock`. Purchase history copies the item's name and category, so history survives even if the inventory item is later deleted.

---

## 3. Dependencies

All versions were resolved for **Expo SDK 58** (React Native 0.88, React 19.3). Everything runs in the standard **Expo Go** app, so no Android Studio or Xcode build is needed during development.

| Package | Why |
|---|---|
| `expo` | Toolchain, dev server, Expo Go support |
| `react`, `react-native` | UI framework |
| `typescript` | Type checking |
| `@react-navigation/native` | Navigation core |
| `@react-navigation/native-stack` | Stack screens (auth flow, Add/Edit/Details) |
| `@react-navigation/bottom-tabs` | The five main tabs |
| `react-native-screens`, `react-native-safe-area-context` | Required by React Navigation; handle notches and home indicators |
| `firebase` | Authentication and Cloud Firestore (JS SDK, works in Expo Go) |
| `@react-native-async-storage/async-storage` | Stores the Firebase session on the device |
| `@expo/vector-icons` | Ionicons icon set |
| `expo-status-bar` | Status bar colour |

Nothing else is needed. Expo Notifications is only added if the optional reminders feature is built after Phase 5.

---

## 4. Folder structure

```
Stockly/
├── App.tsx                     App entry: providers + navigation container
├── index.ts                    Registers App with Expo
├── app.json                    Expo config (name, icons, scheme)
├── .env.example                Template for your Firebase keys  → copy to .env
├── firestore.rules             Security rules to publish in the Firebase console
├── tsconfig.json
├── package.json
└── src/
    ├── components/
    │   ├── AppButton.tsx         Primary / secondary / outline / danger / ghost buttons, loading state
    │   ├── AppTextInput.tsx      Labelled input with icon, error text, password toggle
    │   ├── EmptyState.tsx        Friendly "nothing here yet" block with optional action
    │   ├── ItemCard.tsx          Inventory item row (name, category, quantity, notes, status)
    │   ├── LoadingScreen.tsx     Full-screen loader while a session is restored
    │   ├── PhasePlaceholder.tsx  Temporary; removed in Phase 5
    │   ├── StatusBadge.tsx       Green / amber / red stock pill
    │   └── SummaryCard.tsx       Dashboard statistic tile
    ├── constants/
    │   ├── inventory.ts          Categories, stock statuses, their icons and colours
    │   └── theme.ts              Colours, spacing, radius, typography, shadow
    ├── contexts/
    │   └── AuthContext.tsx       Signed-in user + session restore
    ├── navigation/
    │   ├── RootNavigator.tsx     Auth stack vs. app stack
    │   └── TabNavigator.tsx      Bottom tabs
    ├── screens/                  One file per screen (see §1 for which are complete)
    ├── services/
    │   └── firebase.ts           Firebase initialisation (inventory/shopping/history services arrive in Phases 3–4)
    ├── types/
    │   ├── index.ts              Data interfaces (InventoryItem, ShoppingListItem, PurchaseRecord, …)
    │   └── navigation.ts         Route parameter types for every navigator
    └── utils/
        ├── format.ts             Date and quantity formatting
        ├── greeting.ts           "Good Morning" etc. from local time
        └── validation.ts         Email, required field and quantity checks
```

Changes from the suggested structure, and why:

- **`AppTextInput.tsx` and `LoadingScreen.tsx` added**: every form and the session-restore step need them, so they are shared rather than copied into each screen.
- **`constants/inventory.ts` added**: one place defines the five categories and three stock statuses with their labels, icons and colours. The badge, filters and forms all read from it.
- **`types/navigation.ts` added**: keeps route parameter types separate from data types; `types/index.ts` re-exports both.
- **No separate `EditItemScreen.tsx`**: Add and Edit use the same form, so `AddItemScreen.tsx` is registered under both the `AddItem` and `EditItem` routes and switches mode by route name. One form means one set of validation rules.
- **`inventoryService.ts`, `shoppingService.ts`, `historyService.ts`** are created in the phases that use them (3 and 4), so no empty files exist now.

---

## 5. Getting the project running on Windows

### Requirements

- **Node.js 22 LTS or 24 LTS** (Expo SDK 58 needs Node 22.13 or newer). Check with `node -v`. Download from https://nodejs.org.
- **Git** for Windows: https://git-scm.com
- **Visual Studio Code**
- **Expo Go** on your phone (Google Play / App Store). It must support SDK 58; update it if the app asks.

### Option A: use the project you were given (recommended)

Unzip `Stockly.zip`, then in VS Code open the `Stockly` folder and open a terminal (**Terminal → New Terminal**, PowerShell is fine):

```powershell
npm install
copy .env.example .env
```

Fill in `.env` (see §6), then:

```powershell
npx expo start --clear
```

### Option B: recreate it from scratch (for your report)

These are the exact commands that produced this project:

```powershell
npx create-expo-app@latest Stockly --template blank-typescript
cd Stockly
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
npx expo install firebase @react-native-async-storage/async-storage @expo/vector-icons
```

Always use `npx expo install` rather than `npm install <package>` for app libraries. It picks versions that match the Expo SDK.

### Verify the project

```powershell
npx tsc --noEmit        # TypeScript check, should print nothing
npx expo-doctor         # checks dependency versions and config
```

---

## 6. Firebase setup

1. Go to https://console.firebase.google.com and click **Create a project**. Name it e.g. `stockly`. Google Analytics is not needed.
2. **Register a web app.** Project overview → click the **`</>` (Web)** icon → nickname `Stockly` → **Register app**. You do not need Firebase Hosting.
   The Firebase JS SDK is used, so the *web* config is the correct one for Android and iOS here. You do **not** need `google-services.json` or `GoogleService-Info.plist`.
3. Firebase shows a `firebaseConfig` object. Copy each value into your `.env` file:

   | `firebaseConfig` key | `.env` variable |
   |---|---|
   | `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
   | `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
   | `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
   | `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

   No quotes and no spaces around `=`. Example line: `EXPO_PUBLIC_FIREBASE_PROJECT_ID=stockly-1a2b3`
   You can find these again later under **Project settings → General → Your apps**.
4. **Enable Email/Password sign-in.** Build → **Authentication** → Get started → **Sign-in method** → Email/Password → Enable → Save.
5. **Create the database.** Build → **Firestore Database** → Create database → choose a location close to you (e.g. `asia-south1` Mumbai) → start in **production mode**.
6. **Publish the security rules** from §7.
7. Restart Expo so it reads `.env`: `npx expo start --clear`.

The Welcome screen shows a red warning if any value is missing. In development it also shows "Connected to Firebase project: …" when the config loaded.

> **Is the API key a secret?** A Firebase web API key only identifies your project; the security rules are what protect the data. It is still kept in `.env` and out of Git, as the brief requires.

---

## 7. Firestore security rules

The rules are in [`firestore.rules`](firestore.rules). Open Firebase console → Firestore Database → **Rules**, replace everything with the file's contents and click **Publish**.

What they enforce:

- Only signed-in users can access anything, and only under `users/{their own uid}`.
- Everything outside `users/{uid}` is denied (Firestore denies by default).
- Items and shopping entries must have a non-empty name (≤ 100 chars), one of the five categories, a valid status, and a non-negative quantity if given.
- Purchase history records can be created and read but never edited.

You can test them in the console's **Rules Playground**: try reading `users/someoneElse/items/x` as an authenticated user with a different UID. It should be denied.

---

## 8. Running on Android

### On your Android phone (easiest)

1. Install **Expo Go** from the Play Store.
2. Make sure the phone and laptop are on the **same Wi-Fi network**.
3. Run `npx expo start` in VS Code.
4. In Expo Go, tap **Scan QR code** and scan the code in the terminal.

### On the Android emulator

1. Install **Android Studio** → More Actions → **Virtual Device Manager** → create a Pixel device with a recent system image → start it.
2. Run `npx expo start` and press **`a`** in the terminal.

### What to check for Phase 1

- [ ] The app opens on the Welcome screen with the basket logo, tagline and three feature rows.
- [ ] "Connected to Firebase project: <your project id>" appears (no red warning).
- [ ] **Get Started** opens the Register placeholder; the back arrow returns.
- [ ] **I already have an account** opens the Login placeholder.
- [ ] No red error screen and no Firebase warnings in the terminal.

The tabs are reachable once sign-in exists in Phase 2.

---

## 9. Testing on iOS

You are on Windows, so you cannot run the iOS Simulator (it needs macOS and Xcode). The same code runs on iOS because it uses only React Native, Expo Go-compatible libraries and the Firebase JS SDK; no Android-only APIs are used. It still has to be **verified on a real iPhone**:

1. Install **Expo Go** from the App Store on an iPhone (yours, a friend's or a lab device).
2. Same Wi-Fi as the laptop. Run `npx expo start`.
3. Open the **Camera** app and point it at the QR code. Tap the banner to open in Expo Go.
4. If the phone and laptop cannot see each other (common on university Wi-Fi), run `npx expo start --tunnel` instead. The first time it may ask to install `@expo/ngrok`; accept.

Run through the same checklist as Android. Things that differ on iOS and are worth checking in each phase: the notch/home indicator spacing, the Add Item screen opening as a swipe-down modal, and the keyboard not covering inputs.

For your report, take screenshots on both platforms. If you have no iPhone at all, say so in the report and note that iOS verification was done through Expo Go on a borrowed device or is pending; do not claim it was tested if it was not.

Optional, later: a Mac with Xcode can run `npx expo start` and press **`i`** for the Simulator, and EAS Build (`npx eas-cli@latest build -p ios`) can make an installable build, which needs an Apple Developer account.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Red warning "Firebase is not set up yet" | `.env` is missing, misnamed (`.env.txt`), or has empty values. In File Explorer enable **View → File name extensions**. Then run `npx expo start --clear`. |
| `auth/invalid-api-key` or `auth/configuration-not-found` | A value in `.env` was copied wrong, or Email/Password sign-in is not enabled (§6 step 4). |
| `Missing or insufficient permissions` | Rules not published, or the code is reading a path that does not include the signed-in user's UID. |
| `Component auth has not been registered yet` | Delete `node_modules` and `package-lock.json`, run `npm install`, then `npx expo start --clear`. Make sure only one `firebase` version is installed: `npm ls firebase`. |
| `Project is incompatible with this version of Expo Go` | Update Expo Go from the store. |
| QR scans but loading never finishes | Phone and laptop are on different networks, or Windows Firewall is blocking Node. Allow Node.js on Private networks, or use `npx expo start --tunnel`. |
| `npx` is not recognised / scripts disabled in PowerShell | Reinstall Node.js and reopen VS Code. For "running scripts is disabled", run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| Strange errors after installing packages | `npx expo install --fix`, then `npx expo start --clear`. |
| Android emulator not detected when pressing `a` | Start the emulator from Android Studio first, then press `a`. |
| TypeScript says `getReactNativePersistence` does not exist | Keep the `paths` entry in `tsconfig.json`; it points TypeScript at Firebase's React Native type definitions. Restart VS Code's TS server (Ctrl+Shift+P → "TypeScript: Restart TS Server"). |

---

## 11. Git and GitHub

The project is already a Git repository. To put it on GitHub:

1. Create an **empty** repository on GitHub called `stockly` (no README, no .gitignore).
2. In the VS Code terminal:

```powershell
git add .
git commit -m "Phase 1: project setup"
git branch -M main
git remote add origin https://github.com/<your-username>/stockly.git
git push -u origin main
```

`.env` is in `.gitignore`, so your Firebase keys are never pushed. Commit at the end of each phase; a clear history is useful evidence for your tutor.

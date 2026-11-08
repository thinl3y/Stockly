# Stockly – Household Essentials and Shopping Tracker

> Know what you have. Remember what you need.

Stockly is a React Native (Expo) app for Android and iOS that tracks household essentials, flags items that are running low, builds a shopping list and keeps a purchase history. Data is stored per user in Firebase (Authentication + Cloud Firestore).

University Project II.

**Features**

- Email/password accounts with password reset; stays signed in between launches
- Home dashboard: greeting, live inventory statistics, stock-health bar, items needing attention, shopping summary, quick actions
- Inventory with categories, stock status (Available / Low / Out), quantity, unit and notes; search and filters; add, edit, delete
- Shopping list from inventory or typed in, with running-low suggestions and no duplicate entries
- One-tap purchase: updates the list, records history and marks the item Available, in one transaction
- Purchase history grouped by day, with search, sorting, "buy again" and insights (most-bought items over 7 days / 30 days / all time)
- Every user's data is private, enforced by Firestore security rules
- 53 automated tests (`npm test`) and a full device test plan ([docs/TESTING.md](docs/TESTING.md))

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
12. [Demo script for your presentation](#12-demo-script-for-your-presentation)

---

## 1. Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup, navigation, theme, reusable components, Firebase connection, security rules | ✅ Done |
| 2 | Register, login, forgot password, persistent session, logout, Profile screen | ✅ Done |
| 3 | Inventory CRUD, categories, stock status, search and filters, Item Details | ✅ Done |
| 4 | Shopping list, purchase workflow, purchase history | ✅ Done |
| 5 | Dashboard, purchase statistics, polish, error handling, app icon, testing docs | ✅ Done |

All core features from the brief are complete, plus the optional *basic purchase statistics*. The optional *low-stock reminders* (Expo Notifications) were not added.

### Updating from an earlier phase

Each phase is delivered as the full project (without `node_modules`, `.env` or `.git`). Extract the zip **over your existing `Stockly` folder** and choose **Replace the files in the destination**. Your `.env`, `node_modules` and Git history are kept. Then run `npm install` (only needed if `package.json` changed) and `npx expo start --clear`.

Extracting over the folder does not delete files that a later phase removed. After Phase 5, delete `src/components/PhasePlaceholder.tsx` if it is still there (it is no longer used).

### Phase 5: dashboard, statistics and polish

- **Home dashboard.** Everything is calculated live from Firestore through the shared contexts, with nothing hardcoded:
  - A time-based greeting with your first name and today's date. Tap the avatar to open Profile.
  - Four summary cards (Total, Available, Low Stock, Out of Stock). Each opens Inventory pre-filtered.
  - A **stock health** bar showing the share of items in each status.
  - **Quick actions**: Add New Item, View Inventory, Open Shopping List.
  - A **shopping summary** with the count and names of items to buy.
  - **Needs attention**: Low and Out of Stock items, out of stock first, each with a one-tap **Add** to the shopping list.
  - **Purchases this month**.
  - A brand-new account sees a "Let's stock up" welcome card instead.
- **Purchase statistics** (optional feature). History has an **Insights** card: purchases and different items bought in the last 7 days, 30 days or all time, plus the three most-bought items with bars. The maths is in `src/utils/stats.ts` and covered by tests.
- **Error boundary.** If any screen hits an unexpected bug, the app shows "Something went wrong / Try again" instead of a blank screen (`ErrorBoundary.tsx`).
- **App icon and splash screen.** A Stockly icon (white basket on green) for iOS, Android adaptive and monochrome icons, and a splash screen through the `expo-splash-screen` config plugin. Expo Go shows its own launcher, so these appear in standalone builds.
- **Tests and docs.** 53 automated checks (`npm test`), and [docs/TESTING.md](docs/TESTING.md) with the full Android/iOS test plan.

### Phase 2: how authentication works

- **Register** validates every field on the device first (name 2–100 characters, valid email, password ≥ 6 characters, matching confirmation). Then it calls `createUserWithEmailAndPassword`, sets the Auth display name and creates `users/{uid}` with `fullName`, `email` and a server `createdAt`.
- **Login** calls `signInWithEmailAndPassword`. If the profile document is missing (for example because the network dropped during registration), it is recreated.
- **Persistent session**: Firebase Auth stores the session in AsyncStorage. On launch, `AuthContext` shows "Restoring your session…" until Firebase reports the saved user, then `RootNavigator` opens the tabs directly.
- **Forgot password** sends Firebase's reset email. New Firebase projects have *email enumeration protection* on, so Firebase does not reveal whether an address has an account. The app shows a neutral "if an account exists…" message for the same reason.
- **Logout** asks for confirmation and calls `signOut`. Navigation returns to Welcome automatically, and open Firestore listeners close without showing errors.
- **Errors**: Firebase codes are translated into plain messages in `src/utils/errors.ts`, e.g. `auth/email-already-in-use` → "An account with this email already exists."
- **Double taps**: each form ignores a second tap while a request is in progress, and the button shows a spinner.
- **Profile** shows the live name, email, member-since date and total item count. The name can be edited, which updates Firebase Auth and Firestore.

### Phase 3: how the inventory works

- **One live listener.** `InventoryContext` opens a single Firestore `onSnapshot` listener on `users/{uid}/items` and shares the list with Inventory, Item Details, Profile and (in Phase 5) Home. Any add, edit, status change or delete appears on every screen immediately, without refreshing.
- **Inventory screen**: search (matches name and notes), category chips, status chips with live counts, a coloured edge and badge per item (green / amber / red), an empty state for a new account and a "No matching items" state with **Clear filters**. Tap an item for details. Tap **⋮**, or long-press it, for Edit / Delete.
- **Add / Edit Item** (one shared form): name, category and status are required; quantity must be a number if given; unit has quick chips (pcs, pack, kg…); notes up to 300 characters. Adding an item whose name you already have asks "Add anyway?". Leaving with unsaved changes asks "Discard changes?".
- **Item Details**: full information, one-tap status change, **Add to Shopping List**, Edit and Delete.
- **Delete** always asks for confirmation. The item and its shopping-list entry are deleted together in one atomic batch. Purchase history (Phase 4) is a separate copy and is kept.
- **No duplicate shopping entries.** An item's shopping-list entry always uses the document ID `item_<itemId>`, and adding runs in a Firestore transaction. Tapping twice, or adding from two phones, cannot create two entries. Renaming an item also renames its pending shopping entry.
- **Weak connection.** Firestore applies changes on the phone straight away. If the server has not confirmed a save within 8 seconds, the form closes and says "Saved on this phone. It will sync when you are back online", instead of spinning forever. Adding to the shopping list needs a connection, because the duplicate check runs on the server.

### Phase 4: shopping list and purchase history

- **Shopping tab.** Shows everything still to buy, newest first, with the count in the header and as a badge on the tab. Each entry shows name, category, amount, date added, and an "Inventory" tag if it is linked to an inventory item. Tap **◯** to mark it purchased, or **✕** to remove it (with confirmation, no history record).
- **Running low card.** Low and out-of-stock inventory items that are not on the list yet appear at the top, each with **Add**, plus **Add all**.
- **Add to Shopping List** (the **+** button) has two tabs:
  - **From inventory**: search your items (out-of-stock first) and tap **Add**. Items already on the list show "On list".
  - **New item**: for things not in your inventory. Enter name, category and an optional amount. If the name matches an inventory item, it is linked automatically. If it is already on the list, it is refused.
- **Purchase workflow** (`markAsPurchased` in `shoppingService.ts`) runs as **one Firestore transaction**:
  1. Re-reads the entry. If it is already purchased (double tap, or another phone), it stops.
  2. Sets `purchased: true` and `purchasedAt` on the entry, which removes it from the pending view.
  3. Creates a `purchaseHistory` record with a copy of name, category, amount and the server time.
  4. If the entry is linked to an inventory item that still exists, sets its status to **Available**.

  Either all four happen or none do. The button also ignores repeated taps while a purchase is saving. Buying needs a connection (a transaction must reach the server). Offline it shows "Cannot reach the server" and changes nothing.
- **History tab.** All purchases grouped by day (Today, Yesterday, dates), with the time, a search by name, and **Newest first / Oldest first**. The 🛒 button on a record puts it back on the shopping list (linked again if the item still exists). History is a copy, so it stays when an inventory item is deleted, and the security rules forbid editing it.
- **Automated tests.** `npm test` runs 26 checks of the real shopping and purchase code against an in-memory Firestore (see §5).

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
    ├── (signed out)  Welcome → Login ⇄ Register
    │                 Login → Forgot Password
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
| `@react-navigation/elements` | Header height for keyboard handling (already part of React Navigation; listed directly since Phase 3) |
| `expo-splash-screen` | Splash screen configuration (config plugin in `app.json`) |
| `expo-system-ui` | Keeps the app in light mode and sets the root background colour (needed for `userInterfaceStyle`) |
| `esbuild` *(dev only)* | Bundles the automated tests (`npm test`). Not included in the app. |

Nothing else is needed. Expo Notifications is only added if the optional reminders feature is built after Phase 5.

---

## 4. Folder structure

```
Stockly/
├── docs/TESTING.md             Test plan with Android/iOS result columns
├── tests/
│   ├── services/               Purchase-workflow tests + test runner (npm test)
│   └── utils/                  Statistics, validation, greeting and date tests
├── assets/                     App icon, Android adaptive icons, splash logo
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
    │   ├── AuthLayout.tsx        Shared layout for Login / Register / Forgot Password (keyboard-safe)
    │   ├── CategorySelector.tsx  Category chips for the item form
    │   ├── Chip.tsx              Selectable pill used by filters and selectors
    │   ├── EmptyState.tsx        Friendly "nothing here yet" block with optional action
    │   ├── ErrorBoundary.tsx     "Something went wrong / Try again" fallback screen
    │   ├── FormMessage.tsx       Error / success banner for forms
    │   ├── FormScrollView.tsx    Keyboard-safe scroll container for screens with a header
    │   ├── ItemCard.tsx          Inventory item row (name, category, quantity, notes, status, ⋮ menu)
    │   ├── LoadingScreen.tsx     Full-screen loader while a session is restored
    │   ├── PurchaseInsights.tsx  History statistics: period switch, totals, most-bought items
    │   ├── QuantityUnitFields.tsx Quantity + unit with quick unit chips
    │   ├── SearchBar.tsx         Search field with clear button
    │   ├── SegmentedControl.tsx  Two-option switch (From inventory / New item, Newest / Oldest)
    │   ├── ShoppingItemCard.tsx  Shopping entry with ◯ purchase and ✕ remove
    │   ├── StatusBadge.tsx       Green / amber / red stock pill
    │   ├── StatusSelector.tsx    Available / Low Stock / Out of Stock buttons
    │   ├── SummaryCard.tsx       Dashboard statistic tile
    │   ├── TextLink.tsx          "Don't have an account? Sign up" style links
    │   └── Toast.tsx             Short confirmation bar ("Bought Rice…")
    ├── constants/
    │   ├── inventory.ts          Categories, stock statuses, their icons and colours
    │   └── theme.ts              Colours, spacing, radius, typography, shadow
    ├── contexts/
    │   ├── AuthContext.tsx       Signed-in user, profile, register/login/logout/reset
    │   ├── InventoryContext.tsx  One live list of the user's items, shared by all screens
    │   └── ShoppingContext.tsx   One live list of items still to buy (tab badge, details, Home)
    ├── hooks/
    │   └── usePurchaseHistory.ts Live purchase history (History tab and Home)
    ├── navigation/
    │   ├── RootNavigator.tsx     Auth stack vs. app stack
    │   └── TabNavigator.tsx      Bottom tabs
    ├── screens/                  One file per screen (see §1 for which are complete)
    │   └── AddShoppingItemScreen.tsx  Add to shopping list: from inventory or a new item
    ├── services/
    │   ├── firebase.ts           Firebase initialisation (reads .env)
    │   ├── authService.ts        Register, login, logout, password reset, change name
    │   ├── userService.ts        users/{uid} profile document
    │   ├── inventoryService.ts   Items: live list, add, update, change status, delete
    │   ├── shoppingService.ts    Shopping list: add (no duplicates), remove, purchase transaction
    │   ├── historyService.ts     Live purchase history (read-only)
    │   ├── paths.ts              All Firestore paths in one place
    │   └── firestoreHelpers.ts   Timestamp → Date, "saved offline" handling
    ├── types/
    │   ├── index.ts              Data interfaces (InventoryItem, ShoppingListItem, PurchaseRecord, …)
    │   └── navigation.ts         Route parameter types for every navigator
    └── utils/
        ├── confirm.ts            Confirmation dialogs (delete, discard changes)
        ├── errors.ts             Firebase error codes → friendly messages
        ├── format.ts             Date and quantity formatting
        ├── greeting.ts           "Good Morning" etc., first name, initials, today's date
        ├── stats.ts              Purchase statistics (periods, most-bought items, this month)
        └── validation.ts         Email, required field and quantity checks
```

Changes from the suggested structure, and why:

- **`ForgotPasswordScreen.tsx` added**: password reset has its own screen (reached from Login) so the Login form stays simple.
- **`authService.ts` and `userService.ts` added**: Firebase Auth calls and the profile document are kept out of the screens, like the other services.
- **`AuthLayout.tsx`, `FormMessage.tsx`, `TextLink.tsx` added**: the three auth screens share one layout and message style.
- **`AppTextInput.tsx` and `LoadingScreen.tsx` added**: every form and the session-restore step need them, so they are shared rather than copied into each screen.
- **`constants/inventory.ts` added**: one place defines the five categories and three stock statuses with their labels, icons and colours. The badge, filters and forms all read from it.
- **`types/navigation.ts` added**: keeps route parameter types separate from data types; `types/index.ts` re-exports both.
- **No separate `EditItemScreen.tsx`**: Add and Edit use the same form, so `AddItemScreen.tsx` is registered under both the `AddItem` and `EditItem` routes and switches mode by route name. One form means one set of validation rules.
- **`InventoryContext.tsx` added**: the brief asks for Context API state management; sharing one listener is faster and cheaper (fewer Firestore reads) than one per screen.
- **`paths.ts` and `firestoreHelpers.ts` added**: shared by all services so Firestore paths and date conversion are defined once.
- **Selector and filter components added** (`Chip`, `SearchBar`, `CategorySelector`, `StatusSelector`, `FormScrollView`): reused by the Inventory screen, the item form and Item Details.
- **`ShoppingContext.tsx` added**: like the inventory, the pending shopping list is one shared listener (used by the Shopping tab and its badge, Item Details and the Add screen).
- **`AddShoppingItemScreen.tsx` added**: one screen for both ways of adding to the list (from inventory, or a new item), opened as a modal.
- **`tests/` and `docs/` added**: automated tests (`npm test`) and the device test plan.
- **`hooks/usePurchaseHistory.ts` added**: History and Home both need live history; a hook avoids duplicating the listener code.
- **`ErrorBoundary.tsx` and `PurchaseInsights.tsx` added** in Phase 5 for error handling and the optional statistics.

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
npm test                # 53 automated checks (purchase workflow + helpers)
```

`npm test` runs the real code in `src/services/shoppingService.ts` and `inventoryService.ts` against an in-memory copy of Firestore that behaves like the real one: transactions read first, commit atomically, and retry when another write got there first. It checks, among other things, that a double tap or two phones buying the same entry at once still produce **exactly one** history record, that deleting an item keeps its history, and that buying an item deleted elsewhere still works. No phone, Firebase project or internet connection is needed. A second suite tests the statistics, validation, greeting and date helpers. Expected output ends with `All test suites passed.`

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
- Purchase history records can be created and read but never edited, and their `purchasedAt` must be the server's time, so records cannot be back-dated.

> **Updated in Phase 4.** If you published the rules in an earlier phase, publish them again from the new `firestore.rules`.

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

### What to test

The complete checklist, with Android and iOS result columns, is in **[docs/TESTING.md](docs/TESTING.md)**. It covers sign-in, the dashboard, inventory, shopping, purchases, history, profile, sync and security rules, platform differences and error states.

**Before testing Phase 4 or later:** publish the current `firestore.rules` (§7).

---

## 9. Testing on iOS

You are on Windows, so you cannot run the iOS Simulator (it needs macOS and Xcode). The same code runs on iOS because it uses only React Native, Expo Go-compatible libraries and the Firebase JS SDK; no Android-only APIs are used. It still has to be **verified on a real iPhone**:

1. Install **Expo Go** from the App Store on an iPhone (yours, a friend's or a lab device).
2. Same Wi-Fi as the laptop. Run `npx expo start`.
3. Open the **Camera** app and point it at the QR code. Tap the banner to open in Expo Go.
4. If the phone and laptop cannot see each other (common on university Wi-Fi), run `npx expo start --tunnel` instead. The first time it may ask to install `@expo/ngrok`; accept.

Run through the same checklist as Android ([docs/TESTING.md](docs/TESTING.md)); section 10 there lists the checks where iOS and Android behave differently (notch and home indicator, keyboard, swipe-down sheets, swipe-back, action sheets).

For your report, take screenshots on both platforms. If you have no iPhone at all, say so in the report and note that iOS verification was done through Expo Go on a borrowed device or is pending; do not claim it was tested if it was not.

Optional, later: a Mac with Xcode can run `npx expo start` and press **`i`** for the Simulator, and EAS Build (`npx eas-cli@latest build -p ios`) can make an installable build, which needs an Apple Developer account. An installable Android APK for your tutor can be built for free with a free Expo account: run `npx eas-cli@latest build:configure`, set `"preview": { "android": { "buildType": "apk" } }` under `build` in the generated `eas.json`, then run `npx eas-cli@latest build -p android --profile preview`. Expo emails you a download link. Before building, change `com.stockly.app` in `app.json` (`ios.bundleIdentifier` and `android.package`) to something unique, e.g. `com.yourname.stockly`.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Red warning "Firebase is not set up yet" | `.env` is missing, misnamed (`.env.txt`), or has empty values. In File Explorer enable **View → File name extensions**. Then run `npx expo start --clear`. |
| `auth/invalid-api-key` or `auth/configuration-not-found` | A value in `.env` was copied wrong, or Email/Password sign-in is not enabled (§6 step 4). |
| "Email/Password sign-in is not enabled" when registering | Firebase console → Authentication → Sign-in method → Email/Password → Enable. |
| Registered, but no `users/<uid>` document in Firestore | The Firestore database was not created or the rules from §7 are not published. Fix that, then log out and log in: the profile document is recreated on login. |
| Password reset email never arrives | Check spam. In Firebase console → Authentication → Templates you can see the sender. Remember no email is sent if no account uses that address. |
| "Too many attempts" | Firebase temporarily blocks an address after repeated wrong passwords. Wait a few minutes, or use Forgot password. |
| Keyboard covers a text field | Scroll the form; all forms scroll. If it still happens on a specific phone, note the model and tell me. |
| `Unable to resolve "@react-navigation/elements"` after updating to Phase 3 | Run `npm install` (Phase 3 added it to `package.json`), then `npx expo start --clear`. |
| "Saved offline" appears even though you are online | The server took more than 8 seconds to confirm. Check the connection; the change syncs automatically. If it happens every time, check that the Firestore database exists and the rules in §7 are published. |
| Add to Shopping List says "Cannot reach the server" | It needs a connection (the duplicate check runs on the server). Try again when online. |
| Ticking ◯ says "Missing or insufficient permissions" | Publish the Phase 4 `firestore.rules` (§7). The new purchase-history rule must be live. |
| History tab says "Couldn't load your history" with an index message | Should not happen (history is sorted by one field, which needs no index). If it does, open the link in the error once to create the index in Firebase. |
| `npm test` fails with "Cannot find package 'esbuild'" | Run `npm install` (Phase 4 added esbuild as a dev dependency). |
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
git commit -m "Phase 1: project setup"   # then: git commit -m "Phase 2: authentication" … "Phase 5: dashboard & polish"
git branch -M main
git remote add origin https://github.com/<your-username>/stockly.git
git push -u origin main
```

`.env` is in `.gitignore`, so your Firebase keys are never pushed. Commit at the end of each phase; a clear history is useful evidence for your tutor.

---

## 12. Demo script for your presentation

A 5–7 minute walk-through that shows every requirement. Prepare a fresh account beforehand, or delete the test data in Firestore.

1. **Welcome and register** (requirement 1). Open the app, tap Get Started, show a validation error (mismatched passwords), then register. Point out the Firebase console → Authentication user and the `users/<uid>` document.
2. **Empty states.** Home shows "Let's stock up"; Inventory and History show their empty states.
3. **Add items** (requirements 3–5). Add 5–6 items across categories with different statuses, one with quantity, unit and notes. Show a required-field error once.
4. **Dashboard** (requirement 11). Go Home: the counts, stock-health bar and Needs attention list match what you added. Tap the Out of Stock card to show the filtered inventory.
5. **Search and filter** (requirement 6). Search by name, then filter by category and status.
6. **Item details.** Change a status with one tap and show that the dashboard updated without refreshing. Edit the name. Delete an item and confirm.
7. **Shopping list** (requirements 7–8). Use Running low → Add all, add a manual item ("Bread, 2 pack"), and show that adding a duplicate is refused.
8. **Purchase workflow** (requirements 9–10). Tick an item. Show the toast, the item becoming Available in Inventory, and the new record in History and in Firestore (`purchaseHistory`).
9. **History and statistics.** Show grouping, sorting, search, Insights, and Buy again.
10. **Persistence and logout** (requirements 2, 12, 14). Close and reopen the app (still signed in, data still there), then log out from Profile.
11. **Security** (section 7). Show `firestore.rules` and one Rules Playground denial.
12. **Quality.** Run `npm test` in the terminal (53 checks pass) and show `docs/TESTING.md` with your Android and iOS results.


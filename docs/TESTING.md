# Stockly – Test Plan and Results

This document is the test plan for Stockly. Fill in the **Android** and **iOS** columns as you test (✅ pass, ❌ fail, — not tested), then copy the tables into your Project II report.

There are two kinds of testing:

1. **Automated tests** (`npm test`) check the data logic without a phone.
2. **Manual device tests** (sections 3–11) check the real app on Android and iOS against your Firebase project.

---

## 1. Test environment

Fill this in for your report.

| | Android | iOS |
|---|---|---|
| Device model | | |
| OS version | | |
| How the app was run | Expo Go (SDK 58) | Expo Go (SDK 58) |
| Network | Wi-Fi / tunnel | Wi-Fi / tunnel |
| Date tested | | |
| Firebase project ID | | |

**How iOS is tested from a Windows laptop:** Windows cannot run the iOS Simulator (it needs macOS and Xcode). Instead, install **Expo Go** from the App Store on an iPhone (your own, a friend's or a lab device), run `npx expo start` (or `npx expo start --tunnel` on university Wi-Fi), and scan the QR code with the iPhone's Camera app. The iPhone runs the same JavaScript code as Android. If no iPhone was available, write "iOS: not tested (no device available)" in the report rather than marking tests as passed.

---

## 2. Automated tests

Run in the VS Code terminal:

```powershell
npm test
```

| Suite | What it checks | Checks |
|---|---|---|
| Shopping & purchase workflow (`tests/services/`) | The real `shoppingService.ts` and `inventoryService.ts` code against an in-memory Firestore that behaves like the real one (transactions read first, commit atomically, retry on conflict). Includes double taps and two phones buying at once. | 26 |
| Helpers (`tests/utils/`) | Purchase statistics (7 days / 30 days / all time, most-bought items), email and quantity validation, greetings, initials, date labels, quantity formatting. | 27 |

Expected result: `All test suites passed.`

A sample of what the workflow tests prove:

- Adding the same inventory item to the shopping list twice, even at the same moment, creates **one** entry.
- Marking an entry purchased creates **exactly one** history record, even with repeated or simultaneous taps.
- Buying a linked item sets the inventory item to **Available**. Buying a manual item does not touch inventory.
- Deleting an inventory item removes its shopping entry but **keeps its purchase history**.
- Buying an item whose inventory record was deleted on another phone still works.

Also run `npx tsc --noEmit` (should print nothing) and `npx expo-doctor`.

---

## 3. Authentication

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| AUTH-01 | Required fields | Welcome → Get Started → Create Account with all fields empty | Each field shows its own error | | |
| AUTH-02 | Email format | Enter `test@example` | "Please enter a valid email address." | | |
| AUTH-03 | Password confirmation | Different passwords | "Passwords do not match." | | |
| AUTH-04 | Register | Valid name, email, password | Home opens with "Good …, *first name*!"; user in Firebase → Authentication; `users/<uid>` in Firestore | | |
| AUTH-05 | Duplicate account | Register again with the same email | "An account with this email already exists." | | |
| AUTH-06 | Wrong password | Login with wrong password | "Incorrect email or password." | | |
| AUTH-07 | Login | Correct email and password | Home opens | | |
| AUTH-08 | Persistent session | Close the app completely, reopen | Still signed in, Home opens | | |
| AUTH-09 | Forgot password | Login → Forgot password? → Send Reset Link | "Check your inbox"; email arrives (check spam); new password works | | |
| AUTH-10 | Logout | Profile → Log Out → confirm | Back on Welcome; after reopening the app, still signed out | | |
| AUTH-11 | No connection | Airplane mode → try to log in | "No internet connection…" | | |

## 4. Home dashboard

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| DASH-01 | New user | Sign in with a new account | "Let's stock up" card with Add your first item | | |
| DASH-02 | Greeting | Check at different times of day | Good Morning (5–12), Good Afternoon (12–17), Good Evening (otherwise) | | |
| DASH-03 | Live statistics | Add items with different statuses | Total / Available / Low / Out counts match Inventory; stock-health bar and % update | | |
| DASH-04 | Cards open filtered inventory | Tap the Out of Stock card | Inventory opens filtered to Out of Stock | | |
| DASH-05 | Needs attention | Have Low/Out items | Listed, out of stock first; tap opens Item Details | | |
| DASH-06 | Add from dashboard | Tap Add on a needs-attention item | Toast, row shows "On list", shopping summary count increases | | |
| DASH-07 | Shopping summary | Look at the shopping card | Shows number of items to buy and their names | | |
| DASH-08 | Quick actions | Tap each quick action | Opens Add Item, Inventory, Shopping List | | |
| DASH-09 | Purchases this month | Buy something | Count increases; tapping opens History | | |

## 5. Inventory

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| INV-01 | Empty state | Inventory on a new account | "No items yet" with Add your first item | | |
| INV-02 | Required fields | + → Save with nothing filled in | Name and category errors | | |
| INV-03 | Invalid quantity | Quantity `abc` | "Enter a number…" | | |
| INV-04 | Add item | Fill all fields, Save | Appears in list; Firestore `users/<uid>/items` has the document with `createdAt` and `updatedAt` | | |
| INV-05 | Duplicate name warning | Add a name you already have | "You already have …" prompt | | |
| INV-06 | Unsaved changes | Start adding, type a name, Cancel | "Discard changes?" | | |
| INV-07 | Search | Search part of a name, then a word from notes | Matching items only | | |
| INV-08 | Filters | Each category and status chip | List filters; status counts update | | |
| INV-09 | No matches | Filter with no results | "No matching items" → Clear filters resets | | |
| INV-10 | Details | Tap an item | Quantity, notes, added and updated dates shown | | |
| INV-11 | Quick status change | Details → tap Low Stock | Badge, list colour, dashboard counts and Firestore `status` change | | |
| INV-12 | Edit | Details → Edit → change name → Save | New name in details and list | | |
| INV-13 | Delete | Details → Delete Item → confirm | Removed from list, Firestore and the shopping list | | |
| INV-14 | List menu | ⋮ (or long-press) on an item | Edit and Delete both work | | |

## 6. Shopping list

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| SHOP-01 | Running low suggestions | Have Low/Out items not on the list | "Running low" card with Add and Add all | | |
| SHOP-02 | Tab badge | Add items | Shopping tab badge shows the count | | |
| SHOP-03 | Add from inventory | + → From inventory → Add | Added; already-listed items show "On list" | | |
| SHOP-04 | No duplicates | Try to add the same item again (any screen) | Refused / "already on your shopping list"; Firestore has one `item_<itemId>` entry | | |
| SHOP-05 | Manual item | + → New item → name, category, amount | Appears with amount, no "Inventory" tag; Firestore `itemId: null` | | |
| SHOP-06 | Auto-link | New item → type an inventory item's name | "will be linked" note; entry linked to the item | | |
| SHOP-07 | Mark purchased | Tap ◯ on a linked entry | Toast; leaves the list; inventory item becomes Available; one new `purchaseHistory` record | | |
| SHOP-08 | Repeated taps | Tap ◯ several times quickly | Exactly one history record | | |
| SHOP-09 | Manual purchase | Tap ◯ on a manual entry | History record with `itemId: null`; inventory unchanged | | |
| SHOP-10 | Remove | Tap ✕ → confirm | Removed, no history record | | |
| SHOP-11 | Offline purchase | Airplane mode → tap ◯ | "Cannot reach the server"; nothing changes | | |

## 7. Purchase history and statistics

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| HIST-01 | Empty state | History on a new account | "No purchases yet" | | |
| HIST-02 | Grouping | Buy several items | Grouped under Today / Yesterday / dates, with times | | |
| HIST-03 | Sort | Toggle Newest first / Oldest first | Order reverses | | |
| HIST-04 | Search | Search by name | Matching records only; insights hidden while searching | | |
| HIST-05 | Insights | Switch 7 days / 30 days / All time | Purchase count, different items and most-bought list update | | |
| HIST-06 | Buy again | Tap 🛒 on a record | Back on the shopping list | | |
| HIST-07 | Survives deletion | Delete an inventory item you bought earlier | Its history records remain | | |

## 8. Profile

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| PROF-01 | Details | Open Profile | Initials, name, email, member-since date | | |
| PROF-02 | Item count | Compare with Inventory | Total household items matches | | |
| PROF-03 | Edit name | Pencil → new name → Save | "Your name has been updated."; Home greeting and Firestore `fullName` change | | |

## 9. Data, sync and security

| ID | Test | Steps | Expected | Android | iOS |
|---|---|---|---|---|---|
| DATA-01 | Persistence | Close and reopen the app | Items, list and history unchanged | | |
| DATA-02 | Live sync | Change an item's status on Details, go to Home | Dashboard already updated, no refresh needed | | |
| DATA-03 | Two devices (optional) | Sign in on Android and iPhone with the same account; add an item on one | Appears on the other within seconds | | |
| DATA-04 | User isolation | Sign in as a second account | None of the first account's data is visible | | |
| SEC-01 | Rules deny other users | Firebase console → Firestore → Rules → Rules Playground: authenticated read of `users/someoneElse/items/x` | Denied | | |
| SEC-02 | Rules deny anonymous | Rules Playground: unauthenticated read of `users/<your uid>` | Denied | | |
| SEC-03 | History cannot be edited | Rules Playground: authenticated update of a `purchaseHistory` document | Denied | | |

## 10. Platform-specific checks

These are the places where Android and iOS behave differently.

| ID | Test | Expected | Android | iOS |
|---|---|---|---|---|
| PLAT-01 | Notch / status bar / home indicator | Nothing hidden under the camera notch, status bar or gesture bar | | |
| PLAT-02 | Keyboard on forms | Focus Notes in Add Item, and the last field in Register: the field stays visible above the keyboard | | |
| PLAT-03 | Add Item / Add to Shopping List | iOS: opens as a sheet you can swipe down (asks to discard changes if edited). Android: opens full screen | | |
| PLAT-04 | Back navigation | Android: system back button / gesture works on every stack screen. iOS: swipe from the left edge goes back | | |
| PLAT-05 | Item menu | ⋮ on an inventory item: iOS shows an action sheet, Android a dialog | | |
| PLAT-06 | Dialogs | Delete / logout confirmations look native and Cancel works (Android: tapping outside cancels) | | |
| PLAT-07 | Tab bar | All five tab labels readable, badge visible, not covered by the system bar | | |
| PLAT-08 | Large text | Turn on larger font size in phone settings | Text grows; nothing important is cut off | | |

## 11. Error handling and loading states

| ID | Test | Expected | Android | iOS |
|---|---|---|---|---|
| ERR-01 | Loading | On a slow connection, lists show a spinner with a message, not an empty screen | | |
| ERR-02 | Saving while offline | Airplane mode → edit an item → Save | "Saved offline… will sync" and the change appears; it reaches Firestore after reconnecting | | |
| ERR-03 | Rules not published | (Only if you want to demonstrate it) Temporarily publish deny-all rules | Screens show "Permission denied. Check that the Firestore security rules… are published." | | |

---

## 12. Known limitations

- **Expo Go only.** The app is tested in Expo Go. The custom app icon and splash screen only appear in a standalone build (`npx eas-cli@latest build`), which was not part of the testing.
- **Buying needs a connection.** Marking an item purchased and adding inventory items to the shopping list use Firestore transactions, which must reach the server. This is deliberate: it is what guarantees no duplicate history records or list entries. Other edits work offline and sync later.
- **iOS on Windows** can only be tested on a physical iPhone with Expo Go (see section 1).

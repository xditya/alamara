<div align="center">

# Alamara

**A local-first document vault for your phone.**
Aadhaar, PAN, ID cards, tickets, certificates — scanned, indexed, searchable, and *never* uploaded anywhere.

[![Status: WIP](https://img.shields.io/badge/status-work%20in%20progress-orange)](#-status)
[![Expo SDK 56](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo)](https://docs.expo.dev/versions/v56.0.0/)
[![React Native 0.85](https://img.shields.io/badge/React%20Native-0.85.3-61DAFB?logo=react)](https://reactnative.dev)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey)](#-running-it)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

---

> [!WARNING]
> **🚧 Work in progress.** Alamara is under active development and is **not ready for
> real documents yet**. Several security guarantees described below are only partly
> implemented (see [Status](#-status)), the data format is unstable, and updates may
> wipe your vault. Treat it as a preview build, not a safe.

---

## Why

*Alamara* (അലമാര) is the Malayalam word for the almirah — the steel cupboard where
every Indian family keeps the folder of Important Papers. This app is that cupboard,
on your phone.

Existing options make you choose between convenience and privacy: cloud drives index
your identity documents on someone else's servers, and a photos folder isn't a filing
system. Alamara does the indexing, classification, and search **entirely on-device**.
There is no backend, no account, and no analytics — the app makes zero network calls
except the one optional AI model download you explicitly opt into.

## What it does

| | |
|---|---|
| 📸 **Capture from anywhere** | Live document scan with auto edge-detection, import from files/photos, or share straight into the app from any other app. Three sources, one pipeline. |
| ✂️ **Fix it before you file it** | Auto-crop with free-form manual override, multi-page documents, per-page delete and re-order. |
| 🧠 **Reads your documents for you** | On-device OCR (ML Kit) → deterministic classification → field extraction. It knows an Aadhaar from a PAN, pulls out the numbers, and suggests a filename. |
| 🔎 **Find it in one line** | Instant search across names, extracted fields, and tags — plus optional on-device *semantic* search, so "college marks" finds your degree certificate. |
| 🎫 **Wallet for tickets** | Event and travel tickets get their own tab: barcode/QR re-display, automatic screen-brightness boost at the scanner gate, and one-tap "add to calendar". |
| 🔐 **Locked down** | Encrypted database (SQLCipher) keyed from the Android Keystore / iOS Keychain, biometric app-lock with passcode fallback. |
| 🌗 **Genuinely nice to use** | "Soft & friendly" design language — rounded cards, per-category pastel tints, real dark mode, spring-based motion that respects Reduce Motion. |

## Privacy model

The whole point of the app, stated plainly:

- **No server.** There is nothing to sign up for and nowhere for your data to go.
- **No telemetry.** No analytics SDK, no crash reporter, no remote config.
- **OCR is local.** Google ML Kit's on-device text recognition — the image never leaves the phone.
- **AI is local and opt-in.** Semantic search uses `all-MiniLM-L6-v2` running under
  ExecuTorch. The *only* network request the app ever makes is downloading that model
  file, once, after you turn the feature on in Settings. Leave it off and the app is
  fully offline forever.
- **Keys never leave the device.** A 256-bit master key is generated on first launch
  and stored in the OS secure store; it is never written to disk in plaintext.

## 🚦 Status

The UI is complete and the app runs end-to-end on Android. Here's what's actually
wired up versus what's still a placeholder — **read this before trusting it with anything**:

| Area | State | Notes |
|---|---|---|
| Navigation, screens, design system | ✅ Done | All tabs, modals, settings, onboarding, lock screen |
| Capture · scan · crop · multi-page | ✅ Done | Camera, document scanner, file/photo import, share-intent |
| OCR + classify + field extraction | ✅ Done | ML Kit + regex tiers, on-device |
| Encrypted vault index | ✅ Done | op-sqlite + SQLCipher, key in Keystore/Keychain |
| Biometric app lock | ✅ Done | expo-local-authentication, fails open with no enrolment |
| Semantic search (ExecuTorch) | ✅ Done | Opt-in, downloads the model on first use |
| **Page blob encryption** | ⚠️ **Not yet** | Scanned images sit unencrypted in app-private storage — the vault *index* is encrypted, the page files are not. This is the biggest gap. |
| FTS5 / sqlite-vec index | ⚠️ Partial | Vault index is stored as JSON in an encrypted KV table; the normalised + FTS5 schema is designed but not migrated |
| Backup / export | 🟨 Basic | Export/import exists; no encrypted archive format yet |
| iOS | ❓ Untested | Code is platform-agnostic, but only Android has been built and run so far |
| Tests | ❌ None | No test suite yet |

## 🏃 Running it

Alamara uses native modules (SQLCipher, ML Kit, ExecuTorch, the document scanner), so
**Expo Go won't work** — you need a development build.

```bash
npm install
npx expo run:android      # or: npx expo run:ios
```

<details>
<summary><b>Windows setup notes</b> (this is what the project is developed on)</summary>

Gradle needs JDK 17 — system Java 23 fails with a `JvmVendorSpec … IBM_SEMERU` error.
Point `JAVA_HOME` at Android Studio's bundled JBR first:

```powershell
$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
npx expo run:android
```

Requires the Android SDK and NDK r27. The `with-openssl-jnilibs` config plugin bundles
`libcrypto`/`libssl` for op-sqlite's SQLCipher — without it the app crashes at launch
with `UnsatisfiedLinkError`.

</details>

Other scripts: `npm run lint` (ESLint via `expo lint`), `npx tsc --noEmit` (typecheck).

## 🧱 How it's built

**Expo SDK 56** · React 19.2 · React Native 0.85.3 (New Architecture) · expo-router with
typed routes and the React Compiler enabled · Reanimated 4.

```
src/
  app/                  # expo-router routes
    (tabs)/             # Home · Documents · Wallet · Settings
    (modals)/           # capture, camera, scan, crop, review, page-viewer, search
    onboarding.tsx  lock.tsx  _layout.tsx
  components/
    ui/                 # shared kit: AppText, Button, Card, Chip, Icon, SearchBar, Toast…
    documents/ wallet/ home/ capture/ settings/ onboarding/
  services/             # the native boundary — feature code never calls native directly
    sqlite.ts           #   op-sqlite + SQLCipher (encrypted KV)
    storage.ts          #   vault index + page blobs
    secure-key.ts       #   master key in Keystore / Keychain
    ocr.ts              #   ML Kit text recognition
    ai.ts               #   ExecuTorch embeddings (opt-in semantic search)
    biometric.ts db.ts preferences.ts share.ts
  lib/classify.ts       # deterministic classification + field extraction
  constants/            # theme.ts (semantic tokens), motion.ts, fonts.ts
  hooks/  types/
```

Two rules keep it coherent, and they're enforced in review:

1. **Everything native goes through `src/services/*`.** Screens never import a native
   module directly, which is why the storage backend could swap from JSON files to
   SQLCipher without touching a single screen.
2. **No raw hex, ever.** Styling is semantic tokens only (`useTheme()`, `Spacing`,
   `Radius`, `CategoryColors`), every tap is a `PressableScale`, all motion comes from
   `constants/motion.ts` and honours `useReducedMotion()`.

Deeper docs — [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) carry the working
conventions (including for AI coding agents). The longer planning set lives in `docs/`
locally — `ARCHITECTURE.md` (the binding engineering contract: file ownership, exact
component/service APIs, styling rules), `BUILD-PLAN.md`, and `PROGRESS.md` — and is kept
out of the repo since it's coordination material, not part of the shipped app.

## 🗺️ Roadmap

- [ ] **Real AES-256-GCM blob encryption** (the one blocking item for "safe for real documents")
- [ ] Normalised schema + FTS5 full-text index, sqlite-vec for embeddings
- [ ] Encrypted, portable backup archive
- [ ] iOS build + device testing
- [ ] Expiry reminders (passport, licence, insurance) — Home already surfaces them, notifications don't exist yet
- [ ] Optional on-device Gemma for freeform Q&A over your vault
- [ ] Test suite

## 🤝 Contributing

Issues and PRs are welcome — but note the codebase follows a strict architecture
contract — read [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) first. Keep
changes inside the service boundary, use the design tokens, and make sure
`npx tsc --noEmit` and `npm run lint` are clean.

## 📄 License

MIT — see [LICENSE](LICENSE).

<div align="center">
<sub>Built by <a href="https://xditya.me">Aditya S</a> · your documents stay yours</sub>
</div>

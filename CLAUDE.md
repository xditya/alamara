@AGENTS.md

# Alamara — larger context (read this first)

**Alamara** (Malayalam for the almirah where families keep important papers) is a
**local-first document vault** for iOS + Android. It stores and auto-indexes Aadhaar,
PAN, ID cards, tickets, and certificates. **Nothing goes to the cloud.**

- Full product/design/build plan: `C:\Users\Aditya S\.claude\plans\zippy-pondering-volcano.md`
- Engineering contract (folder layout, file ownership, component APIs, rules): **`docs/ARCHITECTURE.md`** — read before writing any code.
- Task breakdown: `docs/BUILD-PLAN.md` · Live status: `docs/PROGRESS.md`

## Stack
Expo **SDK 56**, React 19.2, React Native **0.85.3** (New Architecture), expo-router (typed
routes + reactCompiler ON), react-native-reanimated 4. Source lives under `src/` — alias
`@/*` → `./src/*`. (Downgraded 57→56 for Play-Store Expo Go support.)

## Local Android build (Windows) — WORKS
Set `$env:JAVA_HOME` to Android Studio's JBR (JDK 17):
`C:\Users\Aditya S\AppData\Local\Programs\Android Studio\jbr` (system java 23 fails with
`JvmVendorSpec … IBM_SEMERU`). Then `npx expo run:android` (auto-detects the running AVD).
NDK r27, SDK at `…\AppData\Local\Android\Sdk`. The `with-openssl-jnilibs` config plugin
bundles libcrypto/libssl for op-sqlite's SQLCipher (else `UnsatisfiedLinkError` at launch).

## Locked product decisions (do not re-litigate)
- **Aesthetic:** "Soft & Friendly" — light-led, rounded 20px cards, per-category pastel
  tints, indigo `#6366F1` primary, full dark mode.
- **Nav:** bottom tabs `Home · Documents · (＋ capture) · Wallet · Settings`; the center
  `＋` is an overlaid floating button (NativeTabs can't host it).
- **Capture:** 3 sources → 1 pipeline (share sheet, import, live scan). Two-phase: save
  raw fast, then OCR → classify → extract → name → index in the main app.
- **AI:** tiered (OCR + regex + FTS5 first; embeddings + optional Gemma opt-in). Runtime
  react-native-executorch. AI is opt-in, so broad device support is kept.
- **DB:** `@op-engineering/op-sqlite` (SQLCipher + FTS5 + sqlite-vec). Never also add
  expo-sqlite (hard symbol conflict).
- **Security:** encrypted DB + AES-GCM file blobs, keys in Keychain/Keystore, biometric lock.
- **Motion:** grounded in Emil Kowalski's rules → Reanimated 4 (see `src/constants/motion.ts`).

## Golden rules for everyone (humans + subagents)
1. **Read `docs/ARCHITECTURE.md` first.** It defines who owns which files and the exact
   component/service APIs. Only create/edit files your work package owns.
2. **Never edit shared/frozen files** (`src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`,
   `src/app/(modals)/_layout.tsx`, `src/components/app-tabs*.tsx`, `src/constants/*`,
   `src/types/*`, `src/services/*`, `src/components/ui/*`, `package.json`, `app.json`,
   `CLAUDE.md`, `AGENTS.md`, `docs/*` except your own progress file) unless your package
   explicitly owns them.
2b. **Native modules build fine now** (local Android dev build — see above). Feature code
    still goes through `src/services/*`, but those are now REAL: `services/db`+`sqlite`
    (op-sqlite/SQLCipher encrypted vault, key in Keystore via `secure-key`), `services/ocr`
    (ML Kit), `services/biometric` (expo-local-authentication), `services/ai` (executorch
    semantic search). Keep the service boundary; don't sprinkle native calls in screens.
3. **Style only via semantic tokens** from `src/constants/theme.ts` (`useTheme()`,
   `Spacing`, `Radius`, `CategoryColors`). No raw hex in screens/components.
4. **All taps use `PressableScale`.** All motion uses tokens from `src/constants/motion.ts`
   and honors `useReducedMotion()`. Animate transform/opacity only. No emoji as icons.
5. **Verify with types, not full builds:** write clean TypeScript; do not run the full
   `tsc` while others are mid-edit. The orchestrator runs the consolidated typecheck.
6. **Report progress** to `docs/progress/<your-wp>.md` only — never edit `docs/PROGRESS.md`
   or another agent's file.

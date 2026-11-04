# NOCTIS — progress and handoff

## Authoritative project and user decisions

- Work in **`/Users/smitprajapati/Projects/NOCTIS`**, the folder the user already opened in VS Code. The original generated-chat copy was moved here. Do not create a duplicate application elsewhere.
- Mobile only; iPhone first. Target physical device: user’s **iPhone 17 Pro Max**. Local web/PWA milestone first, native/App Store work later.
- The user explicitly wants **dark purple**, a premium and engaging feel, distinct page compositions, beautiful fonts, a selector that floats/glides, and meaningful page transitions. Avoid the repeated “same heading + same cards” layout.
- The user explicitly requested the actual moon phase for the current night and recorded nights. Keep the local date-aware astronomy and clear phase/illumination labels.
- Applied the user-installed **UI/UX Pro Max** and **UI Animation** skills under `~/.agents/skills`. Their adapted product decisions are recorded in `design-system/noctis/MASTER.md`.
- Scrollbars: the user wants no visible scrollbars anywhere in the app. Apply the policy globally while preserving scrolling and access to all content.
- Charts: the user prefers minimal point-and-line graphs over duration bars. Keep straight, thin lilac segments, small dots and gaps for missing nights; no decorative area fill.
- Typography: locally bundled **Instrument Serif** display + **Manrope Variable** body/data. Preserve this direction unless the user changes it.

## Milestone 1 — implemented, 2026-11-05

- [x] React/TypeScript app and persistent project; phone-sized UI.
- [x] Today: moon-led composition, latest-night metrics, goal dial, 7/30-day duration chart.
- [x] Journal: create/edit/delete, validation, search, 7-morning calendar, diary ledger, expandable 35-day heatmap, actual historical moons.
- [x] Night Lab: computed summaries, rested-rating line chart, habit comparisons with minimum sample counts, local chat and computed chart cards.
- [x] Tonight: immersive breathing timer, pause/reset, daily rituals, manual morning schedule and preparation/travel buffers.
- [x] After-midnight planning chooses the next upcoming wake-up; bedtime dates cross midnight correctly.
- [x] Settings: personal goal/name, separate sample mode, export/import validation and explicit replacement/erase confirmations.
- [x] Fixed the confusing start-journal prompt: invitation only on Today, first entry opens immediately, saving switches the entire app to personal data; cancel preserves samples. Other pages have a small sample-status label.
- [x] Floating dock and secondary selectors, directional View Transitions, paired sheet motion, press feedback, reduced-motion routing and stale-transition cancellation.
- [x] Manifest, reproducible PNG app icons, bundled fonts and production app-shell service worker.
- [x] TypeScript/production build and 24 automated checks passing before final documentation/checkpoint.
- [x] Safari visual inspection of all four redesigned pages; home and Night Lab at 375×812. Earlier Chrome layout/console inspection. No app runtime error observed in the inspected console; a legacy PWA metadata warning was addressed.
- [ ] Physical iPhone testing and trusted HTTPS/offline verification — **next milestone**, not claimed complete.

## Verification record and limits

`npm test` uses isolated in-memory storage, not the user’s browser journal. It checks overnight/daytime duration, invalid dates/times, missing chart days, bedtime variation, pattern sample sizes, backup validation, sample separation, moon phase/date logic, CRUD and remount persistence, preferences, local chat cards, planner/timer/checklist state, confirmed backup restore, home-only start flow, calendar date selection, rapid sheet reopening, latest-tap navigation, reduced-motion routing and after-midnight planning.

The build generates an offline shell with hashed bundled assets, icons and fonts. The LAN HTTP address is for normal browser testing. iPhone service-worker/offline behavior requires a trusted HTTPS origin. Home Screen storage, keyboard/safe-area behavior, largest Dynamic Type, landscape, real touch feel and 0.1× animation-panel inspection remain unverified. Do not present DOM tests or Mac screenshots as physical iPhone validation.

The chat is **deterministic local rules, not an LLM**. No backend, account, cloud sync, analytics, automatic sleep recording, Apple Health connection, alarm, calendar permission, notifications, or medical diagnosis is implemented. One main sleep entry per wake-up date. Data and exported backups are local/plain JSON; no app-level encryption claim.

## Follow-up — minimal line charts and hidden scrollbars, 2026-11-05

- Replaced the shared duration/rested bar chart on Today and in chat cards with a minimal SVG line and small circular points.
- Kept weekly tap targets, exact per-night values, goal reference, the month data list and explicit empty states. Missing nights break the line rather than drawing zero values or interpolating across gaps.
- The plotted range uses only nights in the selected period; older outliers do not flatten the current view.
- Added a global scrollbar policy for routes, sheets, chat and text fields, using standard and WebKit rules without changing their overflow or scrolling behavior.
- Verification: all 24 existing tests and the production build pass. Safari screenshots inspected for weekly/monthly charts at the normal phone shell and 375×812; selecting a weekly point opened the corresponding read-only sample night. Reviewed global scrollbar coverage and preserved overflow behavior. Physical iPhone scroll indicators and touch feel remain part of the pending device check.

## Next milestone — physical iPhone and motion tuning

1. Read README’s beginner-friendly run instructions. Start `npm run dev` in this folder.
2. Same Wi-Fi: open the server’s current Network URL in Safari on the iPhone. Setup observed `http://192.168.29.148:5173/`; verify the current address rather than assuming it stayed the same.
3. Test each page, the floating selector under rapid taps, sheets/keyboard, the chosen calendar date, forms at larger text size, safe areas, timer return after suspension and export/restore. Use disposable test entries; preserve personal data.
4. Check both current and reduced-motion settings. Tune distance and duration based on physical feel; do not add arbitrary effects.
5. Establish trusted HTTPS with the user, then test standalone install, offline reopen and update behavior. No certificate-warning bypass or system trust changes were performed.

## Later milestones

1. Choose the actual AI provider, free/local vs hosted approach, and budget with the user. Add a server-only adapter, credentials outside the client, explicit journal-data handling, structured chart responses and graceful errors. Do not ask the user to paste secrets into chat.
2. Decide on accounts, sync, retention and encryption before moving journals off-device. A local Git checkpoint is not a remote backup.
3. Optional notifications, schedule/calendar integrations, HealthKit/native wrapper and App Store work after the core experience is physically tested.

## Resume instructions

Read `README.md`, this file, `AGENTS.md`, `design-system/noctis/MASTER.md`, and `git status`. Run `npm test` and `npm run build`; continue the first unfinished milestone. Keep the persistent project and data model intact. Update this file and save a useful Git checkpoint before ending.

When usage limits stop work, the files remain. The user must return when usage is available and send a continuation request; no automatic continuation after limits expire is promised.

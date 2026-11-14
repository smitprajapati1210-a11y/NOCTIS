# NOCTIS — progress and handoff

## Authoritative project and user decisions

- Work in **`/Users/smitprajapati/Projects/NOCTIS`**, the folder the user already opened in VS Code. The original generated-chat copy was moved here. Do not create a duplicate application elsewhere.
- Mobile only; iPhone first. Target physical device: user’s **iPhone 17 Pro Max**. Local web/PWA milestone first, native/App Store work later.
- The user explicitly wants **dark purple**, a premium and engaging feel, distinct page compositions, beautiful fonts, a selector that floats/glides, and meaningful page transitions. Avoid the repeated “same heading + same cards” layout.
- The user explicitly requested the actual moon phase for the current night and recorded nights. Keep the local date-aware astronomy and clear phase/illumination labels.
- Applied the user-installed **UI/UX Pro Max** and **UI Animation** skills under `~/.agents/skills`. Their adapted product decisions are recorded in `design-system/noctis/MASTER.md`.
- Scrollbars: the user wants no visible scrollbars anywhere in the app. Apply the policy globally while preserving scrolling and access to all content.
- Charts: the user prefers minimal point-and-line graphs over duration bars. Keep straight, thin lilac segments, small dots and gaps for missing nights; no decorative area fill.
- Wind-down is a primary feature: Today shortcut before sleep stats, explicit bottom-nav label, timer and checklist together before planning. Keep short breathing pauses as an optional extra.
- Header: compact Outfit Medium wordmark (17px), small crescent and original header height. The user rejected an oversized serif/emblem/tagline treatment and prefers a restrained middle ground closer to the original.
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

The chat is **deterministic local rules, not an LLM**. The account server handles authentication. Journal entries stay device-local, and the assistant preview runs from local rules. One main sleep entry per wake-up date. Data and exported backups are local/plain JSON; no app-level encryption claim.

## Follow-up — minimal line charts and hidden scrollbars, 2026-11-05

- Replaced the shared duration/rested bar chart on Today and in chat cards with a minimal SVG line and small circular points.
- Kept weekly tap targets, exact per-night values, goal reference, the month data list and explicit empty states. Missing nights break the line rather than drawing zero values or interpolating across gaps.
- The plotted range uses only nights in the selected period; older outliers do not flatten the current view.
- Added a global scrollbar policy for routes, sheets, chat and text fields, using standard and WebKit rules without changing their overflow or scrolling behavior.
- Verification: all 24 existing tests and the production build pass. Safari screenshots inspected for weekly/monthly charts at the normal phone shell and 375×812; selecting a weekly point opened the corresponding read-only sample night. Reviewed global scrollbar coverage and preserved overflow behavior. Physical iPhone scroll indicators and touch feel remain part of the pending device check.

## Follow-up — compact header identity, 2026-11-05

- Reworked the header into `AppHeader.tsx` while preserving Home navigation, date/sample status and settings.
- Applied Outfit Medium only to the compact wordmark, with a small crescent. Restored the original header height and removed the oversized display lettering, orbital emblem, tagline and extra divider after user feedback.
- Outfit is locally bundled; the body and page display fonts remain Manrope and Instrument Serif.
- Verification: all 24 existing tests and the production build pass. Inspected the compact header in Safari at the normal phone shell and 375×812; branding, date and settings fit without clipping. The user is previewing over LAN; no physical-device result is claimed by these Mac checks.

## Follow-up — wind-down as a primary feature, 2026-11-05

- Renamed the visible Tonight tab to **Wind down** and added a prominent Today card before sleep statistics, showing live remaining time and checklist progress.
- Added a separate 15/30/45-minute session timer with pause/resume/reset and persistent duration. It runs from a wall-clock deadline in the app root, so returning from another view or app suspension catches up and completes correctly.
- Moved the existing four daily rituals into the same primary session section, above the schedule planner. They now use native checkboxes, full-row targets and visible progress. Each local day starts an unticked checklist without changing saved journal entries.
- Preserved the original 1/3/5-minute breathing timer in an optional section. Older backups keep this timer and initialize the new wind-down timer from the planning preference; new backups preserve long sessions and their duration.
- Verification: all 26 tests and the production build pass. New checks cover home access, long-session persistence through remounts, pause/reset duration, checkbox persistence, completion while on Today, and older-backup migration. Safari screenshots inspected at the normal phone shell and 375×812: the Today shortcut is visible without scrolling, and the timer plus all four rituals appear before planning on the first Wind down screen. Physical iPhone suspension and touch checks remain unverified by these Mac inspections.

## Follow-up — introduction and accounts, 2026-11-14

- Added a separate four-scene introduction with a generated bedroom photograph, tonight’s lunar phase, sample journal and interactive sleep chart, timer preset selection, and rehearsal checklist. The steps use directional page transitions and respect reduced motion.
- The opening photograph lives at `public/onboarding/night-room.jpg`. It was generated with the built-in ImageGen tool using the prompt below. The UI overlays the calculated moon phase.

  > Create a single photographic asset for NOCTIS, an intimate iPhone sleep journal's first-run welcome. Portrait 4:5 crop. Editorial interior photograph from inside a very quiet small bedroom looking toward an unlit tall softly arched window. In the lower right, side of a bed with a subtly rumpled dark plum linen duvet, a tiny table and closed paper notebook in silhouette. Outside, faint hills under deep indigo twilight and a very fine scattered distant star field. NO visible moon, no people, no lightbulbs, no illuminated screens, no text, no symbols or UI, no decorative border or graphics. Muted deep aubergine/navy almost black palette, tactile natural linen, soft dim blue-violet window light, understated contemporary film photography. Keep the window readable in the center-right, dark clean negative space on the left, ample top and bottom crop room. No bright white areas, flashy lens effects, or fantasy elements.

- Added a real Better Auth and SQLite server for persistent email/password accounts, server sessions and sign-out. Live SMTP config adds verified email signup and recovery. Google and Apple use their respective OAuth callbacks when configured.
- Journals use a separate browser storage key per account. A confirmed Settings import brings the earlier journal into the signed-in account while preserving the original copy.
- Verified browser walkthrough, sample interactions, email account creation, entry to the existing app and sign-out in isolated Chrome preview. The production build and 29 tests passed, including email session revocation, Google and Apple authorization URLs and legacy journal isolation.

## Follow-up — Google and email first, 2026-11-14

- The web release uses Google and email. The Apple button stays visible and inactive. New accounts open an empty personal journal and can opt into sample nights in Settings.
- Created the **Noctis** Google Cloud project (`noctis-514708`). The owner completed consent setup. Registered **NOCTIS local development** with `http://localhost:5176/api/auth/callback/google` and installed the credentials in the ignored `.env.google.local`. Start it with `npm run dev:google`. The Mac Google preview has its own origin and database, and the Wi-Fi preview remains available on port 5173.
- Production build and 31 tests passed. Added coverage for a fresh account’s empty journal, the Google authorization URL and inactive Apple provider, and public-mode email verification and password reset with a local SMTP receiver.
- Completed a live Google sign-in in Chrome on the Mac. The account chooser returned to NOCTIS and opened Today with an empty personal journal. For iPhone sign-in, choose an HTTPS host and persistent account storage, register its callback, configure a live SMTP sender, and test in Safari. See the README for exact settings.

## Follow-up — hosting preparation, 2026-11-14

- Prepared a Render Blueprint for a Node Web Service with a 1 GB persistent SQLite disk. The production entry point supports binding to the hosted port and using Render's HTTPS origin, while local production runs still bind to loopback by default. Render deployments use the visitor IP supplied by public ingress for authentication rate limits.
- Validated the Blueprint against Render’s JSON schema. All 31 tests and the production build passed. A local production run on the pinned Node 24.22.3 verified the app page, account database creation, external Google callback generation, and independent visitor rate limits.
- The deploy requires a GitHub repository, a hosting plan and an SMTP sender. Once deployed, register the actual HTTPS Google callback and verify both sign-in methods on iPhone. No cloud service has been provisioned. See the Render steps in README.

## Follow-up — Netlify friends beta, 2026-11-14

- The user chose a free, shareable beta. Created **noctis-sleep-beta** under the user’s Netlify team and provisioned its PostgreSQL account database. Added a Netlify Function that reuses the app’s Better Auth configuration and a tracked Postgres account migration. Registered an independent Google client for `https://noctis-sleep-beta.netlify.app/api/auth/callback/google`.
- The hosted beta starts with Google sign-in. It enables email/password only after a verified SMTP sender is configured. Local email preview and the inactive Apple button remain available in their existing roles. Journals remain on the device.
- Published the production beta at `https://noctis-sleep-beta.netlify.app/`. The owner made production public with Deploy Previews private. Verified the welcome and Google sign-in in Chrome, the return to Today and an active Google-backed session in Netlify Postgres. All 31 tests and the production build passed. Additional friend accounts and physical iPhone Safari still need testing.
- Pushed the project and its Git history to `smitprajapati1210-a11y/NOCTIS` as a private repository. The repo can become public for the portfolio after the owner chooses visibility. Deploys currently use the linked Netlify CLI project.

## Follow-up — simpler screens and personal wind-down, 2026-11-14

- Moved **Ask Noctis** from Discover to a direct question field on Today, with on-demand suggested prompts and chart answers. The newest reply stays in view and prior replies are available under **Earlier questions**. The assistant still uses local journal calculations.
- Reduced the moon scene to a compact greeting and tonight’s real phase. Placed logging and wind-down immediately below the assistant. Used collapsible controls for sleep trends, journal search and heatmap, Discover details, evening planning and the breathing timer. Increased contrast between key controls, with lilac for primary actions and muted sage for wind-down. Kept the gliding selector and reduced-motion handling.
- Added checklist editing with renamed tasks, removal, custom tasks and suggestions. Version 1 journals and backups keep their default task IDs and existing checkmarks. An intentionally empty custom list stays empty. Tasks and daily checkmarks remain browser-local per account.
- Moved the separately downloaded local and hosted OAuth JSON backups out of Downloads to the private `~/.config/noctis/oauth` folder. Running sign-in uses the existing configured environments.
- Chrome verified Today’s inline answer and the checklist editor’s one-tap suggestion and cancel flow. All 32 tests and the production build passed. Deployed commit `125da58` to the live beta and verified the new bundles and Google sign-in configuration at the public URL. Physical iPhone testing remains pending.

## Follow-up — restore symbols and show the chart on Today

- Restored stars and orbital lines around tonight’s moon, section icons, and the default wind-down task icons. The top-right person icon opens the existing Settings sheet.
- Today shows the sleep-duration chart directly under Ask Noctis, with Week and Month controls, the goal reference, and per-night details. New journals show an empty plot with a first-night message. Quick actions sit side by side below the chart.
- All 32 tests and the production build passed. Verified the visible chart and profile icon in Chrome’s phone-sized app shell and switched between Week and Month. Physical iPhone testing remains pending.

## Follow-up — weekly sleep constellations

- Today opens with a local-time greeting in DM Serif Text, the log button and the weekly chart. Ask Noctis comes last. The current week runs Monday through Sunday by wake-up date and rolls over while the app is open or on return.
- Past weeks is available on Today and Journal. Both chart views use a dim starfield, circular glowing points, and straight lilac connections with breaks for missing nights. The weekly chart omits the dashed goal line. Points appear one by one before the line reveal, then the halos twinkle at staggered intervals while visible. Reduced Motion shows a static chart.
- Verified the populated chart and past-week switching in Chrome using an isolated sample journal. All 34 tests and the production build passed. Physical iPhone verification remains pending.

## Follow-up — glass selectors and scroll-responsive sky

- The bottom tabs and Discover share a bright lilac selector with a curved outline that flexes and carries a highlight during its 310 ms glide. Horizontal drag starts on the selected item and switches to the item under the pointer on release. Discover’s track and slider rest in a rectangle.
- Added a two-layer starfield behind the four signed-in views. The closer stars are brighter, move farther with scrolling, and briefly carry flick momentum. The sky stays still with Reduced Motion, and selectors switch immediately.
- All 34 tests and the production build passed. At a phone-sized viewport, Chrome and WebKit verified both selectors, shape and highlight animation, release, rapid switching, the rectangular Discover slider, scroll reversal and Reduced Motion. Chrome also verified touch release and cancellation. Check the feel in Safari on a physical iPhone next.

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

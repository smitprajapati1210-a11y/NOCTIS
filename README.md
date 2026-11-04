# NOCTIS

**Your night, understood.** A mobile-only sleep journal with a dark purple interface, designed for iPhone first.

## Open and run

The authoritative project is **`/Users/smitprajapati/Projects/NOCTIS`**, the folder already open in VS Code. Continue working here; do not create another copy in a generated chat folder.

Dependencies are installed. In VS Code, choose **Terminal → New Terminal**, then enter:

```sh
npm run dev
```

Open **http://localhost:5173** on the Mac. Keep that terminal running. Press **Control + C** in it to stop the app. If starting from a different folder, first enter:

```sh
cd /Users/smitprajapati/Projects/NOCTIS
```

If dependencies need to be restored after copying or cloning the project, run `npm ci` first. The development server uses port 5173 and reports an error if another copy is already running. VS Code also has a **NOCTIS: Start app** task under Terminal → Run Task.

## What works in milestone 1

| View     | Working features                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Today    | Latest logged night, estimated sleep after subtracting latency and awakenings, minimal 7/30-day point-and-line charts, personal goal, links to journal and evening plan. |
| Journal  | Create, edit and delete nights; date/time validation; rested ratings; habit tags and notes; search; tappable 35-day heatmap.                                             |
| Discover | Computed weekly summaries, rested-rating chart, bedtime variation, habit comparisons and local chat with chart cards.                                                    |
| Tonight  | Manual morning commitment, preparation/travel buffers, bedtime and wind-down plan, pausable timer, daily ritual checklist.                                               |
| Moon     | Tonight’s calculated phase at 9 pm in the device’s timezone; historical phases at each entry’s actual bedtime.                                                           |
| Settings | Name, sleep goal, separate sample mode, JSON export/import with a replacement confirmation, and personal-journal erase confirmation.                                     |

The app opens in **clearly labeled sample mode** so you can explore the interface. The **Start my journal** invitation appears only on Today and opens the first-entry sheet. Saving starts your personal journal throughout the app; canceling keeps the sample view. The 28 sample nights never get added to your personal entries. Sample mode can be revisited from Settings.

The chat and insights are a **local, rule-based preview, not a connected AI model**. They calculate summaries from the journal and answer supported questions such as “How was my week?”, “Show my rested ratings”, and “Does late caffeine show a pattern?” Unknown questions explain the preview’s scope. A real model and backend are the next major milestone.

Pattern comparisons need at least **3 tagged and 3 untagged nights** in the last 30 days. They report sample sizes and associations, not causes. Rested ratings are self-reported, not a measured sleep score. The app is for reflection and does not diagnose sleep conditions.

## Test on your iPhone 17 Pro Max

1. Connect the Mac and iPhone to the same Wi-Fi.
2. Start the app on the Mac with `npm run dev` and keep the Mac awake.
3. Find the **Network** address printed in the terminal. At the time of setup it was **http://192.168.29.148:5173/**; your router can change this address.
4. Open that address in **Safari on the iPhone**. Use the Network address, not `localhost`—on the phone, localhost means the phone itself.
5. Try logging a night, switching views, opening forms with the keyboard visible, and scrolling to the bottom navigation.

If it does not connect, first check that the address still matches the terminal and that both devices are on the same network. Guest Wi-Fi can isolate devices. Review any macOS local-network/firewall prompt yourself; this project does not change firewall settings.

This is a **mobile web app**, not an App Store build. Safari supports adding a website from **Share → Add to Home Screen**, with **Open as Web App** where offered. See [Apple’s instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios). Physical iPhone and Home Screen behavior have not yet been validated.

### PWA and offline status

The app includes a manifest, Home Screen icons, standalone metadata, safe-area support, and a production service worker. The production build precaches the app shell and bundled assets. There are no external fonts or runtime services to fetch.

```sh
npm run build
npm run preview
```

Production preview uses http://localhost:4173 on the Mac. Service workers require a **secure context**: HTTPS, or the localhost development exception. The iPhone’s plain HTTP Network address is **not** that exception, so use it for browser testing, not as proof of offline PWA readiness. A trusted HTTPS origin and physical-device checks are still needed. See [MDN’s service worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

The planner selects the next upcoming wake-up, including when opened after midnight. It is a time-in-bed plan, not an alarm or a prediction of actual sleep.

## Your data

- Personal entries and preferences are stored under `noctis.journal.v1` in the browser’s local storage. No account, server database, analytics, cloud sync, microphone recording, Apple Health access, or AI transmission is implemented.
- Each device and web address has separate storage. `localhost:5173`, a Network IP, and production preview on port 4173 are separate journals. Safari/Home Screen storage behavior must also be tested before relying on it.
- Use **Settings → Export backup** regularly. Clearing browser data can remove your journal. The app does not add its own encryption to browser storage, and exported backups are plain JSON.
- Import validates the complete backup before offering replacement. Canceling leaves the current journal intact. Export before replacing or erasing it.
- A corrupted stored copy is not silently overwritten. Settings offers a raw recovery download and a separate reset action. If browser storage is blocked or full, the app warns that changes are not saved.
- One main sleep entry is supported per wake-up date; separate naps and multiple sleep blocks are future work.

## The moon

Moon illumination and phase are calculated locally with [SunCalc](https://github.com/mourner/suncalc). Tonight uses **9 pm local device time**; journal entries use their bedtime, accounting for the previous date when sleep crosses midnight. Phase names use the nearest of eight familiar phases. These are astronomical estimates, not live telescope observations.

The illustration shows waxing light on the right and waning light on the left. It is a northern-style phase diagram, not a location-specific horizon orientation. There is no GPS request, moonrise/weather forecast, or claim that the phase causes sleep changes.

## Design and motion

Applied the user-installed UI/UX Pro Max and UI Animation skills. Today is moon-led, Journal uses a date-led diary layout, the Night Lab presents field notes and a mood line chart, and Tonight leads with the breathing experience. Instrument Serif and Manrope Variable are bundled locally. The compact header wordmark uses locally bundled Outfit Medium, with a small crescent and the original header height. Sleep-duration charts use thin lilac lines and small points, with gaps for unlogged nights, a quiet goal reference and accessible night-by-night details. Visible scrollbars are hidden across the app, including sheets and text fields, while touch and keyboard scrolling remain available. The floating dock remains live while the central viewport uses directional transitions. Rapid navigation cancels stale callbacks; reduced motion skips spatial travel. Read `design-system/noctis/MASTER.md` for the design decisions, timing and verification limits.

## Development and checks

React + TypeScript + Vite; no backend. The lockfile records exact installed dependencies.

```sh
npm test          # domain, moon and isolated interaction checks
npm run build    # icons, TypeScript, production bundle, offline asset manifest
npm run format   # optional source formatting
```

| File              | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `src/App.tsx`     | Navigation, app state, local persistence and Today/Journal screens.                             |
| `src/domain.ts`   | Time calculations, validation, patterns, planning and local assistant responses.                |
| `src/storage.ts`  | Versioned backup validation, persistence recovery and export.                                   |
| `src/moon.ts`     | Night-to-date conversion, moon calculations and illuminated shape.                              |
| `src/components/` | Forms, charts, moon, Discover/chat, Tonight, settings and accessible modal.                     |
| `src/styles.css`  | Phone layout and the dark purple design.                                                        |
| `tests/`          | Meaningful calculation and interaction regression checks. Tests use isolated in-memory storage. |
| `scripts/`        | Reproducible PNG icons and production service-worker generation.                                |

Browser screenshots were inspected in Safari and Chrome. The redesigned Home and Night Lab were also inspected in Safari at 375×812. The entry form was also inspected in Safari. Automated interaction checks cover saving, remount persistence, editing, duplicate-date rejection, confirmed deletion, sample separation, preferences, chat chart cards, planning, timer pause after navigation, checklist persistence, and confirmed backup restore. These checks do not replace physical iPhone testing.

## Continue in a future chat

Read **PLAN.md**, this README, and `git status` first. Ask:

> Continue NOCTIS in /Users/smitprajapati/Projects/NOCTIS. Read README.md and PLAN.md, check Git status, and continue the next unfinished milestone. Preserve the dark purple theme and the actual moon phase feature.

The files and local Git history remain on the Mac when a chat stops. Future sessions can inspect them and resume without rebuilding from scratch. This repository has **no remote backup configured**.

**Usage limits do not erase the project, but they can stop work. I cannot promise to continue automatically when a limit resets.** Return when usage is available and send a continuation request. Account limits depend on the plan and work performed; use the product’s usage dashboard for current availability. [Official OpenAI usage guidance](https://learn.chatgpt.com/docs/pricing).

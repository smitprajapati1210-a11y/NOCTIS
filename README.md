# NOCTIS

**Your night, understood.** A mobile-only sleep journal with a dark purple interface, designed for iPhone first.

[Open the NOCTIS friends beta](https://noctis-sleep-beta.netlify.app/). Google sign-in creates a hosted account. Journal entries live in the browser where you write them. Discover and its chat show calculations from your journal using local rules.

## Open and run

The account server runs on Node.js 24.15 or newer. In VS Code, open the project folder and choose **Terminal → New Terminal**, then enter:

```sh
npm ci
npm run dev
```

Open **http://localhost:5173** on the Mac. Keep that terminal running. Press **Control + C** in it to stop the app.

If dependencies need to be restored after copying or cloning the project, run `npm ci` first. The development server uses port 5173 and reports an error if another copy is already running. VS Code also has a **NOCTIS: Start app** task under Terminal → Run Task.

## Introduction and accounts

On first open, explore the night scene, try a rested rating, tap through a sample sleep chart and check off a wind-down ritual. These examples use sample data. Continue to sign in, then choose **Create an account** to use an email address and a new password of at least 12 characters. The Mac preview stores real accounts in SQLite and uses server-managed session cookies. **Settings → Account** has sign-out.

The Wi-Fi URL is for local testing with a password you use only for this preview. The preview accepts an email address as the account name and supports sign-in without inbox verification. Use a verified HTTPS deployment and SMTP for public signup, email confirmation and password reset.

Each account uses its own journal storage in the current browser. To bring an existing journal into your account on that same device and address, use **Settings → Import journal from before sign-in**, review the preview and confirm the restore. The earlier copy remains in browser storage. Use a JSON backup to transfer a journal to another browser or address.

## Google sign-in on the Mac

Live Google sign-in was verified in Chrome on this Mac at **http://localhost:5176/**. Run `npm run dev:google` to restart the preview. The Apple button is inactive.

If setting up Google sign-in in a fresh checkout, follow these steps.

1. In the [Noctis Google Cloud project](https://console.cloud.google.com/auth/overview?project=noctis-514708), set up the consent screen and create a **Web application** client named **NOCTIS local development**. Add `http://localhost:5176/api/auth/callback/google` to **Authorized redirect URIs**. [Google OAuth redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server)
2. Create `.env.google.local` in the project. Add `NOCTIS_URL=http://localhost:5176`, `NOCTIS_AUTH_DATA_DIR=.noctis/google-preview`, and the client values as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Git ignores this file. The app reads these values on the server.
3. Run `npm run dev:google`. Open **http://localhost:5176/**, complete the introduction and choose **Continue with Google**. This Mac-only preview uses its own test account database. The regular Wi-Fi preview stays on port 5173 for email sign-in.

## Google and email sign-in on iPhone

Use a hosted HTTPS address for Google sign-in on iPhone. The local Wi-Fi IP address works for previewing the app with email accounts. [Google OAuth redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server)

1. Choose an HTTPS host with persistent storage for SQLite. Configure its HTTPS reverse proxy to preserve the original `Host` header.
2. Register a separate **Web application** client with the redirect URI `https://YOUR-DOMAIN/api/auth/callback/google`. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NOCTIS_URL` in the host's server environment. [Better Auth Google configuration](https://better-auth.com/docs/authentication/google)
3. Use [.env.example](.env.example) for the other server settings. Set `BETTER_AUTH_SECRET` to a fresh random value from `openssl rand -hex 32`, configure the SMTP connection and sender, and point `NOCTIS_AUTH_DATA_DIR` at the persistent disk.
4. Run `npm run build` and `npm start` on the host. The server listens on loopback port 4173 by default. From iPhone Safari, test Google sign-in, verified email signup, password recovery and sign-out at the registered HTTPS address.

Automated tests cover Google redirect generation and the verification and recovery flows with a local SMTP inbox. Live sign-in and mail delivery need to be tested with the registered Google client and the deployed sender.

### Deploy the friends beta on Netlify

Netlify serves the build in `dist` and runs the authentication endpoints in `netlify/functions`. Netlify Database keeps accounts and sessions in Postgres. SQLite powers local previews and the Render deployment. The current hosted beta uses Google. When an SMTP sender is configured, verified email signup and password recovery become available on the same site. [Netlify free plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) · [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/)

1. Create a Netlify project on the free plan and provision Netlify Database. The Netlify build packages `netlify/database/migrations/0001_accounts.sql` and Netlify applies it when publishing.
2. Register a Google Web application client for `https://YOUR-SITE.netlify.app/api/auth/callback/google`. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and a unique `BETTER_AUTH_SECRET` in Netlify’s environment. If the runtime needs an override, set `AWS_LAMBDA_JS_RUNTIME=nodejs24.x` there. Netlify supplies the site URL and database connection. In a custom-domain deploy, set `NOCTIS_URL` to the canonical HTTPS address.
3. For the existing linked Netlify project, run `npx netlify-cli@27.19.0 deploy --prod --context production`. Review the published home page and sign in through Google after deployment. Use `NOCTIS_SMTP_URL` and `NOCTIS_MAIL_FROM` when setting up a verified email sender.

### Deploy on Render

[render.yaml](render.yaml) defines a paid Web Service with a 1 GB persistent disk for accounts. Render supplies the HTTPS address and generates a server session secret. The program serves the app and its authentication routes together. [Render Web Services](https://render.com/docs/web-services) · [Persistent disks](https://render.com/docs/disks)

1. Push the Git repository to a private GitHub repository. The `.env.*` files containing credentials and `.noctis/` account databases are ignored. The hosted service starts with its own account database.
2. In Render, create a **Blueprint** from that repository. Review the Starter compute and disk charges. Enter the SMTP connection and approved sender as `NOCTIS_SMTP_URL` and `NOCTIS_MAIL_FROM` in Render. If using Resend, verify a domain you control and use `smtps://resend:API_KEY@smtp.resend.com:465` with a sending key. [Render Blueprints](https://render.com/docs/infrastructure-as-code) · [Resend sender domains](https://resend.com/docs/dashboard/domains/introduction) · [Resend SMTP](https://resend.com/changelog/smtp-service)
3. Open the deployed app and copy its exact HTTPS address from Render. Create a separate Google Web application OAuth client with `<that HTTPS address>/api/auth/callback/google`, then add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Render's environment and redeploy. If switching to a custom domain, set `NOCTIS_URL` to that HTTPS origin and register the matching Google callback. Use a separate Google project for a public release. [Google OAuth client setup](https://support.google.com/cloud/answer/15549257)
4. On iPhone Safari, test Google sign-in, email signup and verification, password recovery, and sign-out. Confirm an account still works after a redeploy. Use a JSON export and import to bring any existing journal entries to the new address.

## What works in milestone 1

| View      | Working features                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Today     | Ask Noctis with journal answers and chart cards, quick logging, wind-down shortcut, an inline 7/30-day sleep chart, and the latest night. |
| Journal   | Create, edit and delete nights; date/time validation; rested ratings; habit tags and notes; search; tappable 35-day heatmap.                                             |
| Discover  | Weekly summary, expandable rested-rating chart and bedtime variation, and the pattern detective. |
| Wind down | 15/30/45-minute session timer, editable daily checklist with task suggestions, and an expandable evening plan and breathing timer. |
| Moon      | Tonight’s calculated phase at 9 pm in the device’s timezone; historical phases at each entry’s actual bedtime.                                                           |
| Settings  | Name, sleep goal, separate sample mode, JSON export/import with a replacement confirmation, and personal-journal erase confirmation.                                     |

New accounts open an empty personal journal. Use **Today → Log my first night** to add a night. The walkthrough uses examples, and **Settings → Explore sample nights** opens an optional sample view. **Open my journal** returns to your entries. If you used the previous preview and signed in while sample mode was active, switch it off in Settings.

**Wind down** is directly available in the bottom navigation and through a Today shortcut with checklist progress and a live countdown when running. Choose 15, 30 or 45 minutes, pause, resume, or reset. Tap **Edit** beside the checklist to rename tasks, remove them, or add your own or a suggestion. Tap **Save checklist** to apply the changes. Tasks stay saved for that browser and account, and checkmarks start fresh each day. The evening plan and 1/3/5-minute breathing timer open separately. Countdown completion appears in the app.

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

The app includes a manifest, Home Screen icons, standalone metadata, safe-area support, and a production service worker. The production build precaches the app shell and bundled assets. Fonts and artwork ship with the app. Opening a signed-in journal requires access to the session service.

```sh
npm run build
npm run preview
```

Production preview uses http://localhost:4173 on the Mac. Service workers require a **secure context**: HTTPS, or the localhost development exception. The iPhone’s plain HTTP Network address is **not** that exception, so use it for browser testing, not as proof of offline PWA readiness. A trusted HTTPS origin and physical-device checks are still needed. See [MDN’s service worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

The planner selects the next upcoming wake-up, including when opened after midnight. It is a time-in-bed plan, not an alarm or a prediction of actual sleep.

## Your data

- Journal entries, preferences and timers stay in browser storage under an account-specific key. The SQLite database stores account, credential and session records. Journal data travels between devices through user-exported backups.
- Each device and web address has separate storage. `localhost:5173`, a Network IP, and production preview on port 4173 are separate journals. Safari/Home Screen storage behavior must also be tested before relying on it.
- Use **Settings → Export backup** regularly. Clearing browser data can remove your journal. The app does not add its own encryption to browser storage, and exported backups are plain JSON.
- Import validates the complete backup before offering replacement. Canceling leaves the current journal intact. Export before replacing or erasing it.
- A corrupted stored copy is not silently overwritten. Settings offers a raw recovery download and a separate reset action. If browser storage is blocked or full, the app warns that changes are not saved.
- One main sleep entry is supported per wake-up date; separate naps and multiple sleep blocks are future work.

## The moon

Moon illumination and phase are calculated locally with [SunCalc](https://github.com/mourner/suncalc). Tonight uses **9 pm local device time**; journal entries use their bedtime, accounting for the previous date when sleep crosses midnight. Phase names use the nearest of eight familiar phases. These are astronomical estimates, not live telescope observations.

The illustration shows waxing light on the right and waning light on the left. It is a northern-style phase diagram, not a location-specific horizon orientation. There is no GPS request, moonrise/weather forecast, or claim that the phase causes sleep changes.

## Design and motion

Applied the user-installed UI/UX Pro Max and UI Animation skills. Today is moon-led, Journal uses a date-led diary layout, the Night Lab presents field notes and a mood line chart, and Wind down leads with its session timer and checklist, ahead of planning and the optional breathing pause. Instrument Serif and Manrope Variable are bundled locally. The compact header wordmark uses locally bundled Outfit Medium, with a small crescent and the original header height. Sleep-duration charts use thin lilac lines and small points, with gaps for unlogged nights, a quiet goal reference and accessible night-by-night details. Visible scrollbars are hidden across the app, including sheets and text fields, while touch and keyboard scrolling remain available. The floating dock remains live while the central viewport uses directional transitions. Rapid navigation cancels stale callbacks; reduced motion skips spatial travel. Read `design-system/noctis/MASTER.md` for the design decisions, timing and verification limits.

## Development and checks

React, TypeScript and Vite power the interface. Better Auth and SQLite power the account server. The lockfile records the installed versions.

```sh
npm test          # domain, moon and isolated interaction checks
npm run build    # icons, TypeScript, production bundle, offline asset manifest
npm run format   # optional source formatting
```

| File                 | Purpose                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `src/App.tsx`        | Navigation, app state, local persistence and Today/Journal screens.                             |
| `src/domain.ts`      | Time calculations, validation, patterns, planning and local assistant responses.                |
| `src/useWindDown.ts` | Shared session countdown, pause/reset and completion across views.                              |
| `src/storage.ts`     | Versioned backup validation, persistence recovery and export.                                   |
| `src/moon.ts`        | Night-to-date conversion, moon calculations and illuminated shape.                              |
| `src/components/`    | Forms, charts, moon, Discover/chat, Tonight, settings and accessible modal.                     |
| `src/styles.css`     | Phone layout and the dark purple design.                                                        |
| `tests/`             | Meaningful calculation and interaction regression checks. Tests use isolated in-memory storage. |
| `scripts/`           | Reproducible PNG icons and production service-worker generation.                                |

Browser screenshots were inspected in Safari and Chrome. The redesigned Home and Night Lab were also inspected in Safari at 375×812. The entry form was also inspected in Safari. Automated interaction checks cover saving, remount persistence, editing, duplicate-date rejection, confirmed deletion, sample separation, preferences, chat chart cards, planning, timer pause after navigation, checklist persistence, and confirmed backup restore. These checks do not replace physical iPhone testing.

## Continue in a future chat

Read **PLAN.md**, this README, and `git status` first. Ask:

> Continue NOCTIS in /Users/smitprajapati/Projects/NOCTIS. Read README.md and PLAN.md, check Git status, and continue the next unfinished milestone. Preserve the dark purple theme and the actual moon phase feature.

The files and local Git history remain on the Mac when a chat stops. Future sessions can inspect them and resume without rebuilding from scratch. This repository has **no remote backup configured**.

**Usage limits do not erase the project, but they can stop work. I cannot promise to continue automatically when a limit resets.** Return when usage is available and send a continuation request. Account limits depend on the plan and work performed; use the product’s usage dashboard for current availability. [Official OpenAI usage guidance](https://learn.chatgpt.com/docs/pricing).

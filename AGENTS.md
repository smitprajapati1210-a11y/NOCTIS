# Working on NOCTIS

- The authoritative checkout is `/Users/smitprajapati/Projects/NOCTIS`, opened by the user in VS Code. Use this checkout. Do not make a second application in a generated Codex chat folder.
- Read `PLAN.md` and `README.md`, then inspect Git status before editing. Preserve user changes.
- Product: a mobile-only, iPhone-first sleep journal. Keep the desktop view phone-sized. The user explicitly requested a DARK PURPLE theme; do not switch back to light mode.
- Header branding stays compact: Outfit Medium lettering around 17px and a small crescent. The user rejected the oversized serif wordmark, orbit emblem and tagline; do not reintroduce that direction.
- Hide visible scrollbars throughout the app, including sheets and text fields. Preserve touch and keyboard scrolling.
- The user requested each night’s actual moon phase. Preserve local astronomy, date correctness across midnight, the phase name, and illumination percentage.
- Preserve separate sample/personal data. Never seed samples into the personal journal or overwrite stored entries on load.
- The assistant is a clearly labeled rule-based preview. Do not claim real AI, automatic sleep tracking, Apple Health access, cloud sync, medical diagnosis, or alarms until those are actually implemented and verified.
- Never put AI credentials in the client. A future AI integration needs server-only credentials and explicit handling of private journal data.
- Use isolated test data. Do not erase or rewrite a real browser journal to test changes.
- Run meaningful affected tests and a production build for application changes. For this milestone: `npm test` and `npm run build`.
- Keep progress, verification limits and concrete next steps in `PLAN.md`, and save useful local Git checkpoints. Do not imply that usage limits trigger autonomous continuation.

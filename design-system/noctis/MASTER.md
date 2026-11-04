# NOCTIS design system

The user’s direction is authoritative: **dark purple, premium, engaging, mobile only**, with distinct page compositions, beautiful typography, a floating/gliding selector, considered page transitions, and the actual moon phase. This is a sleep journal used in low light, not a marketing site.

## Sources and decisions

Applied the installed **UI/UX Pro Max** and **UI Animation** skills. The focused UI/UX search returned `dark-mode-oled`, appropriate for this context. Adapt its dark surfaces and readable contrast to the user’s purple palette. The broad generator also suggested a light marketing/testimonial composition; that was rejected as a poor fit for the actual product. Do not introduce testimonials, a landing-page structure, light mode, or decorative scroll reveals.

## Typography

- **Instrument Serif 400, regular and italic:** expressive display headings, diary notes, selected large insight numbers. Use restraint and generous line height. Avoid applying display type to small controls or dense data.
- **Manrope Variable:** body, controls, dates, navigation and numerical data. Use tabular figures on timers and metric columns.
- Both are bundled locally through Fontsource. No Google Fonts runtime request. Font licenses remain in their packages.
- Input text stays at least 16 CSS px, including search and chat, to avoid iOS focus zoom. Secondary captions should remain readable; physical Dynamic Type testing is still required.

## Semantic color roles

| Role           | Value                  |
| -------------- | ---------------------- |
| Base           | `#130f1c`              |
| Card           | `#20182b`              |
| Raised surface | `#2c203a`              |
| Primary text   | `#f1e9f8`              |
| Secondary text | `#bfaecf`              |
| Tertiary text  | `#ad96bf`              |
| Lilac action   | `#ceb0ec`              |
| Text on action | `#2c183b`              |
| Subtle border  | `#3e2d4c`              |
| Journal accent | muted rose / parchment |
| Lab accent     | desaturated sage       |

Calculated solid-color contrast pairs: primary/card **14.47:1**, secondary/card **8.29:1**, tertiary/base **7.09:1**, action text/action **8.49:1**, inactive navigation/dock **6.39:1**, diary note/base **11.37:1**. These establish the core palette; they are not a claim that every gradient/composited state has passed a complete accessibility audit.

## Four distinct compositions

1. **Today:** a lunar scene, personal greeting, current phase/illumination, latest-night summary and a useful goal dial. The moon is the emotional focal point. No repeated large text-only intro.
2. **Journal:** an intimate, date-led ledger. Seven-morning rail, parchment/rose accents, serif note excerpts, quiet separators, expandable month heatmap. Avoid wrapping each night in the same card.
3. **Night Lab:** editorial field notes, a large actual average, quiet stat columns, rested-rating line chart, expandable pattern comparisons and local chat with data cards. Do not imply a connected LLM.
4. **Tonight:** centered display type and an immersive breathing orb before practical planning. A smaller moon label, transparent schedule timeline, then small rituals. Motion is user-triggered; no endless idle background activity.

## Layout and controls

- One phone shell, max width 460px. Desktop view remains a phone, not a dashboard.
- Header and floating dock persist. Only the middle viewport scrolls and participates in page snapshots.
- Use 20–24px horizontal gutters; 4/8px spacing rhythm, readable line lengths and safe-area insets.
- Main actions and icon controls generally use 44–48px targets. Dense charts have a large-target data-list alternative; 30-day bars are not tiny interactive controls.
- Keep focus rings, visible labels, native dates/times, modal Escape/close, and a focus trap. No swipe-only essential actions.
- Samples remain separate. “Start my journal” exists on Today, opens the first-entry sheet, and changes mode only after saving. Other pages carry a small sample-data status.

## Motion system

| Interaction          | Properties                                          | Timing / easing                       |
| -------------------- | --------------------------------------------------- | ------------------------------------- |
| Floating dock cursor | direct `transform` on one persistent element        | 420ms, `cubic-bezier(.22,1,.36,1)`    |
| Secondary selector   | direct `transform` on one persistent element        | 280ms, same enter curve               |
| Page change          | captured viewport `transform` + `opacity`           | 280ms; incoming ±28px, outgoing ∓16px |
| Sheet entry / exit   | `transform` + scrim `opacity`                       | 280ms / 160ms, enter curve            |
| Press / release      | immediate press scale, transform release            | 0ms / 160ms                           |
| Secondary content    | restrained opacity/6px entry after a user selection | 160–200ms                             |

The dock’s longer settling time is deliberate: the selector can travel across the full four-tab dock, and the user explicitly requested a floating glide. The steep curve covers most distance early; input and focus never wait for it. Do not add bounce or elastic overshoot everywhere.

Use the native View Transition API when available, with a direct fallback. Skip stale transition callbacks so rapid taps always reach the latest destination. The dock remains live outside the page snapshot. CSS transitions retarget current positions. Reduced motion skips spatial page transitions and moves selectors immediately, while preserving restrained feedback. Pause the breathing loop when hidden; it exists only while running.

No automatic first-load flourish, typewriter text, parallax, particle storm, spinning moon, animated chart heights, or “animate everything” package. Native CSS/WAAPI/browser transitions are sufficient.

## Files to edit

- `src/editorial.css`: current typography and the distinct page compositions.
- `src/refinements.css`: phone viewport, gliding controls, motion tokens, transitions and touch sizing.
- `src/styles.css`: foundational component styles. Current theme/refinement layers load after it.
- `src/motion.ts`: interruption, reduced motion and browser View Transition integration.
- `src/components/OverlayPresence.tsx`: paired sheet exit and rapid-reopen cleanup.

## Motion review

| Before                                         | After                                                | Why                                              |
| ---------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Selected tab background replaced in place      | One floating cursor glides between tabs              | Continuity and spatial orientation               |
| Page switched abruptly                         | Directional viewport transition, dock stays live     | Show where the user is going                     |
| Sheet vanished immediately                     | Paired enter/exit with immediate focus release       | Clear dismissal without blocking the next action |
| Small isolated chart bars were tap targets     | Whole weekly columns plus a night-by-night list      | Reduce precision required                        |
| Chart height transition                        | No animated layout properties                        | Keep data readable and avoid layout animation    |
| Same composition and system font on every page | Four page-specific layouts with a coherent font pair | Give each task a recognizable place              |

Code checks found no `transition: all`, animated layout properties, or permanent `will-change`. Rapid navigation, reduced-motion routing, and immediate sheet reopening have regression tests. Safari’s home, Journal, Lab and Tonight layouts were inspected; home and Lab were also inspected at 375×812. Native DevTools showed the timing tokens. Chrome animation-panel slow playback and physical-device gesture/keyboard/Dynamic Type checks remain unverified; do not claim those passed.

**Approve for local milestone testing.** Physical-device motion tuning remains the next verification task. The implementation does not wait for animation completion before accepting input or updating data.

# NOCTIS design system

The user’s direction is authoritative: **dark purple, premium, engaging, mobile only**, with distinct page compositions, beautiful typography, a floating/gliding selector, considered page transitions, and the actual moon phase. This is a sleep journal used in low light, not a marketing site.

## Sources and decisions

Applied the installed **UI/UX Pro Max** and **UI Animation** skills. The focused UI/UX search returned `dark-mode-oled`, appropriate for this context. Adapt its dark surfaces and readable contrast to the user’s purple palette. The broad generator also suggested a light marketing/testimonial composition; that was rejected as a poor fit for the actual product. Do not introduce testimonials, a landing-page structure, light mode, or decorative scroll reveals.

## Typography

- **Instrument Serif 400, regular and italic:** expressive display headings, diary notes, selected large insight numbers. Use restraint and generous line height. Avoid applying display type to small controls or dense data.
- **Manrope Variable:** body, controls, dates, navigation and numerical data. Use tabular figures on timers and metric columns.
- Both are bundled locally through Fontsource. No Google Fonts runtime request. Font licenses remain in their packages.
- Input text stays at least 16 CSS px, including search and chat, to avoid iOS focus zoom. Secondary captions should remain readable; physical Dynamic Type testing is still required.

## Header identity

Use a compact Outfit Medium wordmark around 17px with 2.5px tracking and a small crescent. Preserve the original 72px mobile header height (plus safe area), the 44px Home/settings targets and visible sample status. The user rejected a much larger high-contrast serif wordmark, an orbital emblem and a tagline. Keep the header close to the original scale, with cleaner lettering; no decorative lockup, microcopy or idle animation. Outfit is locally bundled and reserved for branding.

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
4. **Wind down:** a compact introduction, a practical 15/30/45-minute timer and the daily checklist together as the first task. Planning follows the checklist. The short breathing pause is an optional section. A prominent Today card and the explicit bottom-nav label make this core feature easy to find. Preserve the actual moon label and the schedule timeline below the primary session.

## Layout and controls

- One phone shell, max width 460px. Desktop view remains a phone, not a dashboard.
- Hide visible scrollbars on every scrollable app surface, including nested sheets, chat and text fields. Keep touch and keyboard scrolling intact; never hide content with `overflow: hidden` just to remove its scrollbar.
- Header and floating dock persist. Only the middle viewport scrolls and participates in page snapshots.
- Use 20–24px horizontal gutters; 4/8px spacing rhythm, readable line lengths and safe-area insets.
- Main actions and icon controls generally use 44–48px targets. Dense charts have a large-target data-list alternative; 30-day points are not tiny interactive controls.
- Keep focus rings, visible labels, native dates/times, modal Escape/close, and a focus trap. No swipe-only essential actions.
- Samples remain separate. “Start my journal” exists on Today, opens the first-entry sheet, and changes mode only after saving. Other pages carry a small sample-data status.

## Profile glass controls

The sleep-goal hours slider uses a reflective lilac glass thumb over a rounded progress track. Preserve the native range input, accessible hour value, quarter-hour steps, and explicit save action. **Explore sample nights** is a translucent capsule button with a reflective rim and a glass switch bubble. Keep its switch semantics and separate sample/personal data. Press feedback is immediate; release settles through CSS transitions. Reduced Motion removes animated spatial transitions.

## Wind-down priority

The timer and checklist sit together before planning. The Today shortcut shows daily progress and a live countdown while running. Use tabular countdown numbers, clear start/pause/reset controls, and the existing short motion tokens for checkbox feedback and progress.

Today opens with a local-time lunar greeting in DM Serif Text, **Log a night**, and the weekly sleep chart. **Ask Noctis** follows the chart and secondary actions. The chart uses dim pinpoints in a restrained dark sky, soft circular blooms for logged nights, and a thin lilac stroke. Logged points enter in date order, then a left-to-right reveal draws the connections. Missing nights break the path. Today and Past weeks share the chart. Use lilac for the main action and active selectors, muted sage for wind-down, and quiet plum surfaces for secondary controls.

## Sleep charts

The user requested minimal point-and-line charts instead of duration bars. Use a thin, straight lilac line, small circular points and faint reference rules; no area fill, glow or automatic drawing animation. Preserve date spacing and break the line at missing nights. Weekly columns remain easy to tap; dense month plots use the night-by-night list for selection. The dashed goal rule is directly labeled in the legend. Apply the same chart to local chat cards.

## Motion system

| Interaction          | Properties                                          | Timing / easing                       |
| -------------------- | --------------------------------------------------- | ------------------------------------- |
| Tab and segmented picker cursor | `transform`, a deforming outline, and a moving reflection | 310ms, fast glide and soft settle |
| Scroll starfield    | direct `transform` on two background layers | Scroll-linked with brief flick momentum on the nearer layer |
| Page change          | captured viewport `transform` + `opacity`           | 280ms; incoming ±28px, outgoing ∓16px |
| Sheet entry / exit   | `transform` + scrim `opacity`                       | 280ms / 160ms, enter curve            |
| Press / release      | immediate press scale, transform release            | 0ms / 160ms                           |
| Secondary content    | restrained opacity/6px entry after a user selection | 160–200ms                             |

Use `GlassSelector` throughout the app for tab switchers and segmented pickers. The track and bubble rest as rounded rectangles with straight sides, and the inner radius follows the track radius and gap. Keep this shape and the bright lilac glass across the bottom dock, Discover, moon dates, and timer presets. Vary only the dimensions and thickness to suit the layout. Movement deforms the corners and carries a reflection in the direction of travel. Horizontal drags start from the current selection and commit the option under the pointer on release. The page changes independently of the selector’s settling time.

The background sky uses two layers behind the signed-in pages. Slow scrolling moves both layers at different rates. A quick flick briefly adds up to 24 px of drift to the nearer stars. The effect uses native scrolling and keeps the sky static with Reduced Motion. The weekly chart remains brighter than the page background.

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

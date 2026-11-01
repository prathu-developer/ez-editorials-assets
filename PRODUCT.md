# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users
Competitive examination aspirants (UPSC, Banking, SSC, State PSCs), university students, and working professionals balancing rigorous exam preparation with daily schedules under high cognitive load.

## Product Purpose
Deliver high-yield daily editorial digests, vocabulary drills, and full-fidelity Computer-Based Testing (CBT) mock tests with seamless state continuity across mobile micro-sessions and extended desktop study.

## Positioning
An exam preparation and editorial reading suite engineered for multi-surface ergonomics: ultra-lightweight 5-minute drills in Telegram Mini App (TMA), offline-resilient sectional practice in Android (Capacitor), and deep, uncompromised 2-hour CBT simulation with dense analytical scorecards on Desktop Web—free of AI visual clutter and mobile-stretched compromises.

## Operating Context
- **Telegram Mini App (TMA):** Low-friction onboarding, viral quiz links, rapid transit flash drills, and instant bot alerts. Must adapt to Telegram client theme variables and respect swipe-to-close safe zones.
- **Android App (Capacitor):** Daily retention, push notifications, offline syncing, and 30-minute sectional mocks with strict 48x48dp touch targets and edge-to-edge system bars.
- **Desktop Web:** Timed full-length CBT mock exams (multi-section navigation, question palettes, split-view reading comprehension), comprehensive percentile telemetry, and account management.

## Capabilities and Constraints
- Multi-surface routing via `platform-bridge.js`: automatically directs TMA and Capacitor Android to `app.html` while serving full desktop portal at `index.html`.
- Strict TMA payload budget (< 250 KB initial assets) and dynamic theme variable bindings (`--tg-theme-*`).
- Android edge-to-edge compliance (`WindowInsets` padding for status bar and gesture navigation).
- Fluid responsive desktop layouts (1024px to 4K ultra-wide) with comprehensive keyboard controls (shortcuts, modal focus traps, Escape handling).
- Offline and degraded-network resilience during active mock tests with local synchronization on reconnect.

## Brand Commitments
- **Name:** Ez Editorials
- **Tone & Identity:** Rigorous, editorial, focused, high contrast, academic clarity.
- **Typography:** Inter for UI/controls, Lora for long-form editorial reading, JetBrains Mono for data/counters/timers.
- **Anti-Slop:** Strict prohibition of nested card clutter, gratuitous hero illustrations pushing content below fold, and blown-up mobile views on desktop.

## Evidence on Hand
- Production codebases: `index.html` (desktop portal), `app.html` (mobile shell), `test.html` (CBT exam engine), `result.html` (performance telemetry), `magazine.html` (editorial reader).
- Established tokens and design guidelines: `DESIGN.md`, `tokens.css`, `test-base.css`, `test-cbt.css`.
- Android wrapper setup in `android/` and `capacitor.config.json`.

## Product Principles
1. **Content First, Chrome Second:** The editorial text and examination questions are the absolute focal point; interface chrome must recede.
2. **Native Ergonomics Per Surface:** Touch targets expand on mobile and touch devices; keyboard shortcuts and density lead on desktop.
3. **Zero Visual Friction:** Fast load times, crisp typography, and restrained accent economy over decorative noise.
4. **State & Continuity Parity:** Frictionless flow from transit micro-quizzes to deep, distraction-free desktop analytical reviews.

## Accessibility & Inclusion
- Strict WCAG AA contrast compliance across both dark and light color systems.
- Complete keyboard accessibility for test navigation and question palette interactions.
- Respect for system motion preferences (`prefers-reduced-motion`) and dynamic font scaling.

## Deployment & Git Workflow
After completing any /impeccable modification command (onboard, distill, quieter, polish, adapt, bolder, typeset, layout, harden) and verifying zero P0/P1 errors via npx impeccable detect, automatically run git add -A, git commit with a conventional commit message, and git push from inside the ez-editorials-assets directory.


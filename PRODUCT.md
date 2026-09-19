# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Indian competitive examination aspirants (UPSC Civil Services, Banking & Insurance / RBI, SSC CGL, State PCS, and Defense exams). They study in structured daily exam-preparation routines: reading multi-source newspaper editorials every morning, extracting challenging vocabulary words, memorizing meanings with contextual usage, taking time-bound comprehension and grammar quizzes, and reviewing weekly compilations to maintain long-term retention and daily consistency streaks.

## Product Purpose

Ez Editorials provides a complete, distraction-free study companion that bridges high-volume newspaper editorial analysis with active student engagement. It exists to turn passive newspaper reading into measurable exam mastery through automated editorial parsing, instant vocabulary definitions, structured daily quizzes, and downloadable/readable daily and weekly digital magazines. Success means an aspirant can complete their daily editorial reading, vocabulary learning, and quiz validation in under 20 minutes without ever leaving the ecosystem.

## Positioning

A Telegram-native study companion where community quizzes, daily editorial digests, and streak tracking seamlessly connect to a fast, interactive web reader. Unlike generic news apps or static PDF portals, Ez Editorials combines real-time Telegram distribution with a synchronized web interface, instant in-line vocabulary lookup, automated quiz scoring, and dedicated multi-source editorial magazines.

## Operating Context

- **Access channels**: Primarily accessed via Telegram Mini App (TMA inside mobile and desktop Telegram apps) and modern desktop/mobile web browsers (`https://ezeditorials.pages.dev`), with an Android APK wrapper via Capacitor (`com.ezeditorials.app`).
- **Daily schedule**: Editorial scraping triggers each morning (~11:00 AM IST), followed by schema generation, vocabulary analysis, and automated PDF magazine publication. Aspirants engage throughout the morning and evening study sessions.
- **Network & Device diversity**: Runs across smartphones on 4G/5G/Wi-Fi and laptops/tablets during deep study hours. Must load instantly, avoid layout shift, work smoothly in both light and dark modes, and preserve state during intermittent connectivity.

## Capabilities and Constraints

- **Capabilities**:
  - Daily multi-source editorial aggregator (The Hindu, Indian Express, etc.).
  - Interactive reader with font scaling, themes (Light/Dark), and in-line word definitions.
  - Daily and weekly magazine viewer with full-screen reading mode and PDF download options.
  - Interactive multiple-choice daily quizzes with instant grading, explanations, and streak tracking.
  - Multi-platform authentication supporting Telegram `initData` automatic login, session token persistence, and browser-based guest/student login.
- **Constraints**:
  - Telegram Desktop iframe constraint: Telegram Desktop webview renders in a narrow ~420px container, which must use mobile layout rules while browser desktop (`>=1024px`) uses full desktop layout rules.
  - Cloudflare Pages static hosting constraint: Frontend is deployed statically to Cloudflare Pages; backend APIs run on Render and Telegram Webhook bots.
  - Storage & Performance: Workflows and client assets must remain lean with zero unnecessary caching or artifact bloat.

## Brand Commitments

- **Name**: Ez Editorials (app ID: `com.ezeditorials.app`).
- **Brand Palette**: Core brand purple (`#5a32fa`), soft lavender tint (`#ece9ff`), crisp neutral cards (`#ffffff` / `#1e1e1e` in dark mode), high-contrast text (`#111827` / `#f3f4f6`), and emerald success indicators (`#10b981`).
- **Voice**: Encouraging, disciplined, academic yet modern, distraction-free, and student-first.

## Evidence on Hand

- Frontend codebase: `ez-editorials-assets/` (`app.html`, `auth.js`, `shell.js`, `tokens.css`, `shell.css`, `style.css`).
- Production domain: `ezeditorials.pages.dev`.
- Backend pipelines: `editorial-magazine-generator/` (Playwright-based PDF generator, schema generator), `exam-scraper-api/`, `ez-quiz-bot/`.
- Capacitor configuration: `ez-editorials-assets/capacitor.config.json` with package `com.ezeditorials.app`.

## Product Principles

1. **Zero Distraction, High Density**: Every element on screen must directly serve reading comprehension, vocabulary retention, or quiz practice. Eliminate phantom elements, unnecessary clutter, and repetitive sections.
2. **Seamless Telegram-Web Continuity**: A student starting a quiz or reading an editorial from Telegram should feel an instantaneous, frictionless transition into the web reader, with authentication, streaks, and progress preserved.
3. **Respect Student Time**: Pages must load instantly, navigation must be intuitive (easy access to previous days' quizzes and magazines), and readers must support comfortable full-screen deep reading.
4. **Adaptive Presentation**: Honor the user's viewport and platform context—compact and thumb-friendly for Telegram mobile webviews, spacious, balanced, and keyboard-friendly for desktop and laptop browsers.

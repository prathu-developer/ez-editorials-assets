---
name: Ez Editorials
description: A Telegram-native study companion and daily editorial reader for competitive exam mastery
colors:
  primary: "#1c64f2"
  primary-hover: "#1952c4"
  brand-crimson: "#e73b50"
  brand-light: "#eff6ff"
  brand-dark: "#1e3a8a"
  success: "#10b981"
  success-bg: "#def7ec"
  warning: "#f59e0b"
  warning-bg: "#fef3c7"
  danger: "#ef4444"
  danger-bg: "#fde8e8"
  review-purple: "#8b5cf6"
  review-purple-bg: "#f3e8ff"
  neutral-bg: "#f5f6f8"
  card-bg: "#ffffff"
  text-main: "#1a1a1a"
  text-muted: "#6b7280"
  text-subtle: "#94a3b8"
  border-main: "#e5e7eb"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.3
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  base: "12px"
  lg: "18px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-article:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.base}"
    padding: "24px"
  pill-day:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "8px 2px"
  pill-day-active:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
---

# Design System: Ez Editorials

## Overview

**Creative North Star: "The Daily Study Sanctum"**

Ez Editorials is designed as a disciplined, calm, high-legibility digital study sanctuary tailored for serious Indian competitive exam aspirants (UPSC, Banking, SSC, State PCS). The visual atmosphere strips away the sensationalism, aggressive banner ads, and cognitive overload typical of modern news websites, replacing them with a quiet, purposeful editorial environment built for deep morning comprehension, vocabulary acquisition, and speed reading.

Every interface element prioritizes visual stamina and uninterrupted focus. Surfaces are clean, crisp, and predominantly flat at rest, relying on subtle 1px border dividers rather than heavy shadows to establish hierarchy. Interactive components provide reassuring, tactile feedback that honors student momentum, while typography adheres to strict reading column ergonomics.

**Key Characteristics:**
- **Academic Focus & Zero Clutter**: High information density without visual crowding; every pixel serves reading comprehension or quiz practice.
- **Adaptive Ergonomics**: Tailored for both narrow, thumb-friendly Telegram Mini App webviews (~420px) and wide, keyboard-navigable desktop workspaces (≥1024px).
- **Tactile State Precision**: Clear, high-contrast active states with instant visual confirmation and gentle press micro-interactions.
- **High-Stamina Typography**: Generous 1.75 line-height and strict 680px max reading widths designed for long analytical reading sessions.

---

## Colors

The Ez Editorials palette pairs a focused, high-contrast monochrome foundation with a vibrant academic cobalt primary and purposeful semantic signals.

### Primary
- **Academic Cobalt** (`#1c64f2` in light mode, `#3b82f6` in dark mode): The foundational action accent. Used for active navigation pills, primary action buttons, selected tabs, progress bars, and high-priority links. Hover shifts to Deep Cobalt (`#1952c4`).
- **Cobalt Wash** (`#eff6ff` in light mode, `#1e3a8a` in dark mode): Low-intensity background tint for active button states, hover fills, and selection highlights.

### Secondary
- **Editorial Crimson** (`#e73b50`): Reserved for critical exam alerts, danger/destructive actions, and high-urgency editorial announcements.

### Tertiary
- **Evidence Amber** (`#f59e0b`, background `#fef3c7`, text `#92400e`, border `#d97706`): Used specifically for the "Evidence Lens" highlighting quantitative figures, statistics, and critical dates within editorial texts.
- **Mastery Emerald** (`#10b981`, background `#def7ec`, text `#03543f`): Used for quiz success confirmation, correct answers, active streak badges, and completion checkmarks.
- **Review Purple** (`#8b5cf6`, background `#f3e8ff`, text `#6b21a8`): Used for tone-of-article indicators, grammatical review pills, and vocabulary tags.

### Neutral
- **Body Canvas** (`#f5f6f8` in light mode, `#121212` in dark mode): Cool, neutral backdrop that recedes behind content cards.
- **Surface Card** (`#ffffff` in light mode, `#1e1e1e` in dark mode): Pure card background providing maximum contrast for reading text.
- **Subtle Surface** (`#f8fafc` in light mode, `#27272a` in dark mode): Recessed input fields, disabled buttons, and secondary toolbars.
- **Primary Ink** (`#1a1a1a` in light mode, `#f3f4f6` in dark mode): High-contrast, fatigue-reducing primary text color.
- **Muted Ink** (`#6b7280` in light mode, `#9ca3af` in dark mode): Secondary metadata, subtitles, timestamps, and inactive icons.
- **Subtle Ink** (`#94a3b8` in light mode, `#6b7280` in dark mode): Reading time indicators, tertiary captions, and disabled states.
- **Border Divider** (`#e5e7eb` in light mode, `#2e2e38` in dark mode): 1px structural dividing lines.

### Named Rules
**The 10% Accent Rule.** Academic Cobalt is reserved strictly for active elements, selected pills, primary call-to-actions, and interactive indicators. It must never cover more than 10% of any viewport. Its scarcity is what guides the student's eye.

**The Evidence Lens Rule.** Quantitative data, statistics, percentages, and survey figures inside editorial passages must be enclosed in the Evidence Amber pill (`.stat-number`) to train rapid scanning for exam mains and prelims data points.

---

## Typography

The typography system uses a single, highly legible humanist sans-serif family (`Inter`), balancing ultra-clean digital scanning with comfortable continuous reading.

**Display & Headline Font:** `Inter, -apple-system, BlinkMacSystemFont, sans-serif`  
**Body Font:** `Inter, -apple-system, BlinkMacSystemFont, sans-serif`  
**Numbers & Data:** `Inter, tabular-nums`

**Character:** Clean, objective, modern, and mathematically balanced. Free of decorative quirks that cause visual fatigue during 40-minute study sessions.

### Hierarchy
- **Display** (800 ExtraBold, 28px / `1.75rem`, line-height 1.3): Used for hero titles, major exam hub headers, and magazine volume banners.
- **Headline** (700 Bold, 22px / `1.375rem`, line-height 1.35): Used for editorial article titles and modal dialog titles.
- **Title** (600 SemiBold, 18px / `1.125rem`, line-height 1.4): Used for card headings, quiz question prompts, and section titles.
- **Body** (400 Regular, 15px / `0.9375rem`, line-height 1.75): Used for core editorial passages and reading comprehension texts.
- **Body Compact** (500 Medium, 14px / `0.875rem`, line-height 1.5): Used for quiz option text, explanations, and settings lists.
- **Caption / Meta** (600 SemiBold, 13px / `0.8125rem`, line-height 1.4): Used for article subtitles, author bylines, and timestamps.
- **Label** (700 Bold, 11px / `0.6875rem`, line-height 1.2, letter-spacing `0.05em`, uppercase): Used for source badges (THE HINDU, IE), topic tags, and navigation icons.

### Named Rules
**The Focus Reading Rule.** Editorial passages must be strictly constrained to a maximum width of 680px (`--max-reading-width`) with a line height of 1.75. Never allow multi-paragraph study text to span full-width across desktop screens.

**The Tabular Evidence Rule.** All scores, streak counts, timers, and quantitative metrics must use `font-variant-numeric: tabular-nums` to prevent layout jitter during active countdowns and updates.

---

## Layout

Ez Editorials implements a strict dual-mode layout that bridges Telegram Mini App viewports and desktop browsers seamlessly.

### Spatial Model & Breakpoints
- **Mobile Viewport (`< 768px`)**: Single-column vertical flow. Navigation lives in a fixed 60px bottom navigation bar (`.bottom-nav`). Modal interactions render as bottom sheets sliding up from the screen bottom.
- **Tablet Viewport (`768px – 1023px`)**: Centered container up to 768px (`--container-tablet`). Bottom sheets convert to centered modal dialogs.
- **Desktop Viewport (`≥ 1024px`)**: Split workstation layout. A sticky 60px top bar (`.desktop-navbar`) spans the top, accompanied by a sticky 240px left rail (`.left-nav-rail`). Bottom navigation is completely hidden (`display: none !important`).

### Telegram Desktop Exception
- **The TMA Desktop Frame Rule**: The official Telegram Desktop client renders Mini Apps within a fixed, narrow iframe (~420px wide). Even though the operating system is desktop, the application must treat Telegram Desktop as a mobile viewport (`isTgDesktop() === true`), suppressing the 240px left rail and sticky top bar to preserve usable reading area.

### Spacing Scale
- `2xs` (2px): Pill badge inner gaps and micro-margins.
- `xs` (4px): Meta tag spacing and day-nav pill gaps.
- `sm` (8px): Icon-to-label gaps and toolbar button padding.
- `md` (12px): Internal card item gaps and compact list padding.
- `base` (16px): Default surface padding, container margins, and paragraph gaps.
- `lg` (24px): Card interior padding on desktop and section headers.
- `xl` (32px): Major section separation.
- `2xl` (48px): Empty states and bottom scroll clearance.

---

## Elevation & Depth

Ez Editorials is **Flat-at-Rest**. Surfaces rely on clean 1px border lines (`#e5e7eb` / `#2e2e38`) to demarcate structural boundaries, reserving soft elevation shadows purely for interactive elevation and floating dialogs.

### Shadow Vocabulary
- **Resting Surface** (`none` or `0 1px 2px rgba(0, 0, 0, 0.05)`): Applied to cards and toolbars at rest.
- **Interactive Lift** (`0 4px 6px -1px rgba(0, 0, 0, 0.1)`): Applied when hovering over article cards and day pills.
- **Active Float** (`0 10px 15px -3px rgba(0, 0, 0, 0.1)`): Applied to floating action controls and popover menus.
- **Modal Overlay** (`0 20px 45px rgba(0, 0, 0, 0.2)` in light mode, `0 20px 45px rgba(0, 0, 0, 0.6)` in dark mode): Applied to centered modal dialogs and bottom sheets.

### Named Rules
**The Flat-at-Rest Rule.** Never apply heavy dropshadows to static content blocks. Depth is an interactive response to mouse hover, keyboard focus, or modal display.

**The Crisp Border Rule.** Every card, toolbar, and dialog surface must have an explicit 1px border (`var(--border-color)`). When dark mode is active, the border shifts to subtle dark slate (`#2e2e38`) to maintain clear bounding boxes without glowing.

---

## Shapes

Ez Editorials utilizes gentle, friendly rounded corners that soften the dense academic content while maintaining structural discipline.

- **Micro Radii (`4px` / `var(--radius-xs)`)**: Tone badges, quantitative evidence chips (`.stat-number`), and compact tag indicators.
- **Control Radii (`8px` / `var(--radius-md)`)**: Tool buttons, day pills, inputs, and secondary buttons.
- **Surface Radii (`12px` / `var(--radius-base)`)**: Article cards, hero containers, and desktop modal containers.
- **Container Radii (`20px` / `var(--radius-xl)`)**: Mobile bottom sheet top corners (`border-radius: 20px 20px 0 0`).
- **Pill Radii (`9999px` / `var(--radius-full)`)**: Newspaper source badges, streak counters, and target exam selector pills.

---

## Components

### Buttons
- **Shape**: Rounded rectangle (8px radius / `var(--radius-md)`).
- **Primary**: Background Academic Cobalt (`#1c64f2`), text pure white (`#ffffff`), padding 10px 20px, font-weight 600.
- **Hover / Active**: Hover transitions to Deep Cobalt (`#1952c4`). Active press scales down slightly (`transform: scale(0.98)`).
- **Secondary / Tool**: 1px border (`#e5e7eb`), background `#ffffff`, text `#1a1a1a`. Hover fills with Cobalt Wash (`#eff6ff`) with blue border.

### Day Navigation Pills (`.mag-day-pill`)
- **Shape**: Rounded rectangle (8px radius), 2-column or 6-column grid.
- **Resting**: Background card white (`#ffffff`), border 1px (`#e5e7eb`), muted gray text (`#6b7280`). Contains weekday abbreviation, date number, and an optional green dot for completed reads.
- **Active State**: Solid Academic Cobalt background (`#1c64f2`), pure white text, white completion dot, subtle box shadow.

### Article Cards (`.magazine-article-card`)
- **Shape**: Rounded card (12px radius), border 1px (`#e5e7eb`), padding 24px (`var(--space-lg)`).
- **Header Meta**: Newspaper source pill (e.g. `THE HINDU` in soft blue pill), topic tag, and reading time counter aligned to right.
- **Interaction**: On hover, transitions from `shadow-sm` to `shadow-md` with zero layout shift.

### Evidence Lens Badge (`.stat-number`)
- **Shape**: Compact chip (4px radius), 1px solid border (`#d97706`).
- **Color**: Evidence Amber background (`#fef3c7`), text `#92400e`, font-weight 700, `font-variant-numeric: tabular-nums`.

### Navigation Rails & Bars
- **Desktop Top Navbar**: 60px height, sticky top, bottom border 1px, contains brand logo, exam selector pill, streak pill, and avatar.
- **Desktop Left Rail**: 240px width, sticky left, right border 1px, containing vertical link pills with active blue background (`#eff6ff`) and blue text (`#1c64f2`).
- **Mobile Bottom Nav**: 60px fixed bottom bar, 4 to 5 equal items with 22px SVG icons and 11px bold text. Active item glows in Academic Cobalt.

### Modal Dialogs & Sheets
- **Mobile (<768px)**: Bottom sheet sliding up from bottom with 20px top corner radius, max-height 88vh.
- **Desktop (≥768px)**: Centered floating card with 16px radius, max-width 540–580px, backdrop blur 3px.

---

## Do's and Don'ts

### Do:
- **Do** preserve the 680px maximum reading container width for all editorial reading screens.
- **Do** provide tactile compression (`transform: scale(0.98)`) on all interactive buttons, day pills, and quiz choices.
- **Do** ensure all clickable touch targets are at least 44px in height to prevent mis-taps on mobile devices.
- **Do** show high-contrast outline focus rings (`outline: 2px solid #1c64f2; outline-offset: 2px;`) on all keyboard-focused interactive elements.
- **Do** highlight statistical figures and quantitative percentages using the Evidence Lens amber chip.

### Don't:
- **Don't** use decorative non-standard fonts; keep all interface copy strictly in `Inter`.
- **Don't** bleed the primary Academic Cobalt across large background hero sections (keep Cobalt presence ≤10%).
- **Don't** show the mobile bottom navigation bar on desktop screens (≥1024px).
- **Don't** treat Telegram Desktop as full desktop web; it must render in mobile/compact mode due to its 420px iframe limitation.
- **Don't** use pure black (`#000000`) for text; always use fatigue-reducing deep charcoal (`#1a1a1a`).

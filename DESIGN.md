# Design System & Technical Tokens

## 1. Guiding Design Principles
1. **Content First, Chrome Second:** Interface chrome (bars, borders, cards) must recede into the background. Content, typography, and test data are the focal points.
2. **Deterministic Responsiveness:** Every component knows its platform identity. Touch targets expand on touch surfaces; density tightens on pointer surfaces.
3. **Restrained Accent Economy:** Use neutral structural surfaces with a single bold semantic accent to command visual hierarchy.

---

## 2. Colour System & Tokens

### Core Neutral Palette
* `--surface-canvas`: `#0D0F12` (Dark) | `#F8F9FA` (Light)
* `--surface-panel`: `#16191E` (Dark) | `#FFFFFF` (Light)
* `--surface-raised`: `#1F232B` (Dark) | `#F1F3F5` (Light)
* `--border-subtle`: `rgba(255, 255, 255, 0.08)` (Dark) | `rgba(0, 0, 0, 0.08)` (Light)
* `--border-strong`: `rgba(255, 255, 255, 0.16)` (Dark) | `rgba(0, 0, 0, 0.18)` (Light)

### Typography & Text Contrast
* `--text-primary`: `#F1F3F5` (Dark, 15.8:1 contrast) | `#1A1D20` (Light, 16.2:1 contrast)
* `--text-secondary`: `#9FA6B2` (Dark, 7.2:1 contrast) | `#5A626A` (Light, 7.5:1 contrast)
* `--text-muted`: `#68707C` (Dark, 4.6:1 contrast) | `#7E8792` (Light, 4.8:1 contrast)

### Brand & Semantic Accents
* `--brand-primary`: `#2563EB` (Accessible Royal Blue)
* `--brand-hover`: `#1D4ED8`
* `--brand-surface`: `rgba(37, 99, 235, 0.12)`
* `--status-success`: `#10B981`
* `--status-warning`: `#F59E0B`
* `--status-danger`: `#EF4444`

---

## 3. Typography System
* **Display / Headings:** Inter, system-ui, -apple-system, sans-serif
* **Body / UI:** Inter, system-ui, -apple-system, sans-serif
* **Data / Code / Monospace:** JetBrains Mono, SF Mono, Menlo, monospace

### Scale & Hierarchy
| Token | Font Size | Line Height | Font Weight | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| `font-display` | 32 px (2.000 rem) | 1.20 | 700 | -0.025 em |
| `font-title-lg`| 24 px (1.500 rem) | 1.25 | 600 | -0.020 em |
| `font-title-md`| 20 px (1.250 rem) | 1.30 | 600 | -0.015 em |
| `font-body-lg` | 16 px (1.000 rem) | 1.50 | 400 | -0.011 em |
| `font-body-md` | 14 px (0.875 rem) | 1.45 | 400 | normal |
| `font-caption` | 12 px (0.750 rem) | 1.40 | 500 | +0.010 em |

---

## 4. Spacing Scale & Border Radii
* **Base Unit:** 4 px
* **Spacing Steps:**
  * `space-1`: 4 px | `space-2`: 8 px | `space-3`: 12 px | `space-4`: 16 px
  * `space-6`: 24 px | `space-8`: 32 px | `space-12`: 48 px | `space-16`: 64 px
* **Corner Radius Hierarchy:**
  * Controls & Badges: `rounded-sm` (4 px) to `rounded-md` (8 px)
  * Standard Cards & Dialogs: `rounded-lg` (12 px)
  * Bottom Sheets & Mobile Modals: `rounded-xl` (16 px to 24 px top corners)
  * Pills: `rounded-full` (9999 px — reserved strictly for tags/badges, never large cards)

---

## 5. Platform-Specific Directives

### 1. Telegram Mini App (TMA) Requirements
* **Theme Injection Bridge:** Always map core variables to Telegram CSS variables as the primary source:
  ```css
  :root[data-platform="tma"] {
    --surface-canvas: var(--tg-theme-bg-color, #0D0F12);
    --surface-panel: var(--tg-theme-secondary-bg-color, #16191E);
    --text-primary: var(--tg-theme-text-color, #F1F3F5);
    --text-secondary: var(--tg-theme-hint-color, #9FA6B2);
    --brand-primary: var(--tg-theme-button-color, #2563EB);
    --brand-contrast: var(--tg-theme-button-text-color, #FFFFFF);
  }
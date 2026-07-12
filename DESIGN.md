# Design System — Miguel Pasa Portfolio

## Philosophy

Flat, color-forward, animation-led. Design never competes with the work — it frames it. Color and motion carry all expressive weight; structure stays invisible. No shadows, no gradients, no decorative noise.

## Dials

| Dial | Value | Rationale |
|------|-------|-----------|
| DESIGN_VARIANCE | 6 | Minimal composition; color does the lifting |
| MOTION_INTENSITY | 8 | The intro sequence IS the design |
| VISUAL_DENSITY | 2 | Near-empty; extreme breathing room |

---

## Color

| Token | Value | Role |
|-------|-------|------|
| `--orange` | `#F5A623` | Primary brand, fills, accents |
| `--white` | `#FFFFFF` | Text on orange, base background |
| `--dark` | `#111111` | Text on white sections |
| `--surface` | `#F7F7F7` | Subtle section backgrounds |

Rules:
- One accent color site-wide. Orange only, never introduced alongside a second accent.
- No gradients on brand fills. Flat color only.
- No drop shadows. Zero.
- White was chosen for the intro name over the color-wheel complement (blue) — white reads with more decisiveness and finality on the orange field.

---

## Typography

**Typeface:** DM Sans (Google Fonts)
Geometric, clean, slightly warmer than Inter. Excellent legibility at wide tracking.

| Role | Weight | Size | Tracking | Case |
|------|--------|------|----------|------|
| Intro name | 200 | clamp(1rem, 3vw, 2.6rem) | 0.5em | Uppercase |
| Section headers | 300 | clamp(1.4rem, 2.2vw, 2rem) | 0.04em | Sentence |
| Body | 400 | 1rem / 1.65 lh | 0 | Sentence |
| Meta / caption | 300 | 0.8rem | 0.12em | Uppercase |

Notes:
- Always add `padding-left: letter-spacing` to compensate for trailing spacing on centered uppercase text.
- Line height 1 for display type, 1.65 for body.

---

## Animation System

Every animation earns its place. Motion communicates sequence and hierarchy — nothing decorative.

| Event | Duration | Easing | Delay |
|-------|----------|--------|-------|
| Circle appear | ~156ms (first 12% of burst) | ease-out | 350ms |
| Circle expand to full | ~1144ms | cubic-bezier(0.16, 1, 0.3, 1) | ~490ms |
| Name fade-rise | 850ms | cubic-bezier(0.33, 1, 0.68, 1) | 1850ms |
| Hover states (future) | 200ms | ease | 0 |
| Section scroll reveals (future) | 600ms | cubic-bezier(0.16, 1, 0.3, 1) | staggered |

Rules:
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`.
- `will-change: transform` only on elements actively mid-animation.
- All motion collapses to static final state under `prefers-reduced-motion: reduce`.
- Circle scale is calculated dynamically from `Math.hypot(innerWidth, innerHeight)` to guarantee full coverage at any resolution.

---

## Spacing Scale

Base unit: 8px. All spacing is a multiple of 8.

`8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 192`

Section vertical padding: `96px` desktop, `64px` mobile.

---

## Layout (planned sections)

| # | Section | Layout family |
|---|---------|---------------|
| 1 | Intro | Full-screen color reveal |
| 2 | Work | Asymmetric image grid, 2-3 col |
| 3 | About | Split: portrait left, text right |
| 4 | Contact | Single column, minimal |

- Max content width: 1200px centered
- Grid: 12-column, 24px gutter
- Mobile breakpoint: 768px

---

## Interaction (planned)

- Links: underline on hover, none at rest
- CTAs: flat fill, 0 border-radius or 2px max, no shadows
- No custom cursor
- Focus rings: 2px solid `--orange`, 2px offset

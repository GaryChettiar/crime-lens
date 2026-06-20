# CrimeLens Design System Specification

> Enterprise-grade design system for an AI-Powered Crime Analytics & Visualization Platform.

## Design Philosophy

CrimeLens follows the visual language of government intelligence platforms:

- **Data density over decoration** — Every pixel serves a purpose
- **Clarity over creativity** — Users are analysts making critical decisions
- **Accessibility first** — WCAG 2.2 AAA wherever feasible
- **Consistent spacing** — Strict 4px base grid
- **Predictable interactions** — No surprises in a high-stakes environment
- **High contrast** — Dark-first, legibility in any lighting condition

**Inspirations**: Palantir Gotham, ArcGIS Dashboard, Datadog, Linear

**Avoid**: Crypto dashboards, neon/cyberpunk themes, gaming UI, excessive gradients, glassmorphism

---

## Architecture

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | TailwindCSS v4 (CSS-first) |
| Components | ShadCN UI (Radix Nova preset) |
| State | Redux Toolkit + RTK Query |
| Icons | Lucide React |
| Charts | Recharts |
| Maps | React-Leaflet |
| Graphs | ReactFlow |

### File Structure
```
src/
├── components/
│   ├── ui/              # ShadCN primitives (auto-generated)
│   ├── atoms/           # Typography, Badge, Icon
│   ├── molecules/       # StatCard, SearchBar, FilterGroup
│   ├── organisms/       # Sidebar, TopNavbar
│   └── templates/       # DashboardLayout, AnalyticsLayout, ReportLayout
├── features/            # Feature-first modules
│   ├── auth/
│   ├── dashboard/
│   ├── analytics/
│   ├── heatmap/
│   ├── risk/
│   ├── network/
│   ├── reports/
│   └── alerts/
├── services/            # RTK Query API slices
├── store/               # Redux store + slices
├── styles/              # Design tokens + theme
├── lib/                 # Utilities (cn, etc.)
├── types/               # Shared TypeScript types
└── docs/                # Design system documentation
```

---

## Color System

### Semantic Tokens

All colors are referenced via CSS custom properties. **Never use raw hex/HSL values in components.**

| Token | Dark Theme | Light Theme | Purpose |
|-------|-----------|-------------|---------|
| `--background` | `hsl(222, 20%, 7%)` | `hsl(210, 20%, 98%)` | Page background |
| `--foreground` | `hsl(210, 20%, 90%)` | `hsl(222, 25%, 10%)` | Primary text |
| `--card` | `hsl(222, 18%, 10%)` | `hsl(0, 0%, 100%)` | Card surfaces |
| `--primary` | `hsl(213, 70%, 50%)` | `hsl(213, 75%, 42%)` | Primary actions |
| `--muted` | `hsl(220, 15%, 16%)` | `hsl(210, 15%, 94%)` | Subtle backgrounds |
| `--border` | `hsl(220, 15%, 18%)` | `hsl(210, 15%, 86%)` | Borders |
| `--success` | `hsl(142, 55%, 40%)` | `hsl(142, 60%, 32%)` | Success states |
| `--warning` | `hsl(38, 85%, 55%)` | `hsl(38, 90%, 42%)` | Warning states |
| `--danger` | `hsl(0, 65%, 50%)` | `hsl(0, 70%, 42%)` | Error/danger |
| `--info` | `hsl(200, 70%, 50%)` | `hsl(200, 75%, 38%)` | Informational |

### Risk Level Colors

| Level | Token | Dark Value | Use Case |
|-------|-------|-----------|----------|
| Low | `--risk-low` | `hsl(142, 55%, 40%)` | Safe zones |
| Medium | `--risk-medium` | `hsl(38, 85%, 55%)` | Watch zones |
| High | `--risk-high` | `hsl(25, 90%, 50%)` | Alert zones |
| Critical | `--risk-critical` | `hsl(0, 65%, 50%)` | Emergency zones |

### Data Visualization Palette

8-color colorblind-safe palette for charts:

| Index | Token | Purpose |
|-------|-------|---------|
| 1 | `--chart-1` | Primary series (blue) |
| 2 | `--chart-2` | Secondary series (green) |
| 3 | `--chart-3` | Tertiary series (amber) |
| 4 | `--chart-4` | Quaternary series (purple) |
| 5 | `--chart-5` | Quinary series (red) |
| 6 | `--chart-6` | Senary series (teal) |
| 7 | `--chart-7` | Septenary series (pink) |
| 8 | `--chart-8` | Octonary series (orange) |

---

## Typography

**Font**: Inter (variable weight, self-hosted via @fontsource)

| Token | Size | Line Height | Weight | Spacing |
|-------|------|------------|--------|---------|
| `display-xl` | 48px | 1.1 | 700 | -0.025em |
| `display-lg` | 36px | 1.15 | 700 | -0.025em |
| `display-md` | 30px | 1.2 | 600 | -0.02em |
| `heading-xl` | 24px | 1.25 | 600 | -0.015em |
| `heading-lg` | 20px | 1.3 | 600 | -0.01em |
| `heading-md` | 18px | 1.35 | 600 | -0.01em |
| `heading-sm` | 16px | 1.4 | 600 | -0.005em |
| `body-lg` | 16px | 1.6 | 400 | 0 |
| `body-md` | 14px | 1.6 | 400 | 0 |
| `body-sm` | 12px | 1.5 | 400 | 0.01em |
| `caption` | 11px | 1.45 | 500 | 0.02em |

**Tabular numbers**: Use `.font-data` class for data columns (tabular-nums + lining-nums).

---

## Spacing

Strict 4px base grid. Only these values are permitted:

| Token | Pixels | Tailwind |
|-------|--------|----------|
| 1 | 4px | `p-1` |
| 2 | 8px | `p-2` |
| 3 | 12px | `p-3` |
| 4 | 16px | `p-4` |
| 6 | 24px | `p-6` |
| 8 | 32px | `p-8` |
| 12 | 48px | `p-12` |
| 16 | 64px | `p-16` |
| 20 | 80px | `p-20` |
| 24 | 96px | `p-24` |

---

## Border Radius

| Token | Value | Tailwind |
|-------|-------|----------|
| xs | 2px | `rounded-xs` |
| sm | 4px | `rounded-sm` |
| md | 6px | `rounded-md` |
| lg | 8px | `rounded-lg` |
| xl | 12px | `rounded-xl` |
| 2xl | 16px | `rounded-2xl` |

---

## Shadow System

Minimal enterprise shadows — no dramatic drop shadows.

| Token | Value | Use Case |
|-------|-------|----------|
| xs | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| sm | `0 1px 3px rgba(0,0,0,0.1)` | Cards |
| md | `0 4px 6px rgba(0,0,0,0.1)` | Dropdowns |
| lg | `0 10px 15px rgba(0,0,0,0.1)` | Modals |

---

## Motion

| Duration | Value | Use Case |
|----------|-------|----------|
| Micro | 75ms | Hover, active states |
| Fast | 150ms | Tooltips, opacity |
| Standard | 250ms | Modals, sidebars |
| Emphasis | 350ms | Page transitions |

**Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)

**Reduced motion**: All animations disabled via `prefers-reduced-motion: reduce`.

---

## Z-Index Scale

| Layer | Value |
|-------|-------|
| Base | 0 |
| Dropdown | 10 |
| Sticky | 20 |
| Fixed | 30 |
| Overlay | 40 |
| Modal | 50 |
| Popover | 60 |
| Toast | 70 |
| Tooltip | 80 |
| Command Palette | 90 |

---

## Component Standards

Every data-driven component MUST support these four states:

1. **Loading** — Skeleton animation, `aria-busy="true"`
2. **Error** — Error message, retry action, `role="alert"`
3. **Empty** — "No data available" message
4. **Success** — Normal data render (default path)

---

## Theme Switching

Theme is managed via Redux UI slice + `data-theme` attribute:

```tsx
import { useAppDispatch } from '@/store/hooks';
import { setTheme } from '@/store/uiSlice';

dispatch(setTheme('dark'));  // or 'light' or 'system'
```

The `setTheme` action:
1. Persists to `localStorage`
2. Updates `data-theme` attribute on `<html>`
3. Updates CSS class on `<html>`

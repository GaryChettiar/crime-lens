# CrimeLens Accessibility Guide

> WCAG 2.2 AAA compliance standards for the CrimeLens platform.

## Overview

CrimeLens serves law enforcement professionals making critical decisions. Accessibility is not optional — it ensures all users, regardless of ability, can effectively use the platform.

**Target**: WCAG 2.2 AAA wherever technically feasible.

---

## Contrast Requirements

### AAA Standards

| Element | Minimum Ratio | How We Achieve It |
|---------|--------------|-------------------|
| Normal text (< 18px) | 7:1 | High-contrast semantic tokens |
| Large text (≥ 18px bold, ≥ 24px regular) | 4.5:1 | Carefully tuned heading colors |
| UI components (borders, icons) | 3:1 | Distinct border/icon token values |
| Focus indicators | 3:1 | 2px solid ring with offset |

### Design Decisions

- **Dark theme default**: Light text on dark backgrounds naturally achieves high contrast ratios
- **Muted foreground**: Carefully chosen to be ≥7:1 against dark backgrounds while remaining visually secondary
- **Risk colors**: All risk-level colors (low/medium/high/critical) tested against their foreground pairs for AAA compliance
- **Chart colors**: Colorblind-safe palette — distinguishable under deuteranopia, protanopia, and tritanopia

---

## Focus Management

### Focus Visible Ring

All interactive elements use a consistent focus ring:

```css
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

**Why 2px offset**: Ensures the focus ring doesn't overlap content, making it clearly visible even on bordered elements.

**Why not :focus**: We use `:focus-visible` to show focus rings only for keyboard navigation, not mouse clicks. `:focus:not(:focus-visible)` removes the outline for mouse users.

### Focus Order

- Tab order follows visual layout (left-to-right, top-to-bottom)
- Sidebar navigation items are tabbable in order
- Modal/dialog focus is trapped when open
- Skip-to-content link recommended for future implementation

---

## Keyboard Navigation

### Global Shortcuts

| Action | Shortcut |
|--------|----------|
| Open search | `⌘K` / `Ctrl+K` |
| Close modal | `Escape` |
| Navigate sidebar | `Tab` / `Shift+Tab` |

### Component Requirements

Every interactive component MUST:

1. Be reachable via `Tab`
2. Be activatable via `Enter` or `Space`
3. Show a visible focus indicator
4. Support `Escape` to dismiss (for overlays)
5. Trap focus when modal/dialog is open

---

## Screen Reader Support

### ARIA Attributes

| Pattern | ARIA Attributes |
|---------|----------------|
| Active nav link | `aria-current="page"` |
| Collapsible sidebar | `aria-expanded="true/false"` |
| Loading component | `aria-busy="true"`, `aria-label="Loading {name}"` |
| Error alert | `role="alert"` |
| Search input | `role="searchbox"`, `aria-label="Search"` |
| Icon-only button | `aria-label="Action name"` |
| Badge count | `aria-label="X notifications"` |
| Navigation region | `aria-label="Main navigation"` |

### Semantic HTML

| Use | Element |
|-----|---------|
| Page header | `<header role="banner">` |
| Navigation | `<nav aria-label="...">` |
| Main content | `<main role="main" id="main-content">` |
| Card/section | `<section aria-labelledby="...">` |
| Data table | `<table>` with `<thead>`, `<th scope="col">` |
| Lists | `<ul role="list">` with `<li>` |

---

## Color Independence

**Rule**: Never convey meaning through color alone.

For risk indicators, always pair color with:
- Text label ("Critical Risk")
- Icon (AlertTriangle for critical)
- Dot indicator (`.dot` prop on Badge)

For charts:
- Use pattern fills or shape markers alongside color
- Provide data labels or tooltips
- Use the colorblind-safe palette (`--chart-1` through `--chart-8`)

---

## Reduced Motion

Users who set `prefers-reduced-motion: reduce` in their OS settings:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Exception**: Loading spinners are preserved but slowed to 3s duration.

---

## Component Accessibility Checklist

Use this checklist when creating new components:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus ring is visible on keyboard navigation
- [ ] Screen reader announces component purpose
- [ ] Loading state uses `aria-busy="true"`
- [ ] Error state uses `role="alert"`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Meaningful icons have `aria-label`
- [ ] Color is not the sole indicator of state
- [ ] Text meets AAA contrast ratio (7:1)
- [ ] Component works with reduced motion enabled
- [ ] Touch targets are ≥ 44x44px on mobile

---

## Testing

### Automated
- aXe DevTools browser extension
- eslint-plugin-jsx-a11y

### Manual
- Tab through entire page — verify focus order
- Use screen reader (NVDA/VoiceOver) — verify announcements
- Set `prefers-reduced-motion: reduce` — verify animations stop
- Zoom to 200% — verify layout doesn't break
- High contrast mode — verify text remains readable

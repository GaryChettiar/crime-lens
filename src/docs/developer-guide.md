# CrimeLens Developer Implementation Guide

> How to use the CrimeLens design system when building new features and components.

---

## Quick Start

```bash
npm run dev   # Start development server
```

The Design System Preview page loads at `/` — use it as a living reference.

---

## Using Design Tokens

### In Tailwind Classes

```tsx
// Colors — from theme.css semantic tokens
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
<div className="text-primary bg-primary/10" />
<div className="text-muted-foreground" />

// Spacing — strict scale
<div className="p-4 gap-2 mt-6" />  // 16px, 8px, 24px

// Radius
<div className="rounded-md" />  // 6px
<div className="rounded-lg" />  // 8px

// Shadows
<div className="shadow-sm" />   // cards
<div className="shadow-md" />   // dropdowns
```

### In TypeScript

```tsx
import { SPACING, RADIUS, CHART_COLORS, RISK_COLORS, Z_INDEX } from '@/styles/tokens';

// Recharts
<Bar fill={CHART_COLORS[0]} />

// Dynamic styles
style={{ zIndex: Z_INDEX.modal, padding: SPACING[4] }}
```

---

## Theme Switching

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme } from '@/store/uiSlice';

function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);

  return (
    <button onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}>
      Toggle Theme
    </button>
  );
}
```

---

## Creating New Components

### File Structure

```
src/components/{layer}/{ComponentName}/
├── ComponentName.tsx       # Implementation
├── index.ts                # Re-export
```

### Atomic Layer Guide

| Layer | What Goes Here | Examples |
|-------|---------------|----------|
| `ui/` | ShadCN primitives (auto-generated) | Button, Input, Dialog |
| `atoms/` | Custom design system primitives | Typography, Badge, Icon |
| `molecules/` | Compositions of atoms/ui | StatCard, SearchBar, FilterGroup |
| `organisms/` | Complex, feature-aware sections | Sidebar, TopNavbar, CrimeTable |
| `templates/` | Page shells, layout structures | DashboardLayout, ReportLayout |

### ShadCN Component Usage

**DO**: Use ShadCN components directly:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Button variant="outline" size="sm">Filter</Button>
```

**DON'T**: Create unnecessary wrappers around ShadCN primitives:

```tsx
// ❌ Don't do this
function CrimeLensButton(props) {
  return <Button {...props} />;
}
```

### Custom Components

For components that don't exist in ShadCN, use CVA for variant management:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const myComponentVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', primary: '...' },
    size: { sm: '...', md: '...', lg: '...' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});
```

---

## Component State Management

Every data-driven component must handle 4 states:

```tsx
import type { DataComponentProps } from '@/types/component-states';

function MyDataComponent({ data, isLoading, error, onRetry }: DataComponentProps<MyType>) {
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (isLoading) return <SkeletonState />;
  if (!data || data.length === 0) return <EmptyState />;
  return <DataRender data={data} />;
}
```

---

## RTK Query Services

### Adding a New Endpoint

Inject into the existing `baseApi`:

```tsx
// src/services/myFeatureApi.ts
import { baseApi } from './baseApi';

export const myFeatureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyData: builder.query<MyType[], void>({
      query: () => '/my-feature/data',
      providesTags: ['MyTag'],
    }),
  }),
});

export const { useGetMyDataQuery } = myFeatureApi;
```

### Adding a New Tag Type

Add to `tagTypes` array in `src/services/baseApi.ts`:

```tsx
tagTypes: ['Auth', 'Dashboard', 'Crime', 'MyNewTag'],
```

---

## Feature Module Structure

```
src/features/myFeature/
├── index.ts               # Public API (re-exports)
├── components/            # Feature-specific components
├── hooks/                 # Feature-specific hooks
└── utils/                 # Feature-specific utilities
```

---

## Import Conventions

Use the `@/` path alias for all imports:

```tsx
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { CHART_COLORS } from '@/styles/tokens';
```

---

## Accessibility Checklist (Per Component)

Before merging any component:

- [ ] Keyboard accessible (`Tab`, `Enter`, `Escape`)
- [ ] Focus ring visible
- [ ] Screen reader announces purpose
- [ ] Loading: `aria-busy="true"`
- [ ] Error: `role="alert"`
- [ ] Icons: `aria-hidden="true"` or `aria-label`
- [ ] Color is not the sole indicator
- [ ] Reduced motion respected
- [ ] Touch targets ≥ 44x44px

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `StatCard.tsx` |
| Hook | camelCase with `use` prefix | `useFilterState.ts` |
| Utility | camelCase | `formatCrimeData.ts` |
| Type file | camelCase | `component-states.ts` |
| CSS token | kebab-case with `--` prefix | `--risk-critical` |
| Feature folder | kebab-case | `src/features/risk/` |

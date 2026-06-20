# CrimeLens Data Visualization Standards

> Color, accessibility, and interaction rules for charts, maps, heatmaps, risk indicators, and network graphs.

---

## Categorical Palette

8-color colorblind-safe palette for categorical data (bar charts, pie charts, legends):

| Index | Token | Hue | Usage |
|-------|-------|-----|-------|
| 1 | `--chart-1` | Blue | Primary series |
| 2 | `--chart-2` | Green | Success/resolved |
| 3 | `--chart-3` | Amber | Warnings |
| 4 | `--chart-4` | Purple | Network clusters |
| 5 | `--chart-5` | Red | Danger/critical |
| 6 | `--chart-6` | Teal | Geographic markers |
| 7 | `--chart-7` | Pink | Supporting data |
| 8 | `--chart-8` | Orange | Tertiary data |

### Usage in Recharts

```tsx
import { CHART_COLORS, getChartColor } from '@/styles/tokens';

// Single color
<Bar fill={getChartColor(1)} />

// All colors as array
<Pie data={data} colors={CHART_COLORS} />
```

---

## Sequential Palette (Heatmaps)

5-stop sequential palette from low to high intensity:

| Index | Token | Intensity |
|-------|-------|-----------|
| 1 | `--heatmap-1` | Very low |
| 2 | `--heatmap-2` | Low |
| 3 | `--heatmap-3` | Medium |
| 4 | `--heatmap-4` | High |
| 5 | `--heatmap-5` | Very high |

### Usage in React-Leaflet

```tsx
import { HEATMAP_COLORS } from '@/styles/tokens';

// Pass to heatmap layer gradient
gradient={HEATMAP_COLORS.reduce((acc, color, i) => {
  acc[i / (HEATMAP_COLORS.length - 1)] = color;
  return acc;
}, {} as Record<number, string>)}
```

---

## Risk Color System

| Level | Token | Dark Value | Light Value |
|-------|-------|-----------|-------------|
| Low | `--risk-low` | Green | Dark green |
| Medium | `--risk-medium` | Amber | Dark amber |
| High | `--risk-high` | Orange | Dark orange |
| Critical | `--risk-critical` | Red | Dark red |

### Usage

```tsx
import { RISK_COLORS, type RiskLevel } from '@/styles/tokens';

function RiskIndicator({ level }: { level: RiskLevel }) {
  return (
    <Badge variant={`risk-${level}`} dot>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </Badge>
  );
}
```

---

## Chart Accessibility Rules

### Required for ALL charts:

1. **Never rely on color alone** — add patterns, labels, or shape markers
2. **Provide text alternatives** — `aria-label` on chart containers
3. **Include a data table fallback** — for screen readers
4. **Ensure 3:1 contrast** between adjacent chart segments
5. **Add tooltips** — show exact values on hover/focus
6. **Support keyboard** — navigate between data points with arrow keys

### Recommended patterns:

```
Series 1: Solid fill
Series 2: Diagonal stripes
Series 3: Dots
Series 4: Crosshatch
Series 5: Horizontal lines
```

---

## Map Visualization Rules

### Markers
- Use shape + color to distinguish marker types
- Minimum marker size: 24x24px (touchable)
- Include tooltip with location name and data

### Clustering
- Show aggregate count in cluster marker
- Use size to indicate cluster density
- Zoom to expand clusters

### Legend
- Always visible, positioned bottom-left
- Include all active data layers
- Toggleable layers for clarity

---

## Network Graph Rules

### Nodes
- Sized by connection count (minimum 24px diameter)
- Colored by type using chart palette
- Show label on hover/focus
- Keyboard navigable with arrow keys

### Edges
- Width indicates relationship strength
- Labeled on hover
- Directional arrows where applicable

### Clusters
- Distinct background shading
- Labeled with cluster name
- Collapsible to reduce visual noise

---

## Dashboard Metric Cards

### Standard Layout
```
┌──────────────────────────┐
│ LABEL              [icon]│
│                          │
│ 2,847                    │
│ ▲ +12.5% vs last month  │
└──────────────────────────┘
```

### Rules
- Numbers use tabular figures (`.font-data`)
- Trend arrows: ▲ up (danger for crime), ▼ down (success for crime)
- Percentage change uses 1 decimal place
- Card has all 4 states: loading, error, empty, data

import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Typography } from '@/components/atoms/Typography';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface MapLayerConfig {
  showHeatmap: boolean;
  showClusters: boolean;
  showPredictions: boolean;
  radius: number;
  minIntensity: number;
  timeRange: string;
}

export interface HotspotControlPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  config: MapLayerConfig;
  onConfigChange: (config: MapLayerConfig) => void;
  title?: string;
}

export function HotspotControlPanel({
  config,
  onConfigChange,
  title = "Map Controls",
  className,
  ...props
}: HotspotControlPanelProps) {
  const updateConfig = <K extends keyof MapLayerConfig>(key: K, val: MapLayerConfig[K]) => {
    onConfigChange({ ...config, [key]: val });
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-card border border-border rounded-lg shadow-sm p-4 w-full max-w-sm gap-4",
        className
      )}
      {...props}
    >
      <div>
        <Typography variant="heading-sm" className="font-semibold text-foreground">
          {title}
        </Typography>
        <Typography variant="caption" color="muted" className="mt-0.5 block">
          Toggle layers, thresholds, and analytical predictions.
        </Typography>
      </div>

      <Separator />

      {/* Layer Toggles */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Visual Overlays
        </span>
        
        {/* Heatmap Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="toggle-heatmap" className="text-xs font-semibold text-foreground cursor-pointer">
            Crime Density Heatmap
          </label>
          <Switch
            id="toggle-heatmap"
            checked={config.showHeatmap}
            onCheckedChange={(val) => updateConfig('showHeatmap', val)}
          />
        </div>

        {/* Clusters Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="toggle-clusters" className="text-xs font-semibold text-foreground cursor-pointer">
            Crime Clusters Boundaries
          </label>
          <Switch
            id="toggle-clusters"
            checked={config.showClusters}
            onCheckedChange={(val) => updateConfig('showClusters', val)}
          />
        </div>

        {/* Predictions Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="toggle-predictions" className="text-xs font-semibold text-foreground cursor-pointer">
            AI Hotspot Predictions
          </label>
          <Switch
            id="toggle-predictions"
            checked={config.showPredictions}
            onCheckedChange={(val) => updateConfig('showPredictions', val)}
          />
        </div>
      </div>

      <Separator />

      {/* Sliders */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Parameters
        </span>

        {/* Radius Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="radius-slider" className="font-semibold text-foreground">
              Hotspot Radius
            </label>
            <span className="font-data font-semibold text-muted-foreground">{config.radius}m</span>
          </div>
          <Slider
            id="radius-slider"
            min={50}
            max={500}
            step={25}
            value={[config.radius]}
            onValueChange={([val]) => updateConfig('radius', val)}
          />
        </div>

        {/* Min Intensity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="intensity-slider" className="font-semibold text-foreground">
              Min Intensity Threshold
            </label>
            <span className="font-data font-semibold text-muted-foreground">{config.minIntensity}%</span>
          </div>
          <Slider
            id="intensity-slider"
            min={0}
            max={100}
            step={5}
            value={[config.minIntensity]}
            onValueChange={([val]) => updateConfig('minIntensity', val)}
          />
        </div>
      </div>

      <Separator />

      {/* Range Selection */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="time-range" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Time Period
        </label>
        <Select
          value={config.timeRange}
          onValueChange={(val) => updateConfig('timeRange', val)}
        >
          <SelectTrigger id="time-range" className="w-full bg-card h-8">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Past 24 Hours</SelectItem>
            <SelectItem value="7d">Past 7 Days</SelectItem>
            <SelectItem value="30d">Past 30 Days</SelectItem>
            <SelectItem value="90d">Past 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

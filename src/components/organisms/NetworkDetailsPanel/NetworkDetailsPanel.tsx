import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, MapPin, ShieldAlert, Car, Phone, Sparkles, Calendar, Building } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import type { DetailedNode } from '@/features/network/data/mockNetworkData';

export interface EntityConnection {
  targetId: string;
  targetLabel: string;
  type: string;
  weight: number;
}

export interface NetworkDetailsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  entity?: DetailedNode;
  connections?: EntityConnection[];
  onClose?: () => void;
  title?: string;
}

const TYPE_ICONS = {
  suspect: User,
  crime: ShieldAlert,
  location: MapPin,
  vehicle: Car,
  phone: Phone,
  police_station: Building,
};

const RISK_BADGES = (score: number) => {
  if (score >= 80) return { label: 'Critical', variant: 'risk-critical' } as const;
  if (score >= 50) return { label: 'High', variant: 'risk-high' } as const;
  if (score >= 25) return { label: 'Medium', variant: 'risk-medium' } as const;
  return { label: 'Low', variant: 'risk-low' } as const;
};

export function NetworkDetailsPanel({
  entity,
  connections = [],
  onClose,
  title = "Entity Inspection",
  className,
  ...props
}: NetworkDetailsPanelProps) {
  if (!entity) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-border bg-card/45 min-h-[400px] text-center",
          className
        )}
        {...props}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Icon icon={Sparkles} size="sm" className="text-primary animate-pulse" />
        </div>
        <Typography variant="body-sm" color="muted">
          Select any entity node in the graph viewport to view dossier details, aliases, chronological activity, and AI-generated insights.
        </Typography>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[entity.type] || User;
  const riskInfo = RISK_BADGES(entity.riskScore);

  return (
    <div
      className={cn(
        "flex flex-col bg-card border border-border rounded-lg shadow-md p-4 w-full gap-5 max-h-[85vh] overflow-y-auto scrollbar-thin",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <Typography variant="heading-sm" className="font-semibold text-foreground">
          {title}
        </Typography>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            aria-label="Close details panel"
          >
            ✕
          </button>
        )}
      </div>

      <Separator />

      {/* Entity Profile Header */}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback className={cn(
            "bg-primary/10 text-primary",
            entity.type === 'suspect' && "bg-rose-500/10 text-rose-400",
            entity.type === 'crime' && "bg-amber-500/10 text-amber-400",
            entity.type === 'location' && "bg-blue-500/10 text-blue-400",
            entity.type === 'vehicle' && "bg-teal-500/10 text-teal-400",
            entity.type === 'phone' && "bg-indigo-500/10 text-indigo-400"
          )}>
            <Icon icon={TypeIcon} size="sm" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Typography variant="body-md" className="font-bold text-foreground truncate capitalize">
            {entity.label}
          </Typography>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {entity.type}
            </span>
            <span>•</span>
            <Badge variant={riskInfo.variant} size="sm" className="py-0 px-1.5 text-[10px]">
              {riskInfo.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Dossier Quick Metrics Summary (Requirement 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-muted/10 p-2.5 rounded-md border border-border/40">
        <div>
          <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[8px]">Active Districts</span>
          <strong className="text-foreground text-[10px] block truncate capitalize mt-0.5">
            {connections.filter(c => c.type === 'located_at').map(c => c.targetLabel).join(', ') || (entity.properties.activeArea as string) || (entity.properties.location as string) || (entity.properties.district as string) || 'Karnataka Division'}
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[8px]">Known Cases</span>
          <strong className="text-foreground text-[10px] block font-data mt-0.5">
            {connections.filter(c => c.type === 'involved_in').length} cases
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[8px]">Known Associates</span>
          <strong className="text-foreground text-[10px] block font-data mt-0.5">
            {connections.filter(c => c.type === 'associated_with').length} suspects
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[8px]">Connected Entities</span>
          <strong className="text-foreground text-[10px] block font-data mt-0.5">
            {connections.length} nodes
          </strong>
        </div>
      </div>

      {/* AI Investigation Insights Panel */}
      {entity.aiInsights && entity.aiInsights.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Icon icon={Sparkles} size="xs" className="animate-pulse" />
            <span>AI Analytical Dossier</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-3.5 leading-relaxed">
            {entity.aiInsights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Properties List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Intelligence Metadata
        </span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 bg-muted/20 p-2.5 border border-border/60 rounded-md">
          {entity.propertiesList?.map((prop, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground block truncate">{prop.label}</span>
              <span className="text-body-sm font-semibold text-foreground truncate block capitalize" title={prop.value}>
                {prop.value}
              </span>
            </div>
          )) || Object.entries(entity.properties || {}).map(([key, value], idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground block truncate capitalize">{key}</span>
              <span className="text-body-sm font-semibold text-foreground truncate block capitalize" title={String(value)}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      {entity.timeline && entity.timeline.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Activity Timeline Log
          </span>
          <div className="relative border-l border-border pl-3 space-y-3 pt-1">
            {entity.timeline.map((item, idx) => (
              <div key={idx} className="relative text-xs space-y-0.5">
                {/* Bullet dot */}
                <div className="absolute -left-[16.5px] top-1.5 size-2 rounded-full border border-border bg-card flex items-center justify-center">
                  <div className="size-1 rounded-full bg-primary" />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
                  <Icon icon={Calendar} size="xs" />
                  <span>{item.date}</span>
                </div>
                <div className="font-bold text-foreground">{item.event}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections List */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Icon icon={ShieldAlert} size="xs" className="text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Direct Network Ties ({connections.length})
          </span>
        </div>
        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
          {connections.length === 0 ? (
            <Typography variant="caption" color="muted">
              No registered connections.
            </Typography>
          ) : (
            connections.map((conn, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-sm border border-border/40 bg-card/60 text-xs hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-1 rounded-sm text-foreground",
                    conn.type === 'owns' && "bg-slate-500/10 text-slate-400",
                    conn.type === 'called' && "bg-blue-500/10 text-blue-400",
                    conn.type === 'involved_in' && "bg-rose-500/10 text-rose-400",
                    conn.type === 'located_at' && "bg-green-500/10 text-green-400",
                    conn.type === 'associated_with' && "bg-amber-500/10 text-amber-400"
                  )}>
                    {conn.type}
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[120px]" title={conn.targetLabel}>
                    {conn.targetLabel}
                  </span>
                </div>
                <span className="font-data font-semibold text-muted-foreground text-[10px]">
                  Strength: {conn.weight}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

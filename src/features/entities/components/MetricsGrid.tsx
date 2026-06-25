import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Users, Link2, MapPin } from 'lucide-react';

interface MetricsGridProps {
  crimeFrequency?: number | string;
  associateCount?: number | string;
  networkStrength?: number | string;
  districtSpread?: number | string;
  onCrimeFrequencyClick?: () => void;
  onDistrictSpreadClick?: () => void;
}

export function MetricsGrid({
  crimeFrequency,
  associateCount,
  networkStrength,
  districtSpread,
  onCrimeFrequencyClick,
  onDistrictSpreadClick,
}: MetricsGridProps) {
  const hasNetworkStrength = networkStrength !== undefined && networkStrength !== null && networkStrength !== '';
  const hasDistrictSpread = districtSpread !== undefined && districtSpread !== null && districtSpread !== '';

  const metrics = [
    {
      title: 'Crime Frequency',
      value: crimeFrequency !== undefined ? crimeFrequency : '—',
      description: `${crimeFrequency || 0} active incidents`,
      icon: FileText,
      color: 'text-primary bg-primary/10 border border-primary/20',
      onClick: onCrimeFrequencyClick,
      clickable: !!onCrimeFrequencyClick,
    },
    {
      title: 'Associate Count',
      value: associateCount !== undefined ? associateCount : '—',
      description: `${associateCount || 0} known associates`,
      icon: Users,
      color: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
      onClick: undefined,
      clickable: false,
    },
    {
      title: 'Network Strength',
      value: hasNetworkStrength ? networkStrength : 'Not Available',
      description: hasNetworkStrength ? `${networkStrength}/100 density` : 'Metric coming soon',
      icon: Link2,
      color: hasNetworkStrength
        ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
        : 'text-muted-foreground bg-muted/10 border border-muted-foreground/10',
      onClick: undefined,
      clickable: false,
    },
    {
      title: 'District Spread',
      value: hasDistrictSpread ? districtSpread : 'Not Available',
      description: hasDistrictSpread ? 'Districts operated in' : 'Metric coming soon',
      icon: MapPin,
      color: hasDistrictSpread
        ? 'text-primary bg-primary/10 border border-primary/20'
        : 'text-muted-foreground bg-muted/10 border border-muted-foreground/10',
      onClick: onDistrictSpreadClick,
      clickable: hasDistrictSpread && !!onDistrictSpreadClick,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const IconComponent = m.icon;
        return (
          <Card
            key={m.title}
            onClick={m.onClick}
            className={`bg-card/45 border-border/80 backdrop-blur-sm p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm transition-all duration-150 ${
              m.clickable
                ? 'cursor-pointer hover:border-primary/40 hover:shadow-md hover:bg-card/60 group'
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground leading-none">
                {m.title}
              </span>
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${m.color} shrink-0 ${m.clickable ? 'group-hover:scale-110 transition-transform' : ''}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black font-data text-foreground">
                {m.value}
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold block mt-1">
                {m.description}
              </span>
            </div>
            {m.clickable && (
              <span className="absolute bottom-2 right-2.5 text-[9px] uppercase font-bold tracking-wider text-primary/50 group-hover:text-primary transition-colors">
                View details →
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

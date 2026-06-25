import * as React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface RiskScoreCardProps {
  riskScore: number;
  threatLevel: string;
  onClick?: () => void;
}

export function RiskScoreCard({ riskScore, threatLevel, onClick }: RiskScoreCardProps) {
  const getBadgeVariant = (level: string) => {
    const uppercaseLevel = level?.toUpperCase();
    if (uppercaseLevel === 'CRITICAL') return 'risk-critical';
    if (uppercaseLevel === 'HIGH') return 'risk-high';
    if (uppercaseLevel === 'MEDIUM') return 'warning';
    return 'success';
  };

  return (
    <Card className="bg-card/45 border-border/80 backdrop-blur-sm shadow-md overflow-hidden relative min-h-[140px] flex flex-col justify-between p-5">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <ShieldAlert className="h-24 w-24 text-red-500" />
      </div>

      {onClick && (
        <div className="absolute top-3 right-3 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onClick}
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">View Breakdown</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              View Threat Breakdown
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div>
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
          Threat Assessment
        </span>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-black font-data tracking-tight text-red-500">
            {riskScore}
          </span>
          <span className="text-sm font-semibold text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase">Threat Level</span>
        </div>
        <Badge
          variant={getBadgeVariant(threatLevel)}
          size="md"
          className="font-extrabold tracking-wider uppercase"
        >
          {threatLevel || 'LOW'}
        </Badge>
      </div>
    </Card>
  );
}

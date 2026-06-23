import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

interface RiskFactor {
  ROWID: string;
  profile_id: string;
  factor_name: string;
  factor_score: number;
  factor_description: string;
}

interface RiskFactorsCardProps {
  riskFactors: RiskFactor[];
}

export function RiskFactorsCard({ riskFactors }: RiskFactorsCardProps) {
  return (
    <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
      <CardHeader className="p-4 border-b border-border bg-card/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Risk Factors Breakdown
        </CardTitle>
        <CardDescription className="text-[10px]">
          Explainable model components explaining final threat level evaluation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {(!riskFactors || riskFactors.length === 0) ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            No risk factors found or recorded for this profile.
          </p>
        ) : (
          <div className="space-y-3">
            {riskFactors.map((factor) => (
              <div
                key={factor.ROWID || factor.factor_name}
                className="p-3.5 rounded-lg border border-border bg-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/20 transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground block">
                    {factor.factor_name}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed block max-w-xl">
                    {factor.factor_description}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-3 py-1 rounded text-xs font-data">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>+{factor.factor_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

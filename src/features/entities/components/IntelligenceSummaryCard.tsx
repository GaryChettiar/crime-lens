import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface IntelligenceSummaryCardProps {
  summary: string;
}

export function IntelligenceSummaryCard({ summary }: IntelligenceSummaryCardProps) {
  return (
    <Card className="bg-red-500/5 border border-red-500/20 rounded-lg overflow-hidden shadow-md">
      <CardContent className="p-4 flex gap-3.5 items-start">
        <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mt-0.5 animate-pulse">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Intelligence Summary</h4>
          <p className="text-xs text-foreground/90 leading-relaxed font-medium">
            {summary || 'No intelligence summary generated yet. Refresh profile to build compilation.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

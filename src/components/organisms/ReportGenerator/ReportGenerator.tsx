import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportForm, type ReportFormValues } from './ReportForm';
import { ReportHistory, type ReportLog } from './ReportHistory';
import { Typography } from '@/components/atoms/Typography';
import { cn } from '@/lib/utils';

export interface ReportGeneratorProps extends React.HTMLAttributes<HTMLDivElement> {
  history?: ReportLog[];
  onGenerateReport: (values: ReportFormValues) => void;
  onDownloadReport: (id: string) => void;
  onDeleteReport?: (id: string) => void;
  isGenerating?: boolean;
}

export function ReportGenerator({
  history = [],
  onGenerateReport,
  onDownloadReport,
  onDeleteReport,
  isGenerating = false,
  className,
  ...props
}: ReportGeneratorProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-card border border-border rounded-lg shadow-sm p-4 w-full max-w-md gap-4",
        className
      )}
      {...props}
    >
      <div>
        <Typography variant="heading-sm" className="font-semibold text-foreground">
          Intelligence Report Compiler
        </Typography>
        <Typography variant="caption" color="muted" className="mt-0.5 block">
          Generate, export, or audit structured case documentation.
        </Typography>
      </div>

      <Tabs defaultValue="compile" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="compile">Compile Report</TabsTrigger>
          <TabsTrigger value="history">
            Archives ({history.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compile" className="pt-3">
          <ReportForm onSubmit={onGenerateReport} isGenerating={isGenerating} />
        </TabsContent>
        <TabsContent value="history" className="pt-3">
          <ReportHistory
            reports={history}
            onDownload={onDownloadReport}
            onDelete={onDeleteReport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

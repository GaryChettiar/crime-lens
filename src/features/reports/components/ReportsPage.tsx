import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/atoms/Icon';
import { FileText, FilePlus } from 'lucide-react';

export function ReportsPage() {
  return (
    <DashboardLayout title="Reports Compiler">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="pb-4 border-b border-border">
          <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
            Intelligence Reports Compiler
          </Typography>
          <Typography variant="body-sm" color="muted" className="mt-1">
            Build, catalog, and archive structured tactical case reports for internal and legal use.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={FilePlus} size="sm" className="text-primary" />
                Compile Report
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border border-dashed rounded-md bg-muted/10 m-4 mt-0 text-muted-foreground text-xs">
              Report Generator Form Placeholder (PDF Compiler ready)
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={FileText} size="sm" className="text-warning" />
                Compiled Archives
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border border-dashed rounded-md bg-muted/10 m-4 mt-0 text-muted-foreground text-xs">
              Archives Log Placeholder
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

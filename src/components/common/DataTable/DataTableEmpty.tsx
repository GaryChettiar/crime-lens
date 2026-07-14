import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';

interface DataTableEmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  colSpan?: number;
}

/**
 * DataTableEmpty — "No records found" state rendered as a table row.
 * Drop inside <tbody> to keep valid HTML table structure.
 */
export function DataTableEmpty({
  icon: Icon = InboxIcon,
  title = 'No Records Found',
  description = 'No data matched your current filters.',
  colSpan = 8,
}: DataTableEmptyProps) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">{description}</p>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

/**
 * DataTableSkeleton — Animated shimmer skeleton for any paginated table.
 * Renders inline inside the existing table chrome so the layout doesn't jump.
 */
export function DataTableSkeleton({ columns = 5, rows = 8, className }: DataTableSkeletonProps) {
  return (
    <tbody className={cn(className)}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border/40">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div
                className="h-3.5 rounded-md bg-muted animate-pulse"
                style={{
                  width: `${40 + Math.random() * 50}%`,
                  animationDelay: `${(rowIdx * columns + colIdx) * 40}ms`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

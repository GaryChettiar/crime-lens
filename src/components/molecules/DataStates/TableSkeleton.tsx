import { cn } from '@/lib/utils';

/**
 * TableSkeleton — Animated skeleton placeholder for data tables.
 * Shows a shimmer effect while data is loading.
 */
export function TableSkeleton({
  columns = 5,
  rows = 6,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('admin-card overflow-hidden', className)}>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx}>
                    <div
                      className="h-3.5 rounded bg-muted animate-pulse"
                      style={{
                        width: `${50 + Math.random() * 40}%`,
                        animationDelay: `${(rowIdx * columns + colIdx) * 50}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

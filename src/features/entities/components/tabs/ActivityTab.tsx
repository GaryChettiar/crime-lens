import * as React from 'react';
import { useGetCrimeActivityQuery } from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { ClipboardList, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ActivityTabProps {
  crimeId: string;
}

export function ActivityTab({ crimeId }: ActivityTabProps) {
  const { data: activity, isLoading, isError, refetch } = useGetCrimeActivityQuery(crimeId);
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!activity) return [];
    const q = search.toLowerCase();
    return [...activity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter(
        (a) =>
          !q ||
          a.user.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.module.toLowerCase().includes(q) ||
          (a.details ?? '').toLowerCase().includes(q)
      );
  }, [activity, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search activity log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground">Read-only audit log</span>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => { refetch(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No activity recorded"
          description={search ? 'No activity matches your search.' : 'No activity has been logged for this crime incident yet.'}
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="text-[10px] font-data text-muted-foreground whitespace-nowrap">
                        {(() => {
                          try {
                            const d = new Date(log.timestamp);
                            return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
                          } catch {
                            return log.timestamp;
                          }
                        })()}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-foreground">{log.user}</span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{log.action}</span>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border/50">
                        {log.module}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-64">
                        {log.details || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">{filtered.length} entries</span>
          </div>
        </div>
      )}
    </div>
  );
}

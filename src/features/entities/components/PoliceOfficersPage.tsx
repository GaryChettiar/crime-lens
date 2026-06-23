import * as React from 'react';
import { User, Award, Landmark, Mail, Phone, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { useGetAllPoliceOfficersQuery } from '@/services/policeOfficersApi';
import { useGetRanksQuery } from '@/services/policeRanksApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetAllUsersQuery } from '@/services/usersApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';

export function PoliceOfficersPage() {
  const { data: ranks } = useGetRanksQuery();
  const { data: stations } = useGetStationsQuery();
  const { data: usersData } = useGetAllUsersQuery({ limit: 1000 });

  const [selectedRankFilter, setSelectedRankFilter] = React.useState('');
  const [selectedStationFilter, setSelectedStationFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: officers, isLoading, isError, refetch } = useGetAllPoliceOfficersQuery();

  const mappedOfficers = React.useMemo(() => {
    if (!officers) return [];
    return officers.map((o) => {
      const matchingUser = usersData?.users?.find((u) => u.id === o.userId);
      const matchingRank = ranks?.find((r) => r.id === o.rankId);
      const matchingStation = stations?.find((s) => s.id === o.stationId);
      return {
        ...o,
        name: matchingUser?.userInfo?.name || 'Unknown Officer',
        email: matchingUser?.userInfo?.email || '—',
        phone: o.phone || matchingUser?.userInfo?.phone || '—',
        rankName: matchingRank?.name || 'No Rank',
        stationName: matchingStation?.name || 'Unassigned',
      };
    });
  }, [officers, usersData, ranks, stations]);

  const filteredOfficers = React.useMemo(() => {
    return mappedOfficers.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.badgeNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.stationName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRank = !selectedRankFilter || o.rankId === selectedRankFilter;
      const matchStation = !selectedStationFilter || o.stationId === selectedStationFilter;

      return matchSearch && matchRank && matchStation;
    });
  }, [mappedOfficers, searchQuery, selectedRankFilter, selectedStationFilter]);

  return (
    <DashboardLayout title="Police Officers Directory">
      <div className="space-y-5 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Police Officers</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Directory of active duty officers, ranks, and station assignments.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search name, badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="admin-input"
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
          >
            <option value="">All Ranks</option>
            {ranks?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            className="admin-input"
            value={selectedStationFilter}
            onChange={(e) => setSelectedStationFilter(e.target.value)}
          >
            <option value="">All Stations</option>
            {stations?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {isLoading && <TableSkeleton columns={4} rows={6} />}
        {isError && <ErrorState title="Failed to load officers" onRetry={refetch} />}
        {!isLoading && !isError && filteredOfficers.length === 0 && (
          <EmptyState
            icon={User}
            title="No officers found"
            description="No active duty officers matched your search parameters."
          />
        )}
        {!isLoading && !isError && filteredOfficers.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Officer Details</th>
                    <th>Badge / Rank</th>
                    <th>Station Assignment</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOfficers.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/15 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block">{o.name}</span>
                            <span className="text-[11px] text-muted-foreground">{o.status || 'Active'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                            <Award className="h-3.5 w-3.5 text-slate-400" />
                            {o.rankName}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">Badge: {o.badgeNumber || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Landmark className="h-3.5 w-3.5 text-slate-400" />
                          {o.stationName}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs space-y-0.5">
                          {o.email !== '—' && (
                            <div className="flex items-center gap-1 text-muted-foreground flex-wrap">
                              <Mail className="h-3 w-3" /> {o.email}
                            </div>
                          )}
                          {o.phone !== '—' && (
                            <div className="flex items-center gap-1 text-muted-foreground flex-wrap">
                              <Phone className="h-3 w-3" /> {o.phone}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

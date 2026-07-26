import * as React from 'react';
import { User, Award, Landmark, Mail, Phone, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { useAnalyticsFilters } from '@/hooks/useAnalyticsFilters';
import usePermissions from '@/hooks/usePermissions';
import { useGetAllPoliceOfficersQuery } from '@/services/policeOfficersApi';
import { useGetRanksQuery } from '@/services/policeRanksApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import ReactFlow, { ReactFlowProvider, Controls, Background } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function PoliceOfficersPage() {
  const { stationId: contextStationId } = useAnalyticsFilters();

  const { permissions, hasPermission, currentUser } = usePermissions();
  const canViewMap = hasPermission('view_map');
  const canViewStateMap = hasPermission('view_state_map');

  const hasLockedStationFilter = Boolean(contextStationId && !canViewMap);

  const { data: ranks } = useGetRanksQuery();
  const { data: stations } = useGetStationsQuery();
  const { data: districts } = useGetDistrictsQuery();

  const [viewMode, setViewMode] = React.useState<'table' | 'tree'>('table');
  const [selectedRankFilter, setSelectedRankFilter] = React.useState('');
  const [selectedStationFilter, setSelectedStationFilter] = React.useState('');

  React.useEffect(() => {
    if (contextStationId && !canViewMap) {
      setSelectedStationFilter(contextStationId);
    }
  }, [contextStationId, canViewMap]);

  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: officers, isLoading, isError, refetch } = useGetAllPoliceOfficersQuery();



  const stationById = React.useMemo(
    () => new Map(stations?.map((st) => [st.id, st]) ?? []),
    [stations],
  );

  const districtById = React.useMemo(
    () => new Map(districts?.map((d) => [d.id, d]) ?? []),
    [districts],
  );

  const mappedOfficers = React.useMemo(() => {
  if (!officers) return [];
  return officers.map((o) => {
    const matchingRank = ranks?.find((r) => r.id === o.rankId);
    const matchingStation = stations?.find((s) => s.id === o.stationId);
    return {
      ...o,
      name: o.name || 'Unknown Officer',
      phone: o.phone || o.contactNumber || '—', // adjust to whatever your API transform names it
      rankName: matchingRank?.name || 'No Rank',
      stationName: matchingStation?.name || 'Unassigned',
    };
  });
}, [officers, ranks, stations]);
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

  const rankOrder = React.useMemo(
    () => [...(ranks ?? [])].sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)),
    [ranks],
  );

  const treeData = React.useMemo(() => {
    if (!filteredOfficers.length) return [];

    const buildOfficerItem = (officer: any) => ({
      id: officer.id,
      label: officer.name,
      subLabel: officer.rankName,
      badge: officer.badgeNumber,
      phone: officer.phone,
    });

    const rankGroups = (officers: any[]) => {
      const groups = new Map<string, { rankName: string; officers: any[] }>();
      officers.forEach((officer) => {
        const rankId = officer.rankId || 'unknown';
        const rankName = officer.rankName || 'Unranked';
        const group = groups.get(rankId);
        if (group) {
          group.officers.push(buildOfficerItem(officer));
        } else {
          groups.set(rankId, { rankName, officers: [buildOfficerItem(officer)] });
        }
      });
      return Array.from(groups.values()).sort((a, b) => {
        const aRank = rankOrder.find((r) => r.name === a.rankName)?.level ?? Number.MAX_SAFE_INTEGER;
        const bRank = rankOrder.find((r) => r.name === b.rankName)?.level ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank || a.rankName.localeCompare(b.rankName);
      });
    };

    if (!canViewMap) {
      const stationMap = new Map<string, { id: string; name: string; officers: any[] }>();
      filteredOfficers.forEach((officer) => {
        const station = stationById.get(officer.stationId ?? '') ?? {
          id: officer.stationId ?? 'unknown',
          name: officer.stationName ?? 'Unassigned',
        };
        const stationEntry = stationMap.get(station.id) ?? { id: station.id, name: station.name, officers: [] };
        stationEntry.officers.push(officer);
        stationMap.set(station.id, stationEntry);
      });
      return Array.from(stationMap.values()).map((station) => ({
        id: station.id,
        name: station.name,
        ranks: rankGroups(station.officers),
      }));
    }

    const districtMap = new Map<string, {
      id: string;
      name: string;
      state: string;
      stations: Map<string, { id: string; name: string; officers: any[] }>;
    }>();
    filteredOfficers.forEach((officer) => {
      const station = stationById.get(officer.stationId ?? '') ?? {
        id: officer.stationId ?? 'unknown',
        name: officer.stationName ?? 'Unassigned',
        districtId: officer.districtId,
      };
      const districtId = station.districtId || officer.districtId || 'unknown';
      const district = districtById.get(districtId) ?? {
        id: districtId,
        name: districtId === 'unknown' ? 'Unassigned District' : 'Unknown District',
        state: 'Unknown State',
      };
      let districtEntry = districtMap.get(district.id);
      if (!districtEntry) {
        districtEntry = {
          id: district.id,
          name: district.name,
          state: district.state || 'Unknown State',
          stations: new Map(),
        };
        districtMap.set(district.id, districtEntry);
      }
      const stationEntry = districtEntry.stations.get(station.id) ?? { id: station.id, name: station.name, officers: [] };
      stationEntry.officers.push(officer);
      districtEntry.stations.set(station.id, stationEntry);
    });

    const districtList = Array.from(districtMap.values()).map((district) => ({
      id: district.id,
      name: district.name,
      state: district.state,
      stations: Array.from(district.stations.values()).map((station) => ({
        id: station.id,
        name: station.name,
        ranks: rankGroups(station.officers),
      })),
    }));

    if (!canViewStateMap) {
      const currentDistrictId = currentUser?.districtId;
      if (currentDistrictId) {
        return districtList.filter((district) => district.id === currentDistrictId);
      }
      return districtList;
    }

    const stateMap = new Map<string, any>();
    districtList.forEach((district) => {
      const stateEntry = stateMap.get(district.state) ?? { state: district.state, districts: [] };
      stateEntry.districts.push(district);
      stateMap.set(district.state, stateEntry);
    });

    return Array.from(stateMap.values());
  }, [filteredOfficers, canViewMap, canViewStateMap, districtById, rankOrder, stationById]);

  const flowData = React.useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const stationGap = 600;
    const districtGap = 520;
    const stateGap = 800;
    const officerGap = 220;
    const levelHeight = 140;
    const rankDepthGap = 120;

    if (!treeData.length) {
      return { nodes, edges };
    }

    const createNode = (id: string, x: number, y: number, label: React.ReactNode) => {
      nodes.push({
        id,
        data: { label },
        position: { x, y },
        type: 'default',
      });
    };

    const createEdge = (source: string, target: string) => {
      edges.push({
        id: `e-${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: false,
      });
    };

    if (!canViewMap) {
      treeData.forEach((station, stationIndex) => {
        const stationX = stationIndex * stationGap;
        const stationId = `station-${station.id}`;
        createNode(
          stationId,
          stationX,
          0,
          <div className="space-y-1 text-left">
            <div className="text-sm font-semibold">Station</div>
            <div className="text-xs text-muted-foreground">{station.name}</div>
          </div>,
        );

        station.ranks.forEach((rank: any, rankIndex: number) => {
          const rankY = levelHeight + rankIndex * rankDepthGap;
          rank.officers.forEach((officer: any, officerIndex: number) => {
            const officerId = `officer-${officer.id}`;
            createNode(
              officerId,
              stationX + officerIndex * officerGap - ((rank.officers.length - 1) * officerGap) / 2,
              rankY,
              <div className="space-y-1 text-left">
                <div className="font-semibold">{officer.label}</div>
                <div className="text-[11px] text-muted-foreground">{rank.rankName}</div>
                <div className="text-[11px] text-muted-foreground">Badge: {officer.badge || '—'}</div>
              </div>,
            );
            createEdge(stationId, officerId);
          });
        });
      });

      return { nodes, edges };
    }

    if (!canViewStateMap) {
      treeData.forEach((district, districtIndex) => {
        const districtX = districtIndex * districtGap;
        const districtId = `district-${district.id}`;
        createNode(
          districtId,
          districtX,
          0,
          <div className="space-y-1 text-left">
            <div className="text-sm font-semibold">District</div>
            <div className="text-xs text-muted-foreground">{district.name}</div>
          </div>,
        );

        district.stations.forEach((station: any, stationIndex: number) => {
          const stationX = districtX + stationIndex * stationGap - ((district.stations.length - 1) * stationGap) / 2;
          const stationId = `station-${station.id}`;
          createNode(
            stationId,
            stationX,
            levelHeight,
            <div className="space-y-1 text-left">
              <div className="text-sm font-semibold">Station</div>
              <div className="text-xs text-muted-foreground">{station.name}</div>
            </div>,
          );
          createEdge(districtId, stationId);

          station.ranks.forEach((rank: any, rankIndex: number) => {
            const rankY = levelHeight * 2 + rankIndex * rankDepthGap;
            rank.officers.forEach((officer: any, officerIndex: number) => {
              const officerId = `officer-${officer.id}`;
              createNode(
                officerId,
                stationX + officerIndex * officerGap - ((rank.officers.length - 1) * officerGap) / 2,
                rankY,
                <div className="space-y-1 text-left">
                  <div className="font-semibold">{officer.label}</div>
                  <div className="text-[11px] text-muted-foreground">{rank.rankName}</div>
                  <div className="text-[11px] text-muted-foreground">Badge: {officer.badge || '—'}</div>
                </div>,
              );
              createEdge(stationId, officerId);
            });
          });
        });
      });

      return { nodes, edges };
    }

    treeData.forEach((state, stateIndex) => {
      const stateX = stateIndex * stateGap;
      const stateId = `state-${state.state}`;
      createNode(
        stateId,
        stateX,
        0,
        <div className="space-y-1 text-left">
          <div className="text-sm font-semibold">State</div>
          <div className="text-xs text-muted-foreground">{state.state}</div>
        </div>,
      );

      state.districts.forEach((district: any, districtIndex: number) => {
        const districtX = stateX + districtIndex * districtGap - ((state.districts.length - 1) * districtGap) / 2;
        const districtId = `district-${district.id}`;
        createNode(
          districtId,
          districtX,
          levelHeight,
          <div className="space-y-1 text-left">
            <div className="text-sm font-semibold">District</div>
            <div className="text-xs text-muted-foreground">{district.name}</div>
          </div>,
        );
        createEdge(stateId, districtId);

        district.stations.forEach((station: any, stationIndex: number) => {
          const stationX = districtX + stationIndex * stationGap - ((district.stations.length - 1) * stationGap) / 2;
          const stationId = `station-${station.id}`;
          createNode(
            stationId,
            stationX,
            levelHeight * 2,
            <div className="space-y-1 text-left">
              <div className="text-sm font-semibold">Station</div>
              <div className="text-xs text-muted-foreground">{station.name}</div>
            </div>,
          );
          createEdge(districtId, stationId);

          station.ranks.forEach((rank: any, rankIndex: number) => {
            const rankY = levelHeight * 3 + rankIndex * rankDepthGap;
            rank.officers.forEach((officer: any, officerIndex: number) => {
              const officerId = `officer-${officer.id}`;
              createNode(
                officerId,
                stationX + officerIndex * officerGap - ((rank.officers.length - 1) * officerGap) / 2,
                rankY,
                <div className="space-y-1 text-left">
                  <div className="font-semibold">{officer.label}</div>
                  <div className="text-[11px] text-muted-foreground">{rank.rankName}</div>
                  <div className="text-[11px] text-muted-foreground">Badge: {officer.badge || '—'}</div>
                </div>,
              );
              createEdge(stationId, officerId);
            });
          });
        });
      });
    });

    return { nodes, edges };
  }, [treeData, canViewMap, canViewStateMap]);

  const renderTree = () => {
    if (!treeData.length) {
      return (
        <EmptyState
          icon={User}
          title="No officers found"
          description="No active duty officers matched your search parameters."
        />
      );
    }

    return (
      <ReactFlowProvider>
        <div className="h-[680px] w-full rounded-xl border border-border/70 bg-card">
          <ReactFlow
            nodes={flowData.nodes}
            edges={flowData.edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesConnectable={false}
            nodesDraggable={false}
            selectNodesOnDrag={false}
            panOnScroll
            zoomOnScroll
            zoomOnPinch
            panOnDrag
          >
            <Controls />
            <Background gap={20} color="#555" />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    );
  };

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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'secondary' : 'outline'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'tree' ? 'secondary' : 'outline'}
              onClick={() => setViewMode('tree')}
            >
              Tree
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className={`grid grid-cols-1 gap-3 ${
            hasLockedStationFilter ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
          }`}
        >
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
          {!hasLockedStationFilter && (
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
          )}
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
          <div className="space-y-4">
            {viewMode === 'table' ? (
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
            ) : (
              <div className="admin-card p-4">{renderTree()}</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

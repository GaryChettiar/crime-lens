import * as React from 'react';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { useAnalyticsFilters } from '@/hooks/useAnalyticsFilters';
import { useGetAllCriminalsQuery } from '@/services/criminalsApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { CriminalsTable } from './CriminalsTable';
import { ErrorState } from '@/components/molecules/DataStates';

export function CriminalsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { districtId: contextDistrictId, stationId: contextStationId } =
    useAnalyticsFilters();

  const criminalQueryParams = React.useMemo(() => {
    const params: { districtId?: string; stationId?: string } = {};
    if (contextDistrictId) params.districtId = contextDistrictId;
    if (contextStationId) params.stationId = contextStationId;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [contextDistrictId, contextStationId]);

  const { data: criminals, isLoading, isError, refetch } =
    useGetAllCriminalsQuery(criminalQueryParams);
  const { data: districts } = useGetDistrictsQuery();

  return (
    <DashboardLayout title="Criminals Registry">
      <div className="space-y-5 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Criminals Directory</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Centralized intelligence views and profile records of all mapped criminal entities.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search criminals by number, name, nationality, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState title="Failed to load criminal records" onRetry={refetch} />
        ) : (
          <CriminalsTable
            criminals={criminals || []}
            districts={districts || []}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

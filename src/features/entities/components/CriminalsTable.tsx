import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin } from 'lucide-react';
import { TableSkeleton, EmptyState } from '@/components/molecules/DataStates';
import { Badge } from '@/components/atoms/Badge';
import {type CriminalResponse } from '@/services/criminalsApi';

interface CriminalsTableProps {
  criminals: CriminalResponse[];
  districts: any[];
  isLoading: boolean;
  searchQuery: string;
}

export function CriminalsTable({ criminals, districts, isLoading, searchQuery }: CriminalsTableProps) {
  const navigate = useNavigate();

  const getDistrictName = (districtId?: string) => {
    if (!districtId) return 'Unassigned';
    const district = districts?.find((d: any) => d.id === districtId);
    return district?.name || 'Unknown District';
  };

  const filteredCriminals = React.useMemo(() => {
    if (!criminals) return [];
    return criminals.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.criminalNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nationality || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDistrictName(c.districtId).toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [criminals, searchQuery, districts]);

  if (isLoading) {
    return <TableSkeleton columns={6} rows={8} />;
  }

  if (filteredCriminals.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="No Criminals Found"
        description="No criminal profiles match the search criteria."
      />
    );
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Criminal Number</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Nationality</th>
              <th>District</th>
            </tr>
          </thead>
          <tbody>
            {filteredCriminals.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => navigate(`/entities/criminals/${c.id}`)}
              >
                <td className="font-mono font-bold text-xs text-primary">
                  {c.criminalNumber || c.id || '—'}
                </td>
                <td className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{c.name}</span>
                  </div>
                </td>
                <td>{c.gender || '—'}</td>
                <td>
                  <Badge
                    variant={
                      c.status?.toUpperCase() === 'ACTIVE' || c.status?.toUpperCase() === 'WANTED'
                        ? 'danger'
                        : c.status?.toUpperCase() === 'IN_CUSTODY'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                    className="font-bold tracking-wide"
                  >
                    {c.status || 'ACTIVE'}
                  </Badge>
                </td>
                <td>{c.nationality || '—'}</td>
                <td>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{getDistrictName(c.districtId)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

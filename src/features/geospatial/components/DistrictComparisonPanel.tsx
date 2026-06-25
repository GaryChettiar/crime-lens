import { useState } from 'react';
import { useGetDistrictComparisonQuery } from '@/services/districtsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { DISTRICT_CENTERS } from '../data/mockGeospatialData';
import { BarChart3, TrendingUp, ShieldAlert, GitCompare, Landmark } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';

const DISTRICT_LIST = Object.keys(DISTRICT_CENTERS).sort();

export function DistrictComparisonPanel() {
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([
    'Bangalore',
    'Mysore',
  ]);

  const { data: comparisonData, isLoading } = useGetDistrictComparisonQuery(
    selectedDistricts
  );

  const toggleDistrict = (district: string) => {
    setSelectedDistricts((prev) => {
      if (prev.includes(district)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter((d) => d !== district);
      } else {
        if (prev.length >= 4) return prev; // Limit to 4 for clean layout
        return [...prev, district];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedDistricts(['Bangalore']);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Selection Column (Left) */}
      <Card className="xl:col-span-3 border-border bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-body-sm font-bold text-foreground">Select Districts</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-[10px] h-7 px-2 font-semibold text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          </div>
          <Typography variant="caption" color="muted">
            Select 1 to 4 districts to compare side-by-side.
          </Typography>
        </CardHeader>
        <CardContent className="p-3.5 space-y-1 max-h-[500px] overflow-y-auto">
          {DISTRICT_LIST.map((dist) => {
            const isChecked = selectedDistricts.includes(dist);
            const isDisabled = !isChecked && selectedDistricts.length >= 4;

            return (
              <div
                key={dist}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors ${
                  isChecked
                    ? 'bg-primary/10 text-foreground font-semibold'
                    : 'hover:bg-accent/40 text-muted-foreground'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isDisabled && toggleDistrict(dist)}
              >
                <Checkbox
                  id={`comp-check-${dist}`}
                  checked={isChecked}
                  disabled={isDisabled}
                  aria-label={`Select ${dist} for comparison`}
                  onCheckedChange={() => {}} // Handle on click div
                />
                <label
                  htmlFor={`comp-check-${dist}`}
                  className="text-xs pointer-events-none capitalize cursor-pointer select-none"
                >
                  {dist}
                </label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Comparison Grid (Right) */}
      <div className="xl:col-span-9 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border bg-card overflow-hidden hover:border-primary/30 transition-all p-4 space-y-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded-md w-2/3" />
                  <div className="h-3 bg-muted rounded-md w-1/3" />
                </div>
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center border-b border-border/40 pb-2">
                      <div className="h-3 bg-muted rounded-md w-1/3" />
                      <div className="h-3 bg-muted rounded-md w-1/5" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : !comparisonData || comparisonData.length === 0 ? (
          <div className="h-64 flex items-center justify-center border rounded-md border-dashed border-border bg-card">
            <Typography variant="body-sm" color="muted">
              Select at least one district from the checklist panel.
            </Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {comparisonData.map((data) => {
              const isGrowthPositive = data.growthRate > 0;
              const isHighRisk = data.riskIndex >= 70;

              return (
                <Card key={data.district} className="border-border bg-card overflow-hidden hover:border-primary/30 transition-all">
                  {/* Header banner */}
                  <div className="h-1 bg-primary" style={{ backgroundColor: isHighRisk ? '#EF4444' : '#3B82F6' }} />
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-body-lg font-bold text-foreground capitalize flex items-center gap-1.5">
                      <Icon icon={GitCompare} size="xs" className="text-muted-foreground" />
                      {data.district}
                    </CardTitle>
                    <Typography variant="caption" color="muted">
                      Jurisdictional Stats
                    </Typography>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    {/* Crime Count */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon icon={BarChart3} size="xs" />
                        <span>Crimes (30d)</span>
                      </div>
                      <span className="font-data font-bold text-body-sm text-foreground">
                        {data.crimeCount}
                      </span>
                    </div>

                    {/* Growth MoM */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon icon={TrendingUp} size="xs" />
                        <span>MoM Growth</span>
                      </div>
                      <span
                        className={`font-data font-bold text-xs ${
                          isGrowthPositive ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {isGrowthPositive ? '+' : ''}
                        {data.growthRate}%
                      </span>
                    </div>

                    {/* Risk Index */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon icon={ShieldAlert} size="xs" />
                        <span>Risk Score</span>
                      </div>
                      <Badge
                        variant={
                          data.riskIndex >= 75
                            ? 'risk-critical'
                            : data.riskIndex >= 50
                            ? 'risk-high'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {data.riskIndex}/100
                      </Badge>
                    </div>

                    {/* Resolution Rate */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon icon={Landmark} size="xs" />
                        <span>Clearance Rate</span>
                      </div>
                      <span className="font-data font-semibold text-xs text-success-foreground bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                        {data.resolutionRate}%
                      </span>
                    </div>

                    {/* Active Trend */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Active Trend</span>
                      <Badge
                        variant={
                          data.trend === 'increasing'
                            ? 'risk-high'
                            : data.trend === 'decreasing'
                            ? 'success'
                            : 'secondary'
                        }
                        dot
                        size="sm"
                        className="capitalize"
                      >
                        {data.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default DistrictComparisonPanel;

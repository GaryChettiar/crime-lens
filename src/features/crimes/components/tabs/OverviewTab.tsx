import * as React from 'react';
import {
  FileText, MapPin, ClipboardList, Paperclip, Scale, Users, Crosshair,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from '../../types';
import type { CrimeRecord } from '@/services/crimeApi';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card/60 border border-border/60 rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-muted/40 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground font-data leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground w-40 shrink-0 font-medium">{label}</span>
      <span className="text-xs text-foreground flex-1">{value ?? '—'}</span>
    </div>
  );
}

interface OverviewTabProps {
  crimeData: CrimeRecord;
}

export function OverviewTab({ crimeData }: OverviewTabProps) {
  const statusLabel = CRIME_STATUS_STEPS.find((s) => s.value === crimeData.status)?.label ?? crimeData.status;

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Victims"
          value={crimeData.victimCount ?? 0}
          color="text-destructive"
        />
        <StatCard
          icon={Crosshair}
          label="Suspects"
          value={crimeData.suspectCount ?? 0}
          color="text-amber-400"
        />
        <StatCard
          icon={Paperclip}
          label="Evidence Items"
          value={crimeData.evidenceCount ?? 0}
          color="text-blue-400"
        />
        <StatCard
          icon={Scale}
          label="Legal Sections"
          value={crimeData.legalSectionsCount ?? 0}
          color="text-violet-400"
        />
      </div>

      {/* Incident Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Primary Info */}
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Incident Information</span>
            </div>
            <div>
              <DetailRow label="Crime ID" value={crimeData.crimeNumber} />
              <DetailRow label="Crime Category" value={crimeData.crimeCategory} />
              <DetailRow
                label="Status"
                value={statusLabel}
              />
              <DetailRow label="Incident Date" value={
                crimeData.incidentDate
                  ? new Date(crimeData.incidentDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : undefined
              } />
              <DetailRow label="Logged On" value={
                crimeData.createdAt
                  ? new Date(crimeData.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : undefined
              } />
              <DetailRow label="Logged By User" value={crimeData.createdBy || 'System'} />
            </div>
          </CardContent>
        </Card>

        {/* Assignment & Location */}
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Assignment & Location</span>
            </div>
            <div>
              <DetailRow label="District Juris." value={crimeData.district} />
              <DetailRow label="Specific Location" value={crimeData.crimeLocation} />
              <DetailRow label="Weapon Involved" value={crimeData.weaponUsed} />
              <DetailRow label="Assigned Officer" value={crimeData.assignedOfficerName || 'Pending Assignment'} />
              <DetailRow label="Assigned Station" value={crimeData.assignedStationName || 'Pending Station'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {crimeData.description && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Description</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {crimeData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Badge */}
      <div className="flex justify-end">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
            CRIME_STATUS_COLORS[crimeData.status] ?? 'bg-muted/50 text-muted-foreground'
          }`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

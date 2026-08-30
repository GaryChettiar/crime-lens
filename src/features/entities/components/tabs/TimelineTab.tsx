import * as React from 'react';
import { useGetCrimeTimelineQuery } from '@/services/crimeApi';
import { EmptyState, ErrorState } from '@/components/molecules/DataStates';
import {
  FileText, Shield, Paperclip, UserPlus, RefreshCw as RefreshIcon,
  FileCheck, PenLine, Scale, UserCheck, Clock, Loader2,
} from 'lucide-react';
import type { CrimeTimelineEvent, CrimeActivityLog } from '@/services/crimeApi';
import { cn } from '@/lib/utils';

interface TimelineTabProps {
  crimeId: string;
  initialTimeline?: CrimeTimelineEvent[];
}

const EVENT_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  crime_registered: { icon: FileText, color: 'text-primary', bgColor: 'bg-primary/15 border-primary/30' },
  officer_assigned: { icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/30' },
  evidence_uploaded: { icon: Paperclip, color: 'text-violet-400', bgColor: 'bg-violet-500/15 border-violet-500/30' },
  suspect_added: { icon: UserPlus, color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30' },
  status_updated: { icon: RefreshIcon, color: 'text-cyan-400', bgColor: 'bg-cyan-500/15 border-cyan-500/30' },
  charge_sheet_filed: { icon: FileCheck, color: 'text-orange-400', bgColor: 'bg-orange-500/15 border-orange-500/30' },
  note_added: { icon: PenLine, color: 'text-slate-400', bgColor: 'bg-slate-500/15 border-slate-500/30' },
  legal_section_added: { icon: Scale, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/30' },
  suspect_promoted: { icon: UserCheck, color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30' },
};

function TimelineEventCard({ event }: { event: CrimeTimelineEvent }) {
  const config = EVENT_CONFIG[event.eventType] ?? {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30 border-border',
  };
  const { icon: Icon, color, bgColor } = config;

  const formattedDate = (() => {
    try {
      const d = new Date(event.occurredAt);
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: event.occurredAt, time: '' };
    }
  })();

  return (
    <div className="flex gap-4 group">
      {/* Icon + line */}
      <div className="flex flex-col items-center gap-0">
        <div
          className={cn(
            'w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
            bgColor
          )}
        >
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <div className="flex-1 w-0.5 bg-border my-1 min-h-[40px] group-last:hidden" />
      </div>

      {/* Details */}
      <div className="flex-1 pb-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <p className="text-xs font-semibold text-foreground">{event.title}</p>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formattedDate.date} {formattedDate.time}
          </span>
        </div>
        {event.description && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {event.description}
          </p>
        )}
        {event.actor && (
          <p className="text-[9px] text-primary/70 font-semibold mt-1">
            By: {event.actor}
          </p>
        )}
      </div>
    </div>
  );
}

const MOCK_TIMELINE_EVENTS: Array<Omit<CrimeTimelineEvent, 'crimeId'>> = [
  {
    id: 'time-m-1',
    eventType: 'officer_assigned',
    title: 'Officer Assigned',
    description: 'Inspector R. Sharma has been assigned as the lead investigator.',
    actor: 'System',
    occurredAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export function TimelineTab({ crimeId, initialTimeline }: TimelineTabProps) {
  const { data: fetchedTimeline, isLoading, isError, refetch } = useGetCrimeTimelineQuery(crimeId, {
    skip: initialTimeline !== undefined,
  });

  const events = React.useMemo(() => {
    const list = (fetchedTimeline ?? initialTimeline ?? []).length
      ? (fetchedTimeline ?? initialTimeline ?? [])
      : MOCK_TIMELINE_EVENTS.map((e) => ({ ...e, crimeId }));
    // Newest first
    return [...list].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [fetchedTimeline, initialTimeline, crimeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs">Loading timeline...</span>
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => { refetch(); }} />;

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No timeline events"
        description="No investigation events have been recorded for this crime yet."
      />
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-muted-foreground">Newest first · Live updates coming soon</span>
      </div>

      {/* Timeline list — remove line from last item */}
      <div className="[&>*:last-child_.flex-1]:hidden">
        {events.map((event) => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

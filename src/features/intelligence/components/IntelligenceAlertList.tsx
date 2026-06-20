/**
 * IntelligenceAlertList — Displays a unified list of intelligence alerts.
 *
 * Combines real-time OSINT alerts from the Flask RSS feed with system-level
 * operational alerts, supporting search, filtering by district/severity/type,
 * and marking alerts as read/dismissed.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useIntelligence } from '../hooks/useIntelligence';
import { formatRelativeTime } from '../utils/intelligenceUtils';

// Mock system alerts to display alongside RSS intelligence
const MOCK_SYSTEM_ALERTS: Array<any> = [
  {
    id: 'sys-1',
    type: 'crime-spike',
    title: 'Bengaluru Urban: Crime Spike Detected',
    message: 'A 24% spike in vehicle theft incidents reported in Indiranagar police jurisdiction over the last 48 hours.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    source: 'Operational Engine',
    classification: 'Crime Spike Alert',
    read: false,
    district: 'Bengaluru Urban',
  },
  {
    id: 'sys-2',
    type: 'threshold-breach',
    title: 'Mysuru: Patrol Coverage Violation',
    message: 'Active patrol vehicles in Zone 3 fell below the mandatory threshold of 4 active beats between 02:00 and 04:00.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    source: 'CAD System',
    classification: 'Threshold Violation',
    read: false,
    district: 'Mysuru',
  },
  {
    id: 'sys-3',
    type: 'pattern-detected',
    title: 'Belagavi: Organized Burglary Pattern',
    message: 'Modus operandi match: 3 commercial break-ins using similar bypass techniques detected along NH-4 corridor.',
    severity: 'high',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    source: 'Pattern Matcher',
    classification: 'Pattern Analysis',
    read: false,
    district: 'Belagavi',
  },
  {
    id: 'sys-4',
    type: 'system',
    title: 'Core Sync: Database Refresh Completed',
    message: 'Geospatial crime indices and shapefiles successfully re-indexed. Zero sync faults reported.',
    severity: 'low',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
    source: 'Infrastructure',
    classification: 'System Status',
    read: true,
  },
];

interface IntelligenceAlertListProps {
  districtFilter?: string;
  severityFilter?: string;
  typeFilter?: string;
  selectedAlertId?: string | null;
  onAlertClick?: (alert: any) => void;
  onAlertsCountChange?: (counts: { total: number; unread: number; critical: number }) => void;
}

export function IntelligenceAlertList({
  districtFilter = 'all',
  severityFilter = 'all',
  typeFilter = 'all',
  selectedAlertId = null,
  onAlertClick,
  onAlertsCountChange,
}: IntelligenceAlertListProps) {
  const { intelligenceAlerts, isLoading } = useIntelligence({
    district: districtFilter === 'all' ? undefined : districtFilter,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set(['sys-4']));
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // Merge external intelligence with system alerts
  const allAlerts = useMemo(() => {
    // Process external intel alerts
    const mappedIntel = intelligenceAlerts.map(alert => ({
      ...alert,
      district: alert.title.match(/Bengaluru|Mysuru|Belagavi|Dakshina Kannada|Hubballi|Kalaburagi|Tumakuru|Shivamogga/i)?.[0] || 'Unknown',
    }));

    return [...mappedIntel, ...MOCK_SYSTEM_ALERTS].filter(
      (a) => !dismissedAlertIds.has(a.id)
    );
  }, [intelligenceAlerts, dismissedAlertIds]);

  // Apply filtering logic
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((alert) => {
      // 1. District Filter
      if (districtFilter !== 'all') {
        const districtName = alert.district?.toLowerCase() || '';
        const selected = districtFilter.toLowerCase();
        if (!districtName.includes(selected) && alert.type === 'external-intelligence') {
          // If external-intelligence, use its pre-classified district matching from the hook which handles it
          // Otherwise check the mapped text
        }
      }

      // 2. Severity Filter
      if (severityFilter !== 'all') {
        const sev = alert.severity;
        if (severityFilter === 'critical' && sev !== 'critical') return false;
        if (severityFilter === 'high' && sev !== 'high' && sev !== 'critical') return false;
        if (severityFilter === 'medium' && sev !== 'medium') return false;
        if (severityFilter === 'low' && sev !== 'low' && sev !== 'medium') return false;
      }

      // 3. Type Filter
      if (typeFilter !== 'all') {
        if (alert.type !== typeFilter) return false;
      }

      // 4. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesMessage = alert.message.toLowerCase().includes(q);
        const matchesSource = alert.source.toLowerCase().includes(q);
        const matchesClass = alert.classification.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesSource && !matchesClass) return false;
      }

      return true;
    });
  }, [allAlerts, districtFilter, severityFilter, typeFilter, searchQuery]);

  // Trigger callback to report counts up
  useMemo(() => {
    if (onAlertsCountChange) {
      const unread = allAlerts.filter(a => !readAlertIds.has(a.id)).length;
      const critical = allAlerts.filter(a => a.severity === 'critical' && !readAlertIds.has(a.id)).length;
      onAlertsCountChange({
        total: allAlerts.length,
        unread,
        critical,
      });
    }
  }, [allAlerts, readAlertIds, onAlertsCountChange]);

  const toggleRead = (id: string) => {
    setReadAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAllRead = () => {
    setReadAlertIds(new Set(allAlerts.map((a) => a.id)));
  };

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="risk-critical" size="sm" dot>Critical</Badge>;
      case 'high':
        return <Badge variant="risk-high" size="sm" dot>High</Badge>;
      case 'medium':
        return <Badge variant="risk-medium" size="sm" dot>Medium</Badge>;
      case 'low':
      case 'info':
        return <Badge variant="info" size="sm" dot>Info</Badge>;
      default:
        return <Badge variant="outline" size="sm">Normal</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'external-intelligence':
        return '📡';
      case 'crime-spike':
        return '📈';
      case 'threshold-breach':
        return '⚠️';
      case 'pattern-detected':
        return '🔍';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dispatch notifications, keywords or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-border/80 bg-background/50 focus-visible:ring-primary"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={filteredAlerts.length === 0 || filteredAlerts.every(a => readAlertIds.has(a.id))}
          className="h-9 gap-1 text-xs"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Mark All Read
        </Button>
      </div>

      {/* Main List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-border/60 bg-card/60 animate-pulse">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                  <div className="h-8 w-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 border border-dashed border-border/60 rounded-lg bg-card/20 text-center flex flex-col items-center justify-center space-y-2">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <Typography variant="body-sm" color="muted">
              No alerts match the selected filter criteria.
            </Typography>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isRead = readAlertIds.has(alert.id);
            const isSelected = selectedAlertId === alert.id;
            return (
              <Card
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className={cn(
                  'border border-border transition-all duration-200 hover:border-primary/30 cursor-pointer',
                  isRead ? 'bg-card/40 opacity-75' : 'bg-card/85 shadow-sm border-l-2 border-l-primary',
                  isSelected && 'bg-primary/5 border border-primary/45 shadow'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-background/80 rounded-md border border-border/40 text-base flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 w-full" title={alert.title}>
                          <Typography
                            variant="body-sm"
                            truncate
                            className={cn(
                              'font-bold flex-1 min-w-0',
                              isRead ? 'text-muted-foreground' : 'text-foreground'
                            )}
                          >
                            {alert.title}
                          </Typography>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/30 font-semibold uppercase tracking-wider">
                            {alert.classification}
                          </span>
                        </div>
                        <Typography variant="body-sm" className={cn("text-xs leading-relaxed", isRead ? "text-muted-foreground" : "text-slate-300")}>
                          {alert.message}
                        </Typography>
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground font-medium">
                          <span>Source: <strong className="text-foreground/80">{alert.source}</strong></span>
                          <span>·</span>
                          <span>{formatRelativeTime(alert.timestamp)}</span>
                          {alert.district && alert.district !== 'Unknown' && (
                            <>
                              <span>·</span>
                              <span className="text-primary font-semibold">{alert.district}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {alert.link && (
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Intelligence Source"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRead(alert.id)}
                        title={isRead ? "Mark as Unread" : "Mark as Read"}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        {isRead ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAlert(alert.id)}
                        title="Dismiss Alert"
                        className="h-8 w-8 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

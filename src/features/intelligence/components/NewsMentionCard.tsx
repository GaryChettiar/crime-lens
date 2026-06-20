/**
 * NewsMentionCard — Compact card for a single intelligence article mention.
 *
 * Reusable across Network Analysis AI Intel tab, Risk page, and anywhere
 * a single article needs to be displayed inline.
 */

import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import type { ClassifiedArticle } from '../types';
import { formatSourceName, formatRelativeTime } from '../utils/intelligenceUtils';

interface NewsMentionCardProps {
  article: ClassifiedArticle;
  compact?: boolean;
  className?: string;
}

const severityConfig = {
  critical: {
    dotClass: 'intel-severity-critical',
    label: 'Critical',
    badgeBg: 'bg-danger/10 text-danger border-danger/20',
  },
  warning: {
    dotClass: 'intel-severity-warning',
    label: 'Warning',
    badgeBg: 'bg-warning/10 text-warning border-warning/20',
  },
  info: {
    dotClass: 'intel-severity-info',
    label: 'Info',
    badgeBg: 'bg-info/10 text-info border-info/20',
  },
} as const;

export function NewsMentionCard({ article, compact, className }: NewsMentionCardProps) {
  const config = severityConfig[article.severity];

  if (compact) {
    return (
      <div className={cn('flex items-start gap-2 text-[10px] py-1', className)}>
        <div className={cn('intel-dot mt-1', config.dotClass)} />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-foreground line-clamp-1">{article.title}</span>
          <span className="text-muted-foreground">
            {formatSourceName(article.source)} · {formatRelativeTime(article.published)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('intel-item intel-animate-in', className)}>
      <div className="flex items-start gap-2.5">
        <div className={cn('intel-dot intel-dot--pulse mt-1.5', config.dotClass)} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[11px] text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
            >
              {article.title}
            </a>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0 mt-0.5"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-[9px]">
            <span className={cn(
              'px-1.5 py-0.5 rounded-sm border font-bold uppercase tracking-wider',
              config.badgeBg,
            )}>
              {config.label}
            </span>
            <span className="text-muted-foreground font-medium">
              {formatSourceName(article.source)}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">
              {formatRelativeTime(article.published)}
            </span>
          </div>

          {article.districts.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {article.districts.map((d) => (
                <span
                  key={d}
                  className="text-[8px] px-1.5 py-0.5 rounded-sm bg-primary/8 text-primary/80 border border-primary/15 font-semibold"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CRIME_STATUS_STEPS } from '../types';
import type { CrimeStatus } from '@/services/crimeApi';
import { cn } from '@/lib/utils';

interface CrimeStatusWorkflowProps {
  currentStatus: CrimeStatus;
  onStatusChange: (status: CrimeStatus) => Promise<void>;
  isLoading?: boolean;
  readonly?: boolean;
}

/**
 * CrimeStatusWorkflow — Horizontal progress stepper showing the 6-step crime lifecycle.
 * Clicking a future or adjacent step opens a confirmation dialog before calling onStatusChange.
 */
export function CrimeStatusWorkflow({
  currentStatus,
  onStatusChange,
  isLoading,
  readonly,
}: CrimeStatusWorkflowProps) {
  const [pendingStatus, setPendingStatus] = React.useState<CrimeStatus | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const currentIdx = CRIME_STATUS_STEPS.findIndex((s) => s.value === currentStatus);

  const handleStepClick = (status: CrimeStatus, idx: number) => {
    if (readonly || isLoading || idx === currentIdx) return;
    setPendingStatus(status);
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (!pendingStatus) return;
    try {
      await onStatusChange(pendingStatus);
    } finally {
      setConfirming(false);
      setPendingStatus(null);
    }
  };

  const pendingLabel = CRIME_STATUS_STEPS.find((s) => s.value === pendingStatus)?.label ?? '';

  return (
    <>
      <div className="bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground">Crime Status Workflow</span>
          {isLoading && (
            <span className="text-[10px] text-muted-foreground animate-pulse">Updating...</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-4 left-4 right-4 h-px bg-border" />
          <div
            className="absolute top-4 left-4 h-px bg-primary transition-all duration-500"
            style={{
              width:
                currentIdx === 0
                  ? '0%'
                  : `${(currentIdx / (CRIME_STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className="relative flex items-start justify-between">
            {CRIME_STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;

              return (
                <div key={step.value} className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleStepClick(step.value, idx)}
                    disabled={readonly || isLoading || isCurrent}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 text-xs font-bold relative z-10',
                      isCompleted &&
                        'bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/80',
                      isCurrent &&
                        'bg-primary/20 border-primary text-primary cursor-default ring-2 ring-primary/30',
                      isFuture && !readonly &&
                        'bg-background border-border text-muted-foreground cursor-pointer hover:border-primary/60 hover:text-primary/80',
                      isFuture && readonly &&
                        'bg-background border-border text-muted-foreground/40 cursor-not-allowed'
                    )}
                    title={isFuture && !readonly ? `Move to: ${step.label}` : step.label}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-[10px] font-medium text-center leading-tight max-w-[70px] truncate',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-muted-foreground',
                      isFuture && 'text-muted-foreground/50'
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick advance button */}
        {!readonly && currentIdx < CRIME_STATUS_STEPS.length - 1 && (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
              onClick={() =>
                handleStepClick(CRIME_STATUS_STEPS[currentIdx + 1].value, currentIdx + 1)
              }
              disabled={isLoading}
            >
              Advance to: {CRIME_STATUS_STEPS[currentIdx + 1].shortLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirming} onOpenChange={(o) => { if (!o) { setConfirming(false); setPendingStatus(null); } }}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Update Crime Status</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to change the status to{' '}
              <span className="text-foreground font-semibold">"{pendingLabel}"</span>?
              This action will be logged in the crime activity history.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConfirming(false);
                setPendingStatus(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={isLoading}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

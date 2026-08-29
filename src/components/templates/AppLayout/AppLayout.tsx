import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PrimaryTopNav } from '@/components/organisms/PrimaryTopNav/PrimaryTopNav';
import { GlobalFilterBar } from '@/components/platform/GlobalFilterBar';
import { CrimeLensAssistant } from '@/components/platform/CrimeLensAssistant';
import { useAppSelector } from '@/store/hooks';
import { shouldShowFilterBar } from '@/config/routes';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const filterBarOpen = useAppSelector((s) => s.ui.filterBarOpen);
  const assistantOpen = useAppSelector((s) => s.ui.assistantOpen);
  const location = useLocation();

  const showFilterBar = shouldShowFilterBar(location.pathname);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background relative text-foreground">
      {/* Primary Top Header Navigation */}
      <PrimaryTopNav />

      {/* Global Filter Bar (conditional on operational pages only) */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out shrink-0",
          showFilterBar && filterBarOpen
            ? "max-h-[300px] opacity-100 overflow-visible"
            : "max-h-0 opacity-0 pointer-events-none overflow-hidden"
        )}
      >
        <GlobalFilterBar />
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 min-h-0 py-2',
          className,
        )}
        role="main"
        id="main-content"
      >
        <div className="mx-3 flex h-full min-h-0 flex-row gap-3">
          <div className="min-w-0 flex-1 min-h-0 overflow-y-auto">{children}</div>
          <div
            className={cn(
              'shrink-0 transition-all duration-200',
              assistantOpen ? 'w-[420px] opacity-100' : 'w-0 overflow-hidden opacity-0',
            )}
          >
            <CrimeLensAssistant />
          </div>
        </div>
      </main>
    </div>
  );
}

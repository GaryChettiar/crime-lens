import { useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Map,
  Shield,
  Network,
  Database,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/uiSlice';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

/**
 * Sidebar Organism
 *
 * Primary navigation sidebar for the CrimeLens platform.
 * Collapsible with icon-only mode. Keyboard navigable.
 *
 * WCAG 2.2 AAA:
 * - All nav items have aria-labels
 * - Active state clearly indicated visually
 * - Keyboard accessible with focus-visible rings
 * - Collapse button has aria-expanded
 */

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Heatmap', path: '/heatmap', icon: Map },
  { label: 'Risk Assessment', path: '/risk', icon: Shield },
  { label: 'Network Analysis', path: '/network', icon: Network },
  { label: 'Crime Data Management', path: '/data-management', icon: Database },
  { label: 'E-FIR', path: '/efir', icon: FileText },
  { label: 'Alerts', path: '/alerts', icon: Bell },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  // { label: 'Design System', path: '/design-system', icon: HelpCircle },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const location = useLocation();

  const handleToggle = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-[var(--duration-standard)] ease-[var(--ease-default)]',
        collapsed ? 'w-16' : 'w-60',
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Icon icon={Crosshair} size="sm" className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-heading-sm text-foreground truncate">
              CrimeLens
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        <ul className="flex flex-col gap-1" role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                item={item}
                active={isActive(item.path)}
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom Navigation */}
      <nav className="px-2 py-3" aria-label="Secondary">
        <ul className="flex flex-col gap-1" role="list">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                item={item}
                active={isActive(item.path)}
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={handleToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center justify-center rounded-md p-2',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            'transition-colors',
          )}
        >
          <Icon
            icon={collapsed ? ChevronRight : ChevronLeft}
            size="sm"
          />
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   NavLink sub-component
   --------------------------------------------------------------------------- */

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

function NavLink({ item, active, collapsed }: NavLinkProps) {
  const linkContent = (
    <Link
      to={item.path}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        active
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon icon={item.icon} size="sm" className="shrink-0" />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span
          className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-danger-foreground"
          aria-label={`${item.badge} notifications`}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );

  // Show tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

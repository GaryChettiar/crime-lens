import { useCallback } from 'react';
import { Bell, Moon, Sun, Monitor, Menu, Filter, Shield, Key, User, Settings } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { SearchBar } from '@/components/molecules/SearchBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme, setSidebarMobileOpen, toggleFilterBar } from '@/store/uiSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Theme } from '@/types/component-states';
import { useGetCurrentUserQuery, useLogoutMutation } from '@/features/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';
import * as React from 'react';

/**
 * TopNavbar Organism
 *
 * Horizontal top bar with search, theme toggle, notifications, and user menu.
 * Fixed at top of the content area.
 *
 * WCAG 2.2 AAA:
 * - All interactive elements keyboard accessible
 * - Theme toggle announces current state
 * - Notification count announced to screen readers
 */

interface TopNavbarProps {
  /** Page title shown in the breadcrumb area */
  title?: string;
  /** Breadcrumb path segments */
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function TopNavbar({ title = 'Dashboard' }: TopNavbarProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const filterBarOpen = useAppSelector((s) => s.ui.filterBarOpen);
  const navigate = useNavigate();
  const location = useLocation();

  const showFilterBar = ['/', '/analytics', '/heatmap', '/network', '/network1'].includes(location.pathname);

  const handleToggleFilterBar = useCallback(() => {
    dispatch(toggleFilterBar());
  }, [dispatch]);

  const { data: currentUser } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

  const initials = React.useMemo(() => {
    if (!currentUser?.name) return 'CL';
    return currentUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser?.name]);

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate('/dashboard');
    }
  };

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      dispatch(setTheme(newTheme));
    },
    [dispatch],
  );

  const handleMobileMenuToggle = useCallback(() => {
    dispatch(setSidebarMobileOpen(true));
  }, [dispatch]);

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header
      className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:px-6"
      role="banner"
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={handleMobileMenuToggle}
        aria-label="Open navigation menu"
      >
        <Icon icon={Menu} size="sm" />
      </Button>

      {/* Page title */}
      <h1 className="text-heading-sm text-foreground hidden sm:block">
        {title}
      </h1>

      {/* Search & Filters Toggle */}
      <div className="ml-auto flex items-center gap-2 flex-1 max-w-md">
        <SearchBar
          placeholder="Search cases, locations, suspects..."
        />
        {showFilterBar && (
          <Button
            variant={filterBarOpen ? "default" : "outline"}
            size="sm"
            onClick={handleToggleFilterBar}
            className="h-9 gap-1.5 shrink-0"
            aria-label="Toggle filter settings ribbon"
          >
            <Icon icon={Filter} size="xs" />
            <span>Filters</span>
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Icon icon={Bell} size="sm" />
              {/* Notification dot */}
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"
                aria-label="You have unread notifications"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Current theme: ${theme}. Change theme.`}
                >
                  <Icon icon={themeIcon} size="sm" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Theme</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
              <Icon icon={Moon} size="sm" className="mr-2" />
              Dark
              {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange('light')}>
              <Icon icon={Sun} size="sm" className="mr-2" />
              Light
              {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange('system')}>
              <Icon icon={Monitor} size="sm" className="mr-2" />
              System
              {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-md p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1">
            <div className="flex flex-col px-2 py-2 border-b border-border/40 mb-1 select-none">
              <Typography variant="body-sm" className="font-bold text-foreground truncate">
                {currentUser?.name || 'Officer'}
              </Typography>
              <span className="text-[10px] text-muted-foreground truncate font-data">
                {currentUser?.email}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                <Badge variant="outline" size="sm" className="capitalize scale-90 border-primary/20 text-primary shrink-0">
                  {currentUser?.role || 'User'}
                </Badge>
                <span className="text-[9px] text-muted-foreground truncate" title={currentUser?.department}>
                  {currentUser?.department}
                </span>
              </div>
            </div>
            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => navigate('/administration/profile')}>
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => navigate('/administration/roles')}>
              <Shield className="h-4 w-4 text-muted-foreground" />
              Roles
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => navigate('/administration/permissions')}>
              <Key className="h-4 w-4 text-muted-foreground" />
              Permissions
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => navigate('/administration/settings')}>
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut} className="text-danger cursor-pointer font-semibold">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

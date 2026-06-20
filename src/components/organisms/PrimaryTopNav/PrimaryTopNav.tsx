import { useCallback, useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crosshair, Bell, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarMobileOpen } from '@/store/uiSlice';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetCurrentUserQuery, useLogoutMutation } from '@/features/auth';
import { PRIMARY_NAV_ITEMS } from '@/config/routes';
import { usePermissions } from '@/hooks/usePermissions';
import * as React from 'react';

interface PrimaryTopNavProps {
  /** Show mobile hamburger for sidebar (no longer needed, but kept for signature compatibility) */
  showMobileMenu?: boolean;
}

export function PrimaryTopNav({
  showMobileMenu = false,
}: PrimaryTopNavProps) {
  const dispatch = useAppDispatch();
  const branding = useAppSelector((s) => s.branding.active);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: currentUser } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();
  const { hasPermission } = usePermissions();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // Show left arrow if we are scrolled away from the start
    setShowLeftArrow(scrollLeft > 1);
    
    // Show right arrow if there is remaining scrollable content
    // Use a 1px tolerance to handle subpixel rendering
    const isEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1;
    setShowRightArrow(!isEnd);
  }, []);

  // Update arrows on scroll, resize, or content updates
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    checkScroll();

    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [checkScroll]);

  // Center active item in scroll container
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeElement = container.querySelector('[data-active="true"]') as HTMLElement;
    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      // targetScrollLeft centers the active element within the container
      const targetScrollLeft =
        container.scrollLeft +
        (activeRect.left - containerRect.left) -
        containerRect.width / 2 +
        activeRect.width / 2;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [location.pathname]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.7;
    const target =
      container.scrollLeft +
      (direction === 'left' ? -scrollAmount : scrollAmount);

    container.scrollTo({
      left: target,
      behavior: 'smooth',
    });
  };


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
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleMobileMenuToggle = useCallback(() => {
    dispatch(setSidebarMobileOpen(true));
  }, [dispatch]);

  return (
    <header
      className="flex flex-wrap md:flex-nowrap items-center border-b px-4 lg:px-6 shrink-0 z-20 bg-card border-border text-foreground py-2 md:py-0 md:h-14"
      role="banner"
    >
      {/* Mobile menu toggle — kept only for legacy layout triggers if any */}
      {showMobileMenu && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2 order-1 h-12 flex items-center"
          onClick={handleMobileMenuToggle}
          aria-label="Open navigation menu"
        >
          <Icon icon={Menu} size="sm" />
        </Button>
      )}

      {/* Logo / Brand */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 mr-0 md:mr-8 shrink-0 order-1 h-12 md:h-auto"
        aria-label="CrimeLens Home"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Icon icon={Crosshair} size="sm" className="text-primary-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight hidden sm:block text-foreground">
          {branding.organizationName || 'CrimeLens'}
        </span>
      </Link>

      {/* Primary Navigation — Top Operational Modules */}
      <nav className="order-3 w-full md:w-auto md:order-2 md:flex-1 relative flex items-center overflow-hidden h-10 md:h-full mt-2 md:mt-0 mx-0 md:mx-4" aria-label="Primary navigation">
        {/* Left Chevron */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-8 bg-gradient-to-r from-card via-card/80 to-transparent pointer-events-none">
            <button
              onClick={() => handleScroll('left')}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
              aria-label="Scroll navigation left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full py-1.5 px-8 md:px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                data-active={isActive}
                className={cn(
                  'px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 select-none',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Chevron */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-8 bg-gradient-to-l from-card via-card/80 to-transparent pointer-events-none">
            <button
              onClick={() => handleScroll('right')}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
              aria-label="Scroll navigation right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2 order-2 ml-auto shrink-0 h-12 md:h-auto">
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Notifications"
            >
              <Icon icon={Bell} size="sm" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"
                aria-label="You have unread notifications"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-6 w-px mx-1 bg-border" />

        {/* User Account Menu — Single Click Target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-accent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-right shrink-0"
              aria-label="User menu"
            >
              {/* Stacked User details: Name and Badge */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold leading-none text-foreground">
                  {currentUser?.name || 'Officer'}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="capitalize mt-0.5 scale-[0.85] origin-right border-primary/20 text-primary px-1.5 py-0 font-medium"
                >
                  {currentUser?.role?.replace('_', ' ') || 'User'}
                </Badge>
              </div>

              {/* Avatar circle */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Down Arrow Chevron */}
              <span className="text-[10px] text-muted-foreground select-none">▼</span>
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 p-1 bg-card border border-border text-foreground shadow-lg">
            <div className="flex flex-col px-2 py-2 border-b border-border/40 mb-1 select-none">
              <Typography variant="body-sm" className="font-bold text-foreground truncate">
                {currentUser?.name || 'Officer'}
              </Typography>
              <span className="text-[10px] text-muted-foreground truncate font-data">
                {currentUser?.email}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                <Badge variant="outline" size="sm" className="capitalize scale-90 border-primary/20 text-primary shrink-0">
                  {currentUser?.role?.replace('_', ' ') || 'User'}
                </Badge>
                <span className="text-[9px] text-muted-foreground truncate" title={currentUser?.department}>
                  {currentUser?.department}
                </span>
              </div>
            </div>

            {/* Profile page option */}
            <DropdownMenuItem
              className="cursor-pointer hover:bg-accent"
              onClick={() => navigate('/administration/profile')}
            >
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Users & Roles */}
            {hasPermission('users.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/users')}
              >
                Users
              </DropdownMenuItem>
            )}

            {hasPermission('roles.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/roles')}
              >
                Roles & Permissions
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Geography & Police Infrastructure */}
            {hasPermission('districts.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/districts')}
              >
                Districts
              </DropdownMenuItem>
            )}

            {hasPermission('station-types.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/station-types')}
              >
                Station Types
              </DropdownMenuItem>
            )}

            {hasPermission('police-stations.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/police-stations')}
              >
                Police Stations
              </DropdownMenuItem>
            )}

            {hasPermission('police-ranks.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/police-ranks')}
              >
                Police Ranks
              </DropdownMenuItem>
            )}

            {hasPermission('police-officers.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/police-officers')}
              >
                Police Officers
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Criminal Justice Module */}
            {hasPermission('criminals.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/criminals')}
              >
                Criminal Registry
              </DropdownMenuItem>
            )}

            {hasPermission('crimes.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/crimes')}
              >
                Crime Incidents
              </DropdownMenuItem>
            )}

            {hasPermission('firs.view') && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate('/administration/firs')}
              >
                FIR Registry
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            <DropdownMenuItem
              className="cursor-pointer hover:bg-accent"
              onClick={() => navigate('/administration/settings')}
            >
              Settings
            </DropdownMenuItem>

            <div className="border-t border-border/40 my-1" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-danger cursor-pointer font-semibold hover:bg-danger/10 focus:bg-danger/10"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

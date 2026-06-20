import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Crosshair,
  Bell,
  Menu,
  LayoutDashboard,
  LineChart,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/atoms/Icon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarMobileOpen } from "@/store/uiSlice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/atoms/Badge";
import { Typography } from "@/components/atoms/Typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/features/auth";
import { NAV_GROUPS } from "@/config/routes";
import { usePermissions } from "@/hooks/usePermissions";
import * as React from "react";

const iconMap: Record<string, React.ComponentType<any>> = {
  dashboard: LayoutDashboard,
  analytics: LineChart,
  risk: AlertTriangle,
  alerts: Bell,
};

interface PrimaryTopNavProps {
  /** Show mobile hamburger for sidebar (no longer needed, but kept for signature compatibility) */
  showMobileMenu?: boolean;
}

export function PrimaryTopNav({ showMobileMenu = false }: PrimaryTopNavProps) {
  const dispatch = useAppDispatch();
  const branding = useAppSelector((s) => s.branding.active);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: currentUser } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();
  const { hasPermission } = usePermissions();

  const initials = React.useMemo(() => {
    if (!currentUser?.name) return "CL";
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser?.name]);

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const handleMobileMenuToggle = useCallback(() => {
    dispatch(setSidebarMobileOpen(true));
  }, [dispatch]);

  // Compute active Level 1 group based on activePaths config
  const activeGroup = NAV_GROUPS.find((group) =>
    group.activePaths.some((p) =>
      p === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname.startsWith(p)
    )
  );

  const showSubNav = !!(activeGroup && activeGroup.items && activeGroup.items.length > 0);

  return (
    <header
      className={cn(
        "flex flex-col shrink-0 z-20 bg-card text-foreground",
        !showSubNav && "border-b border-border"
      )}
      role="banner"
    >
      {/* Layer 1: Main Header Row */}
      <div className="flex flex-wrap md:flex-nowrap items-center w-full px-4 lg:px-6 ">
        {/* Mobile menu toggle — kept only for legacy layout triggers if any */}
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2 order-1 h-8 flex items-center"
            onClick={handleMobileMenuToggle}
            aria-label="Open navigation menu"
          >
            <Icon icon={Menu} size="sm" />
          </Button>
        )}

        {/* Logo / Brand */}
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 mr-0 md:mr-6 shrink-0 order-1 "
          aria-label="CrimeLens Home"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg ">
            <Icon
              icon={Crosshair}
              size="sm"
              className="text-primary"
            />
          </div>
          <span className="text-[18px] font-bold tracking-tight hidden sm:block text-foreground">
            {branding.organizationName || "CrimeLens"}
          </span>
        </Link>

        {/* Level 1 Navigation — Top Groups (Left-aligned next to Logo) */}
        <nav
          className="order-3 w-full md:w-auto md:order-2 md:flex-1 flex items-center justify-center md:justify-start gap-1 overflow-x-auto no-scrollbar  md:py-0  ml-4 my-1"
          aria-label="Primary navigation categories"
        >
          {NAV_GROUPS.map((group) => {
            const isActive = activeGroup?.label === group.label;

            return (
              <Link
                key={group.label}
                to={group.path}
                className={cn(
                  "h-full flex items-center text-[13px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 select-none border-b-2 mx-3.5 pt-1",
                  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary focus-visible:outline-none",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {group.label}
              </Link>
            );
          })}
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
              className="flex items-center gap-2.5 rounded-lg p-1.5  transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right shrink-0 my-1"
              aria-label="User menu"
            >
              {/* Stacked User details: Name and Badge */}
              <div className="hidden sm:flex flex-row items-center  ">
                <span className="text-xs font-semibold leading-none text-foreground">
                  {currentUser?.name || "Officer"}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="capitalize mt-0.5 scale-[0.85] origin-right border-primary/20 text-primary px-1.5 py-0 font-medium rounded-full"
                >
                  {currentUser?.role?.replace("_", " ") || "User"}
                </Badge>
              </div>

              {/* Avatar circle */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Down Arrow Chevron */}
              {/* <span className="text-[10px] text-muted-foreground select-none">
                ▼
              </span> */}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 p-1 bg-card border border-border text-foreground shadow-lg"
          >
            <div className="flex flex-col px-2 py-2 border-b border-border/40 mb-1 select-none">
              <Typography
                variant="body-sm"
                className="font-bold text-foreground truncate"
              >
                {currentUser?.name || "Officer"}
              </Typography>
              <span className="text-[10px] text-muted-foreground truncate font-data">
                {currentUser?.email}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                <Badge
                  variant="outline"
                  size="sm"
                  className="capitalize scale-90 border-primary/20 text-primary shrink-0"
                >
                  {currentUser?.role?.replace("_", " ") || "User"}
                </Badge>
                <span
                  className="text-[9px] text-muted-foreground truncate"
                  title={currentUser?.department}
                >
                  {currentUser?.department}
                </span>
              </div>
            </div>

            {/* Profile page option */}
            <DropdownMenuItem
              className="cursor-pointer hover:bg-accent"
              onClick={() => navigate("/administration/profile")}
            >
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Users & Roles */}
            {hasPermission("users.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/users")}
              >
                Users
              </DropdownMenuItem>
            )}

            {hasPermission("roles.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/roles")}
              >
                Roles & Permissions
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Geography & Police Infrastructure */}
            {hasPermission("districts.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/districts")}
              >
                Districts
              </DropdownMenuItem>
            )}

            {hasPermission("station-types.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/station-types")}
              >
                Station Types
              </DropdownMenuItem>
            )}

            {hasPermission("police-stations.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/police-stations")}
              >
                Police Stations
              </DropdownMenuItem>
            )}

            {hasPermission("police-ranks.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/police-ranks")}
              >
                Police Ranks
              </DropdownMenuItem>
            )}

            {hasPermission("police-officers.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/police-officers")}
              >
                Police Officers
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            {/* Criminal Justice Module */}
            {hasPermission("criminals.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/criminals")}
              >
                Criminal Registry
              </DropdownMenuItem>
            )}

            {hasPermission("crimes.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/crimes")}
              >
                Crime Incidents
              </DropdownMenuItem>
            )}

            {hasPermission("firs.view") && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate("/administration/firs")}
              >
                FIR Registry
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-border/40" />

            <DropdownMenuItem
              className="cursor-pointer hover:bg-accent"
              onClick={() => navigate("/administration/settings")}
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
    </div>

      {/* Layer 2: Sub-navigation Row */}
      {showSubNav && (
        <div className="w-full flex items-center justify-center md:justify-start h-8 px-4 lg:px-6 bg-card  select-none overflow-x-auto no-scrollbar">
          <div className="h-full flex items-center gap-4">
            {activeGroup.items?.map((item) => {
              const isSubActive = location.pathname === item.path;
              const SubIcon = item.icon ? iconMap[item.icon] : null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "h-full flex items-center gap-1.5 px-1 text-xs font-semibold border-b-2 transition-all duration-200 select-none",
                    "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary focus-visible:outline-none",                    isSubActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {SubIcon && <SubIcon className={cn("h-3.5 w-3.5 shrink-0", isSubActive ? "text-primary" : "text-muted-foreground")} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

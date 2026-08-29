import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useGetConfigurationByNameQuery } from '@/services/configurationsApi';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { hydrateBranding } from '@/store/slices/brandingSlice';

/**
 * BrandingProvider
 *
 * Syncs the branding/theme Redux state to CSS custom properties on the
 * document root. Handles both active and preview states. Also triggers the
 * configurations API query on mount to hydrate configurations from the server.
 *
 * Place this component near the top of the component tree, inside
 * the Redux Provider.
 */

function hexToHslObject(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function BrandingProvider() {
  const dispatch = useAppDispatch();
  const branding = useAppSelector((s) => s.branding);
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const { data: user } = useGetCurrentUserQuery(undefined, { skip: skipAuth });

  // Hydrate configurations from backend on mount
  const { data: serverBranding } = useGetConfigurationByNameQuery(
    { name: 'branding', email: user?.email },
    { refetchOnMountOrArgChange: true, skip: skipAuth }
  );

  useEffect(() => {
    if (serverBranding) {
      dispatch(hydrateBranding(serverBranding));
    }
  }, [serverBranding, dispatch]);

  const config = branding.isPreviewing ? branding.staged : branding.active;

  useEffect(() => {
    const root = document.documentElement;

    if (config.background) {
      const bgHsl = hexToHslObject(config.background);
      const isDark = bgHsl.l < 50;

      // Set global data-theme attribute and class
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      root.className = isDark ? 'dark' : 'light';

      // Set background custom property
      root.style.setProperty('--background', `${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%`);

      if (isDark) {
        // Dark theme: card surfaces are slightly lighter than background
        root.style.setProperty('--foreground', '210 20% 90%');
        root.style.setProperty('--card', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 3.5)}%`);
        root.style.setProperty('--card-foreground', '210 20% 90%');
        root.style.setProperty('--popover', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 5.5)}%`);
        root.style.setProperty('--popover-foreground', '210 20% 90%');
        root.style.setProperty('--border', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 8)}%`);
        root.style.setProperty('--input', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 10)}%`);
        root.style.setProperty('--muted', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 6)}%`);
        root.style.setProperty('--muted-foreground', '215 15% 60%');
        root.style.setProperty('--secondary', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 8)}%`);
        root.style.setProperty('--secondary-foreground', '210 15% 75%');
        root.style.setProperty('--accent', `${bgHsl.h} ${bgHsl.s}% ${Math.min(100, bgHsl.l + 8)}%`);
        root.style.setProperty('--accent-foreground', '210 15% 80%');
      } else {
        // Light theme: card surfaces are pure white, borders and inputs are contrasting gray
        root.style.setProperty('--foreground', '222 25% 10%');
        root.style.setProperty('--card', '0 0% 100%');
        root.style.setProperty('--card-foreground', '222 25% 10%');
        root.style.setProperty('--popover', '0 0% 100%');
        root.style.setProperty('--popover-foreground', '222 25% 10%');
        root.style.setProperty('--border', `${bgHsl.h} ${bgHsl.s}% ${Math.max(0, bgHsl.l - 12)}%`);
        root.style.setProperty('--input', `${bgHsl.h} ${bgHsl.s}% ${Math.max(0, bgHsl.l - 10)}%`);
        root.style.setProperty('--muted', `${bgHsl.h} ${bgHsl.s}% ${Math.max(0, bgHsl.l - 6)}%`);
        root.style.setProperty('--muted-foreground', '215 15% 40%');
        root.style.setProperty('--secondary', `${bgHsl.h} ${bgHsl.s}% ${Math.max(0, bgHsl.l - 6)}%`);
        root.style.setProperty('--secondary-foreground', '222 20% 30%');
        root.style.setProperty('--accent', `${bgHsl.h} ${bgHsl.s}% ${Math.max(0, bgHsl.l - 8)}%`);
        root.style.setProperty('--accent-foreground', '222 20% 25%');
      }
    }

    if (config.foreground) {
      const fgHsl = hexToHslObject(config.foreground);
      
      // Set accent/primary and ring parameters
      root.style.setProperty('--primary', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`);
      root.style.setProperty('--accent', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`);
      root.style.setProperty('--ring', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`);

      // Calculate relative lightness of the primary foreground accent to keep buttons readable
      const isFgLight = fgHsl.l > 60;
      root.style.setProperty('--primary-foreground', isFgLight ? '222 25% 10%' : '0 0% 100%');
    }

    if (config.borderRadius) {
      root.style.setProperty('--radius', config.borderRadius);
    }

    return () => {
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover');
      root.style.removeProperty('--popover-foreground');
      root.style.removeProperty('--border');
      root.style.removeProperty('--input');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--radius');
    };
  }, [config]);

  return null;
}

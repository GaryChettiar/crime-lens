import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useLazyGetCurrentUserQuery, useLoginMutation } from '@/services/authApi';
import usePermissions from '@/hooks/usePermissions';
import { getDefaultRedirectPath, getRouteConfig } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/atoms/Typography';

export function LoginPage() {
  const branding = useAppSelector((state) => state.branding.active);
  const appName = branding.organizationName || 'CrimeLens';
  const productDescription = `${appName} Intelligence Dashboard`;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const [triggerGetCurrentUser] = useLazyGetCurrentUserQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading: permsLoading, hasPermission } = usePermissions();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    if (!email.trim() || !password) {
      setLoginError('Please enter both your email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password }).unwrap();

      // Immediately fetch current user to avoid stale /auth/me data
      try {
        await triggerGetCurrentUser().unwrap();
      } catch (e) {
        // swallow; fallback logic below handles lack of permissions
      }

      // Wait briefly for permissions to populate
      const waitForReady = async (timeout = 3000) => {
        const start = Date.now();
        while (true) {
          if (!permsLoading) return true;
          if (Date.now() - start > timeout) return false;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 100));
        }
      };

      await waitForReady(3000);

      const requestedPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const requestedRoute = requestedPath ? getRouteConfig(requestedPath) : undefined;
      const validReturnPath =
        requestedPath &&
        requestedPath !== '/no-access' &&
        requestedRoute &&
        (!requestedRoute.requiredPermission || hasPermission(requestedRoute.requiredPermission))
          ? requestedPath
          : undefined;

      const returnTo = validReturnPath || getDefaultRedirectPath(hasPermission);

      navigate(returnTo, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setLoginError(message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-full bg-white p-4 shadow-lg shadow-red-200/40">
            <img
              src="/images.jpg"
              alt="Karnataka State Police logo"
              className="h-full w-full object-contain"
            />
          </div>
          <Typography variant="display-md" as="h1" className="mt-10 font-bold text-slate-950 text-3xl leading-tight">
            KSP Intelligence Portal
          </Typography>
          <Typography variant="body-lg" color="muted" className="mt-4 text-lg leading-relaxed">
            Securely access officer tools, incident analytics, and command reporting.
          </Typography>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-red-500 px-6 py-12">
        <div className="w-full max-w-sm rounded-3xl bg-white/80 p-8 shadow-xl shadow-red-900/25 backdrop-blur-xl border border-white/40">
          <div className="mb-6 text-center">
            <Typography variant="heading-md" as="h2" className="font-semibold text-slate-950">
              Sign in to continue
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-2">
              Enter your officer credentials to access the KSP dashboard.
            </Typography>
          </div>

          <form className="space-y-3" onSubmit={handleSignIn}>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.gov"
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-2 text-muted-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="text-sm text-destructive">{loginError}</div>
            )}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2 inline-block" /> Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

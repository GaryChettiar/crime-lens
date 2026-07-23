import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useLazyGetCurrentUserQuery, useLoginMutation } from '@/services/authApi';
import usePermissions from '@/hooks/usePermissions';
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

      // Choose first allowed route in preferred order
      const ordered = [
        { perm: 'view_dashboard', path: '/dashboard' },
        { perm: 'view_crimes', path: '/entities/crimes' },
        { perm: 'view_network_analysis', path: '/network' },
        { perm: 'view_forecast', path: '/forecast' },
        { perm: 'view_fir', path: '/efir' },
      ];

      const target = ordered.find((o) => hasPermission(o.perm));
      if (target) {
        navigate(target.path);
      } else {
        navigate('/administration/profile');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setLoginError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6 text-center">
            <Typography variant="heading-lg" as="h1" className="font-bold text-foreground">
              {appName}
            </Typography>
            <Typography variant="body-md" color="muted" className="mt-1">
              {productDescription}
            </Typography>
            <Typography variant="heading-md" as="h2" className="mt-4 font-semibold text-foreground">
              Sign in to continue
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2 inline-block" /> Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

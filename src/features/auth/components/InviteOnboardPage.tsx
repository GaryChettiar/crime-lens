import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clearStoredAuthSession } from '@/services/authStorage';
import { useAcceptInviteMutation, useOnboardUserMutation } from '@/services/usersApi';

interface AcceptInviteResponse {
  sysUserId?: string;
}

export function InviteOnboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isAccepted, setIsAccepted] = React.useState(false);
  const [sysUserId, setSysUserId] = React.useState<string | null>(null);

  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();
  const [onboardUser, { isLoading: isOnboarding }] = useOnboardUserMutation();

  React.useEffect(() => {
    clearStoredAuthSession();
  }, []);

  React.useEffect(() => {
    if (!token) {
      setError('No invite token was found in the URL.');
      return;
    }

    let isMounted = true;

    const runAccept = async () => {
      try {
        const response = await acceptInvite({ inviteToken: token }).unwrap();
        if (!isMounted) return;

        const payload = response as AcceptInviteResponse;
        if (!payload?.sysUserId) {
          setError('The invite could not be accepted. No user id was returned.');
          return;
        }

        setSysUserId(payload.sysUserId);
        setIsAccepted(true);
      } catch (err) {
        if (!isMounted) return;
        const message = (err as { data?: { message?: string } })?.data?.message || 'Unable to accept the invite.';
        setError(message);
      }
    };

    runAccept();
    return () => {
      isMounted = false;
    };
  }, [acceptInvite, token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Invite token is missing.');
      return;
    }

    if (!sysUserId) {
      setError('The invite was not accepted yet.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await onboardUser({ sysUserId, password }).unwrap();
      navigate('/login');
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message || 'Unable to set the password.';
      setError(message);
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
             <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-xl bg-red-100 border border-red-200 shadow-inner mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <Typography variant="heading-md" as="h2" className="font-semibold text-slate-950">
              {isAccepted ? 'Set Your Password' : 'Accepting Invite'}
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-2">
              CrimeLens Platform
            </Typography>
          </div>

          {error ? (
            <div className="mb-6 w-full rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {!isAccepted ? (
            <div className="w-full flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 p-4 rounded-xl text-sm text-left">
              <Mail className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Verifying invitation</p>
                <p className="text-emerald-600/80 text-xs leading-relaxed">
                  We are validating your invite token and preparing your account setup.
                </p>
              </div>
            </div>
          ) : (
            <form className="w-full space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isOnboarding} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {isOnboarding ? 'Setting password...' : 'Create account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

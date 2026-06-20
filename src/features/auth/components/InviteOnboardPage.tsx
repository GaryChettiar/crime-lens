import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardUserMutation } from '@/services/usersApi';
import { Shield, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/atoms/Typography';

export function InviteOnboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userInfoId = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [onboardUser, { isLoading }] = useOnboardUserMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!userInfoId) {
      setErrorMsg('Invalid or missing invitation token.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await onboardUser({ userInfoId, password }).unwrap();
      setSuccessMsg('Account activated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to activate account. The link may have expired.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-info/10 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-lg border border-border/60 rounded-xl p-8 shadow-2xl flex flex-col space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 shadow-inner">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="pt-4">
            <Typography variant="heading-md" className="font-bold text-foreground">
              Complete Account Setup
            </Typography>
            <Typography variant="caption" color="muted" className="tracking-wider uppercase font-semibold text-[10px]">
              Set your secure password
            </Typography>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/25 text-danger p-3 rounded text-xs animate-in fade-in duration-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-success/15 border border-success/30 text-success p-3 rounded text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="pass"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 bg-background/50 h-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 hover:text-foreground text-muted-foreground/60 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="pass-confirm" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="pass-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 pr-9 bg-background/50 h-9 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !userInfoId}
            className="w-full h-9 mt-4 text-xs font-semibold"
          >
            {isLoading ? "Activating..." : "Activate Account"}
          </Button>
        </form>

      </div>
    </div>
  );
}

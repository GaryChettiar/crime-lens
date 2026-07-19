import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardUserMutation } from '@/services/usersApi';
import { Shield, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/atoms/Typography';

// ─── Password Strength Helpers ───────────────────────────────────────────────

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function getStrength(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}

const STRENGTH_CONFIG = [
  { label: '', color: 'bg-transparent' },
  { label: 'Weak', color: 'bg-red-500' },
  { label: 'Fair', color: 'bg-orange-400' },
  { label: 'Good', color: 'bg-yellow-400' },
  { label: 'Strong', color: 'bg-emerald-500' },
];

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getStrength(password);
  const config = STRENGTH_CONFIG[strength];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Segment bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              seg <= strength ? config.color : 'bg-border'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <p className={`text-[10px] font-semibold ${
        strength <= 1 ? 'text-red-400' :
        strength === 2 ? 'text-orange-400' :
        strength === 3 ? 'text-yellow-400' :
        'text-emerald-400'
      }`}>
        {config.label} password
      </p>

      {/* Rules checklist */}
      <ul className="space-y-1 mt-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5">
              {passed ? (
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              )}
              <span className={`text-[10px] ${passed ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InviteOnboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userInfoId = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [countdown, setCountdown] = React.useState<number | null>(null);

  const [onboardUser, { isLoading }] = useOnboardUserMutation();

  // Countdown redirect after success
  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!userInfoId) {
      setErrorMsg('Invalid or missing invitation token.');
      return;
    }
    if (strength < 2) {
      setErrorMsg('Password is too weak. Please meet at least 2 requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await onboardUser({ userInfoId, password }).unwrap();
      setSuccessMsg('Account activated successfully!');
      setCountdown(3);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to activate account. The link may have expired.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-lg border border-border/60 rounded-2xl p-8 shadow-2xl flex flex-col space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 shadow-inner">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="pt-3">
            <Typography variant="heading-md" className="font-bold text-foreground">
              Complete Account Setup
            </Typography>
            <Typography variant="caption" color="muted" className="tracking-wider uppercase font-semibold text-[10px]">
              Set your secure password to activate access
            </Typography>
          </div>
        </div>

        {/* Invalid token */}
        {!userInfoId && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/25 text-danger p-3 rounded-lg text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Invalid or missing invitation token. Please use the link from your invitation email.</span>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-danger/10 border border-danger/25 text-danger p-3 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3 rounded-lg text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p>{successMsg}</p>
              {countdown !== null && (
                <p className="mt-0.5 font-semibold opacity-80">
                  Redirecting to login in {countdown}s...
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1">
            <label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 bg-background/50 h-9 text-xs"
                disabled={isLoading || !!successMsg}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 hover:text-foreground text-muted-foreground/60 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength meter */}
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="pass-confirm" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="pass-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-9 pr-9 bg-background/50 h-9 text-xs transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/60 focus-visible:ring-red-500/30'
                    : confirmPassword && password === confirmPassword
                    ? 'border-emerald-500/60 focus-visible:ring-emerald-500/30'
                    : ''
                }`}
                disabled={isLoading || !!successMsg}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 hover:text-foreground text-muted-foreground/60 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                <X className="h-3 w-3" /> Passwords do not match
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <Check className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>

          <Button
            id="activate-btn"
            type="submit"
            disabled={isLoading || !userInfoId || !!successMsg}
            className="w-full h-9 mt-2 text-xs font-semibold"
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-1.5" />
                Activating Account...
              </>
            ) : successMsg ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Account Activated
              </>
            ) : (
              'Activate Account'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Brain,
  MapPin,
  Fingerprint,
  ArrowRight,
  Lock,
  Activity,
} from 'lucide-react';
import { consumePostLoginPath, savePostLoginPath } from '@/config/auth';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { renderCatalystSignIn } from '@/services/catalystAuth';

const FEATURES = [
  {
    icon: Brain,
    label: 'AI Crime Forecasting',
    description: 'Predictive analytics to anticipate criminal activity before it happens.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: MapPin,
    label: 'Geospatial Heatmaps',
    description: 'Real-time crime density mapping across districts and police zones.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: Fingerprint,
    label: 'Biometric Identification',
    description: 'AFIS-integrated fingerprint matching for rapid suspect identification.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Activity,
    label: 'Live Intelligence Feed',
    description: 'Real-time alerts, network analysis, and entity relationship graphs.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
];

export function LoginPage() {
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [showCatalystForm, setShowCatalystForm] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: authenticatedUser, isLoading: isCheckingSession } = useGetCurrentUserQuery(undefined, {
    pollingInterval: showCatalystForm ? 1500 : 0,
  });

  React.useEffect(() => {
    if (authenticatedUser) {
      navigate(consumePostLoginPath() ?? '/dashboard', { replace: true });
    }
  }, [authenticatedUser, navigate]);

  const handleSignIn = async () => {
    setIsRedirecting(true);
    setAuthError(null);
    const from = (location.state as { from?: unknown } | null)?.from;
    savePostLoginPath(typeof from === 'string' ? from : '/dashboard');
    setShowCatalystForm(true);

    // Wait for React to mount the target element before Catalyst renders its form.
    requestAnimationFrame(async () => {
      try {
        await renderCatalystSignIn('catalyst-login-form');
      } catch (error) {
        setShowCatalystForm(false);
        setAuthError(error instanceof Error ? error.message : 'Unable to load secure sign-in.');
        setIsRedirecting(false);
      }
    });
  };

  return (
    <div className="relative flex min-h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* ── Ambient Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-cyan-600/4 blur-[150px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,179,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-16 md:py-24">
        {/* Top badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Restricted Law Enforcement Access
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          {/* Animated Shield */}
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <span className="absolute h-24 w-24 animate-ping rounded-full bg-primary/10 border border-primary/15" style={{ animationDuration: '2.5s' }} />
            <span className="absolute h-18 w-18 rounded-full bg-primary/15 border border-primary/25 h-[72px] w-[72px]" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 shadow-lg shadow-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Crime<span className="text-primary">Lens</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            AI-powered crime intelligence platform for law enforcement agencies.
            Secure, real-time, and built for operational excellence.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="w-full max-w-sm mb-12">
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Authentication Required
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                Credentials are verified through the Zoho Catalyst secure identity provider.
              </p>
            </div>

            {showCatalystForm ? (
              <div id="catalyst-login-form" className="min-h-52" aria-live="polite" />
            ) : (
              <button
                id="signin-btn"
                onClick={handleSignIn}
                disabled={isRedirecting || isCheckingSession}
                className="group relative w-full overflow-hidden rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedirecting || isCheckingSession ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Preparing secure sign-in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Access Secure Portal
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            )}

            {authError && (
              <p className="mt-3 text-center text-xs text-red-400" role="alert">{authError}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
              <Shield className="h-3 w-3" />
              <span>Powered by Zoho Catalyst · End-to-end encrypted</span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className={`rounded-xl border ${f.border} ${f.bg} p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.bg} border ${f.border}`}>
                    <Icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${f.color}`}>{f.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-10 text-[10px] text-muted-foreground/40 uppercase tracking-widest text-center">
          Unauthorized access is prohibited and punishable by law. &copy; {new Date().getFullYear()} CrimeLens
        </p>
      </div>
    </div>
  );
}

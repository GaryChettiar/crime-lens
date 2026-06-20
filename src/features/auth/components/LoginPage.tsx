import * as React from 'react';
import { Shield } from 'lucide-react';
import { Typography } from '@/components/atoms/Typography';

export function LoginPage() {
  React.useEffect(() => {
    // Redirect securely to the Catalyst authentication portal
    const catalystLoginUrl = 'https://crimelens-60074096850.development.catalystserverless.in/__catalyst/auth/login';
    window.location.href = catalystLoginUrl;
  }, []);

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      
      {/* Background glowing ambient elements */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-info/10 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-lg border border-border/60 rounded-xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 shadow-inner">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="pt-4">
            <Typography variant="heading-md" className="font-bold text-foreground">
              CrimeLens Secure Portal
            </Typography>
            <Typography variant="caption" color="muted" className="tracking-wider uppercase font-semibold text-[10px]">
              Redirecting to Identity Provider...
            </Typography>
          </div>
        </div>

        <div className="flex items-center justify-center p-4">
           <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>

      </div>
    </div>
  );
}

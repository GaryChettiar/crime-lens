import * as React from 'react';
import { Shield, Mail } from 'lucide-react';
import { Typography } from '@/components/atoms/Typography';

export function InviteOnboardPage() {
  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-lg border border-border/60 rounded-2xl p-10 shadow-2xl flex flex-col items-center space-y-6 text-center">
        {/* Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 shadow-inner">
          <Shield className="h-8 w-8 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <Typography variant="heading-md" className="font-bold text-foreground">
            Account Created
          </Typography>
          <Typography variant="caption" color="muted" className="tracking-wider uppercase font-semibold text-[10px]">
            CrimeLens Platform
          </Typography>
        </div>

        {/* Email notice card */}
        <div className="w-full flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-4 rounded-xl text-sm text-left">
          <Mail className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Check your inbox</p>
            <p className="text-emerald-400/80 text-xs leading-relaxed">
              We've sent an activation email. Please check your inbox to set your password and activate your account.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Didn't receive an email? Check your spam folder or contact your administrator to resend the invitation.
        </p>
      </div>
    </div>
  );
}

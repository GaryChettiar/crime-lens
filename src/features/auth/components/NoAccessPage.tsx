import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/atoms/Typography';

export function NoAccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoProfile = () => {
    navigate('/administration/profile');
  };

  const handleBack = () => {
    navigate(location.state?.from?.pathname || '/dashboard');
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      <div className="relative z-10 w-full max-w-md bg-card/40 backdrop-blur-lg border border-border/60 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/25">
          <Shield className="h-8 w-8 text-destructive" />
        </div>

        <Typography variant="heading-md" className="font-bold text-foreground">
          Access Denied
        </Typography>
        <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>

        <div className="w-full flex gap-3">
          <Button variant="outline" className="w-full" onClick={handleGoProfile}>
            Go to Profile
          </Button>
          <Button className="w-full" onClick={handleBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}

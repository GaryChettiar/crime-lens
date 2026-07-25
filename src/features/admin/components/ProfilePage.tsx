import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { useGetConfigurationByNameQuery, useUpdateConfigurationsMutation } from '@/services/configurationsApi';
import {
  User,
  Shield,
  Building2,
  Mail,
  Phone,
  Settings,
  Lock,
  ExternalLink,
  Palette,
} from 'lucide-react';

export function ProfilePage() {
  const { data: currentUser } = useGetCurrentUserQuery();

  const { data: brandingConfig } = useGetConfigurationByNameQuery('branding');
  const { data: emailConfigData } = useGetConfigurationByNameQuery('email');
  
  const [updateConfig] = useUpdateConfigurationsMutation();

  const [brandingForm, setBrandingForm] = React.useState({
    foreground: '',
    background: '',
    email: '',
    smtpPort: ''
  });

  React.useEffect(() => {
    if (brandingConfig || emailConfigData) {
      setBrandingForm({
        foreground: brandingConfig?.foreground || '',
        background: brandingConfig?.background || '',
        email: emailConfigData?.email || '',
        smtpPort: emailConfigData?.smtpPort || ''
      });
    }
  }, [brandingConfig, emailConfigData]);

  const handleSaveBranding = async () => {
    try {
      if (brandingForm.foreground || brandingForm.background) {
        await updateConfig({
          name: 'branding',
          config: {
            ...brandingConfig,
            foreground: brandingForm.foreground,
            background: brandingForm.background,
          },
          email:currentUser?.email
        });
      }
      if (brandingForm.email || brandingForm.smtpPort) {
        await updateConfig({
          name: 'email',
          config: {
            ...emailConfigData,
            email: brandingForm.email,
            smtpPort: brandingForm.smtpPort,
          }
        });
      }
      // alert('Branding & Email configuration saved successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to save configuration');
    }
  };

  const initials = React.useMemo(() => {
    if (!currentUser?.name) return 'CL';
    return currentUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser?.name]);

  const handleRedirectToCatalystAuth = () => {
    // Redirection URL for Catalyst password management/console
    window.open('https://crimelens-60074096850.development.catalystserverless.in/__catalyst/auth/login', '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Manage your account security, details, and application preferences.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="admin-card p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-border shadow-md bg-primary flex items-center justify-center">
                <div className="text-primary-foreground text-2xl font-bold">
                  {initials}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">
                {currentUser?.name || 'User'}
              </h2>
              <p className="text-sm mt-0.5 text-muted-foreground">
                {currentUser?.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <span className="admin-badge admin-badge-role">
                  <Shield className="h-3 w-3 mr-1" />
                  {currentUser?.role?.replace('_', ' ') || 'User'}
                </span>
                {currentUser?.department && (
                  <span className="admin-badge bg-success/15 text-success">
                    <Building2 className="h-3 w-3 mr-1" />
                    {currentUser.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="p-3.5 rounded-lg border border-warning/20 bg-warning/5 text-warning flex items-start gap-2.5 mb-4">
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Your identity and credentials are managed securely by <strong>Catalyst Single Sign-On (SSO)</strong>. Details shown below are read-only in this console.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    className="admin-input bg-muted/30 cursor-not-allowed opacity-80"
                    readOnly
                    value={currentUser?.name || ''}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="admin-input pl-10 bg-muted/30 cursor-not-allowed opacity-80"
                      readOnly
                      value={currentUser?.email || ''}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="admin-input pl-10 bg-muted/30 cursor-not-allowed opacity-80"
                      readOnly
                      value={currentUser?.phone || '—'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      className="admin-input pl-10 bg-muted/30 cursor-not-allowed opacity-80"
                      readOnly
                      value={currentUser?.department || '—'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings / Actions */}
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Lock className="h-5 w-5 text-warning" />
                <h3 className="text-sm font-bold text-foreground">Security & Password</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Update Password</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Redirect to Catalyst identity provider to securely update your password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRedirectToCatalystAuth}
                  className="admin-btn admin-btn-primary shrink-0"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Reset password
                </button>
              </div>
            </div>

            {/* Platform Branding */}
            {/* <div className="admin-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Platform Branding & Email</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Support Email
                  </label>
                  <input
                    className="admin-input"
                    value={brandingForm.email}
                    onChange={(e) => setBrandingForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@crimelens.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    SMTP Port
                  </label>
                  <input
                    className="admin-input"
                    type="number"
                    value={brandingForm.smtpPort}
                    onChange={(e) => setBrandingForm(f => ({ ...f, smtpPort: e.target.value }))}
                    placeholder="465"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Foreground Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-9 w-9 rounded border border-border cursor-pointer shrink-0 p-0.5 bg-transparent"
                      value={brandingForm.foreground || '#ffffff'}
                      onChange={(e) => setBrandingForm(f => ({ ...f, foreground: e.target.value }))}
                    />
                    <input
                      className="admin-input uppercase"
                      value={brandingForm.foreground}
                      onChange={(e) => setBrandingForm(f => ({ ...f, foreground: e.target.value }))}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Background Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-9 w-9 rounded border border-border cursor-pointer shrink-0 p-0.5 bg-transparent"
                      value={brandingForm.background || '#000000'}
                      onChange={(e) => setBrandingForm(f => ({ ...f, background: e.target.value }))}
                    />
                    <input
                      className="admin-input uppercase"
                      value={brandingForm.background}
                      onChange={(e) => setBrandingForm(f => ({ ...f, background: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBranding}
                  className="admin-btn admin-btn-primary"
                >
                  Save Branding
                </button>
              </div>
            </div> */}
          </div>

          {/* Preferences Column */}
          {/* <div className="space-y-6">
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Portal Preferences</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Timezone
                  </label>
                  <select className="admin-input" defaultValue="IST">
                    <option value="IST">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Language
                  </label>
                  <select className="admin-input" defaultValue="en">
                    <option value="en">English</option>
                    <option value="kn">Kannada</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert('Preferences saved locally.')}
                  className="admin-btn admin-btn-secondary w-full"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </AdminLayout>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

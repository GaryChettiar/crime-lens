import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useUpdateConfigurationsMutation } from '@/services/configurationsApi';
import {
  setStagedField,
  applyBranding,
  cancelPreview,
  previewBranding,
  resetBranding,
} from '@/store/slices/brandingSlice';
import { DEFAULT_BRANDING } from '@/types/rbac';
import {
  Palette,
  Check,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

function getHexLightness(hex: string): number {
  try {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return ((max + min) / 2) * 100;
  } catch {
    return 50;
  }
}

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const branding = useAppSelector((state) => state.branding);
  const [updateConfigurations, { isLoading: isUpdating }] = useUpdateConfigurationsMutation();

  const handleBrandingChange = (field: keyof typeof branding.staged, value: string) => {
    dispatch(setStagedField({ field, value }));
  };

  const handleApplyBranding = async () => {
    try {
      // For now, apply branding locally. Later we will persist via BE endpoint.
      dispatch(applyBranding());

      /*
      await updateConfigurations({
        name: 'branding',
        config: branding.staged,
      }).unwrap();
      */
    } catch (err: any) {
      console.error('Failed to sync branding to backend:', err);
    }
  };

  const handleResetBranding = async () => {
    if (window.confirm('Are you sure you want to reset all branding colors to system defaults?')) {
      try {
        // For now, reset branding locally. Later we will persist via BE endpoint.
        dispatch(resetBranding());

        /*
        await updateConfigurations({
          name: 'branding',
          config: DEFAULT_BRANDING,
        }).unwrap();
        */
      } catch (err: any) {
        console.error('Failed to sync reset branding to backend:', err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">System Settings</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Configure system themes, branding, and custom portal aesthetics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetBranding}
              className="admin-btn admin-btn-secondary text-xs"
              disabled={isUpdating}
            >
              Reset Defaults
            </button>
            {branding.isPreviewing ? (
              <>
                <button
                  onClick={() => dispatch(cancelPreview())}
                  className="admin-btn admin-btn-danger text-xs"
                  disabled={isUpdating}
                >
                  Cancel Preview
                </button>
                <button
                  onClick={handleApplyBranding}
                  className="admin-btn admin-btn-primary text-xs"
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                  Apply & Persist
                </button>
              </>
            ) : (
              <button
                onClick={() => dispatch(previewBranding())}
                className="admin-btn admin-btn-primary text-xs"
                disabled={!branding.hasUnsavedChanges || isUpdating}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview Changes
              </button>
            )}
          </div>
        </div>

        {branding.isPreviewing && (
          <div className="p-3 rounded-lg flex items-center gap-2 text-primary bg-primary/10 border border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium">
              Preview mode active. Staged colors are loaded temporarily in your browser session. Click 'Apply & Persist' to save to the database.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="admin-card p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Color Customization</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                  Organization Name
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. CrimeLens"
                  value={branding.staged.organizationName}
                  onChange={(e) => handleBrandingChange('organizationName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Foreground Color (Accent / Highlights)
                  </label>
                  <div className="flex gap-2">
                    <div className="admin-color-swatch shrink-0">
                      <input
                        type="color"
                        value={branding.staged.foreground}
                        onChange={(e) => handleBrandingChange('foreground', e.target.value)}
                        aria-label="Foreground theme color"
                      />
                    </div>
                    <input
                      type="text"
                      className="admin-input flex-1"
                      value={branding.staged.foreground}
                      onChange={(e) => handleBrandingChange('foreground', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Background Color (Surfaces / Dark-Light Gating)
                  </label>
                  <div className="flex gap-2">
                    <div className="admin-color-swatch shrink-0">
                      <input
                        type="color"
                        value={branding.staged.background}
                        onChange={(e) => handleBrandingChange('background', e.target.value)}
                        aria-label="Background theme color"
                      />
                    </div>
                    <input
                      type="text"
                      className="admin-input flex-1"
                      value={branding.staged.background}
                      onChange={(e) => handleBrandingChange('background', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Corner Border Radius
                  </label>
                  <select
                    className="admin-input"
                    value={branding.staged.borderRadius}
                    onChange={(e) => handleBrandingChange('borderRadius', e.target.value)}
                  >
                    <option value="0px">Sharp (0px)</option>
                    <option value="0.25rem">Compact (4px)</option>
                    <option value="0.375rem">Standard (6px)</option>
                    <option value="0.5rem">Medium (8px)</option>
                    <option value="0.75rem">Curved (12px)</option>
                    <option value="1rem">Rounded (16px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                    Portal Logo Image URL (PNG/SVG)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Leave blank for system logo symbol"
                    value={branding.staged.logoUrl}
                    onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {branding.hasUnsavedChanges && !branding.isPreviewing && (
              <div className="pt-2">
                <button
                  onClick={() => dispatch(previewBranding())}
                  className="admin-btn admin-btn-secondary w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Changes Live
                </button>
              </div>
            )}
          </div>

          {/* Staging Render Preview card */}
          {(() => {
            const isDark = getHexLightness(branding.staged.background) < 50;
            const previewTextColor = isDark ? '#f1f5f9' : '#0f172a';
            const previewSecondaryTextColor = isDark ? '#94a3b8' : '#475569';
            const previewCardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';
            const previewBorderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
            const fgLightness = getHexLightness(branding.staged.foreground);
            const previewFgTextColor = fgLightness > 60 ? '#0f172a' : '#ffffff';
            const organizationName = branding.staged.organizationName || 'CrimeLens';

            return (
              <div 
                className="border rounded-xl p-6 flex flex-col justify-center transition-colors duration-200"
                style={{
                  backgroundColor: branding.staged.background,
                  borderColor: previewBorderColor
                }}
              >
                <div className="mb-4">
                  <h4 
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: previewSecondaryTextColor }}
                  >
                    Simulated Live Component Preview
                  </h4>
                  <p className="text-[11px]" style={{ color: previewSecondaryTextColor }}>
                    How key items render with current settings:
                  </p>
                </div>

                <div 
                  className="space-y-4 p-6 rounded-lg border shadow-sm transition-colors duration-200"
                  style={{
                    backgroundColor: previewCardBg,
                    borderColor: previewBorderColor
                  }}
                >
                  {/* Fake Header */}
                  <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: previewBorderColor }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 flex items-center justify-center text-[10px] font-bold transition-all duration-200"
                        style={{
                          backgroundColor: branding.staged.foreground,
                          color: previewFgTextColor,
                          borderRadius: branding.staged.borderRadius,
                        }}
                      >
                        CL
                      </div>
                      <span className="text-xs font-bold" style={{ color: previewTextColor }}>
                        {organizationName}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: previewSecondaryTextColor }}>
                      Operations Center
                    </span>
                  </div>

                  {/* Fake Card inside */}
                  <div
                    className="p-4 border space-y-3 transition-colors duration-200"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      borderColor: previewBorderColor,
                      borderRadius: branding.staged.borderRadius,
                    }}
                  >
                    <h5 className="text-xs font-bold" style={{ color: previewTextColor }}>
                      Critical Heatmap Records
                    </h5>
                    <p className="text-[11px] leading-relaxed" style={{ color: previewSecondaryTextColor }}>
                      Visualizing active criminal syndicates in designated zones.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 text-[10px] font-semibold transition-all duration-200"
                        style={{
                          backgroundColor: branding.staged.foreground,
                          color: previewFgTextColor,
                          borderRadius: branding.staged.borderRadius,
                        }}
                      >
                        Execute Analysis
                      </button>
                      <button
                        className="px-3 py-1.5 text-[10px] font-semibold border bg-transparent"
                        style={{
                          color: previewTextColor,
                          borderColor: previewBorderColor,
                          borderRadius: branding.staged.borderRadius,
                        }}
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Badge Preview */}
                  <div className="flex gap-2 items-center">
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-200"
                      style={{
                        backgroundColor: branding.staged.foreground,
                        color: previewFgTextColor,
                        borderRadius: branding.staged.borderRadius,
                      }}
                    >
                      Accent Highlight
                    </span>
                    <span className="text-[10px]" style={{ color: previewSecondaryTextColor }}>
                      Live preview indicator
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}

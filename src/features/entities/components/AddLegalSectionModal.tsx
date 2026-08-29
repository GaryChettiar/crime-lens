import * as React from 'react';
import { useAddCrimeLegalSectionMutation } from '@/services/crimeApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Scale, Search } from 'lucide-react';
import type { CreateLegalSectionPayload } from '@/services/crimeApi';

interface AddLegalSectionModalProps {
  crimeId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}


// Common IPC and special law sections for quick search
const COMMON_SECTIONS: Array<Omit<CreateLegalSectionPayload, 'isBailable' | 'isCognizable'> & {
  isBailable: boolean; isCognizable: boolean;
}> = [
  { act: 'IPC', section: '302', title: 'Punishment for Murder', severity: 'grievous', isBailable: false, isCognizable: true, punishment: 'Death or Life Imprisonment' },
  { act: 'IPC', section: '304B', title: 'Dowry Death', severity: 'grievous', isBailable: false, isCognizable: true, punishment: 'Not less than 7 years, may extend to life' },
  { act: 'IPC', section: '376', title: 'Punishment for Rape', severity: 'grievous', isBailable: false, isCognizable: true, punishment: 'Not less than 10 years, may extend to life' },
  { act: 'IPC', section: '307', title: 'Attempt to Murder', severity: 'serious', isBailable: false, isCognizable: true, punishment: 'Imprisonment up to 10 years and fine' },
  { act: 'IPC', section: '379', title: 'Punishment for Theft', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years or fine' },
  { act: 'IPC', section: '392', title: 'Punishment for Robbery', severity: 'serious', isBailable: false, isCognizable: true, punishment: 'Rigorous imprisonment up to 10 years and fine' },
  { act: 'IPC', section: '420', title: 'Cheating and Dishonestly Inducing Delivery of Property', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 7 years and fine' },
  { act: 'IPC', section: '498A', title: 'Cruelty by Husband or His Relatives', severity: 'serious', isBailable: false, isCognizable: true, punishment: 'Imprisonment up to 3 years and fine' },
  { act: 'NDPS Act', section: '21', title: 'Punishment for contravention in relation to manufactured drugs', severity: 'serious', isBailable: false, isCognizable: true, punishment: 'Rigorous imprisonment 10–20 years and fine' },
  { act: 'IT Act', section: '66', title: 'Computer Related Offences', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years or fine up to 5 lakh' },
  { act: 'IT Act', section: '66C', title: 'Identity Theft', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years and fine up to 1 lakh' },
  { act: 'IT Act', section: '66D', title: 'Cheating by Personation using Computer Resource', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years and fine up to 1 lakh' },
  { act: 'IPC', section: '323', title: 'Punishment for Voluntarily Causing Hurt', severity: 'minor', isBailable: true, isCognizable: false, punishment: 'Imprisonment up to 1 year or fine up to 1000' },
  { act: 'IPC', section: '324', title: 'Voluntarily Causing Hurt by Dangerous Weapons', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years or fine' },
  { act: 'IPC', section: '406', title: 'Punishment for Criminal Breach of Trust', severity: 'moderate', isBailable: false, isCognizable: false, punishment: 'Imprisonment up to 3 years or fine' },
];

export function AddLegalSectionModal({ crimeId, onClose, onSuccess }: AddLegalSectionModalProps) {
  const [addSection, { isLoading }] = useAddCrimeLegalSectionMutation();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedPreset, setSelectedPreset] = React.useState<(typeof COMMON_SECTIONS)[0] | null>(null);
  const [form, setForm] = React.useState<Partial<CreateLegalSectionPayload>>({
    severity: 'moderate',
    isBailable: false,
    isCognizable: true,
  });

  const filteredPresets = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return COMMON_SECTIONS;
    return COMMON_SECTIONS.filter(
      (s) =>
        s.act.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const applyPreset = (preset: (typeof COMMON_SECTIONS)[0]) => {
    setSelectedPreset(preset);
    setForm({
      act: preset.act,
      section: preset.section,
      title: preset.title,
      severity: preset.severity,
      isBailable: preset.isBailable,
      isCognizable: preset.isCognizable,
      punishment: preset.punishment,
    });
  };

  const setField = <K extends keyof CreateLegalSectionPayload>(k: K, v: CreateLegalSectionPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.act?.trim() || !form.section?.trim() || !form.title?.trim()) return;
    try {
      await addSection({ crimeId, body: form as CreateLegalSectionPayload }).unwrap();
      onSuccess('Legal section added to crime.');
    } catch (err) {
      console.error('Add legal section failed:', err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Add Legal Section
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-1">
          {/* Left: Quick search */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Search Law
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search IPC, IT Act..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => (
                <button
                  key={`${preset.act}-${preset.section}`}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedPreset?.section === preset.section && selectedPreset?.act === preset.act
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="font-semibold">
                    {preset.act} §{preset.section}
                  </div>
                  <div className="text-muted-foreground text-[10px] line-clamp-1 mt-0.5">
                    {preset.title}
                  </div>
                </button>
              ))}
              {filteredPresets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No presets found. Fill form manually.</p>
              )}
            </div>
          </div>

          {/* Right: Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Section Details
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="admin-label">Act *</label>
                <Input
                  value={form.act ?? ''}
                  onChange={(e) => setField('act', e.target.value)}
                  placeholder="IPC / IT Act..."
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="admin-label">Section *</label>
                <Input
                  value={form.section ?? ''}
                  onChange={(e) => setField('section', e.target.value)}
                  placeholder="e.g. 302"
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="admin-label">Title *</label>
              <Input
                value={form.title ?? ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Section title"
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            <div>
              <label className="admin-label">Severity</label>
              <select
                value={form.severity ?? 'moderate'}
                onChange={(e) => setField('severity', e.target.value as CreateLegalSectionPayload['severity'])}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mt-1"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="serious">Serious</option>
                <option value="grievous">Grievous</option>
              </select>
            </div>

            <div>
              <label className="admin-label">Punishment</label>
              <Input
                value={form.punishment ?? ''}
                onChange={(e) => setField('punishment', e.target.value)}
                placeholder="Punishment description"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBailable ?? false}
                  onChange={(e) => setField('isBailable', e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-xs text-foreground">Bailable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isCognizable ?? true}
                  onChange={(e) => setField('isCognizable', e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-xs text-foreground">Cognizable</span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
                Apply Section
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

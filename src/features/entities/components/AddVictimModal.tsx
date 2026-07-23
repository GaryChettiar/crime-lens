import * as React from 'react';
import { useAddCaseVictimMutation, useUpdateCaseVictimMutation } from '@/services/crimeApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, UserPlus } from 'lucide-react';
import type { CaseVictim, CreateVictimPayload } from '@/services/crimeApi';

interface AddVictimModalProps {
  incidentId: string;
  existing?: CaseVictim | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const GENDERS = ['Male', 'Female', 'Other'];

export function AddVictimModal({ incidentId, existing, onClose, onSuccess }: AddVictimModalProps) {
  const [addVictim, { isLoading: isAdding }] = useAddCaseVictimMutation();
  const [updateVictim, { isLoading: isUpdating }] = useUpdateCaseVictimMutation();

  const isEditing = !!existing;
  const isLoading = isAdding || isUpdating;

  const [form, setForm] = React.useState<Partial<CreateVictimPayload>>({
    incident_id: incidentId,
    full_name: existing?.fullName ?? '',
    gender: existing?.gender ?? '',
    mobile_number: existing?.mobileNumber ?? '',
    email: existing?.email ?? '',
    address: existing?.address ?? '',
    occupation: existing?.occupation ?? '',
    injury_type: existing?.injuryType ?? '',
    medical_report_number: existing?.medicalReportNumber ?? '',
    alive: existing?.alive ?? true,
  });

  const setField = (k: keyof CreateVictimPayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name?.trim()) return;
    try {
      if (isEditing && existing) {
        await updateVictim({ id: existing.id, incidentId, body: form }).unwrap();
        onSuccess('Victim updated successfully.');
      } else {
        await addVictim({ ...form, incident_id: incidentId } as CreateVictimPayload).unwrap();
        onSuccess('Victim added to case incident.');
      }
    } catch (err: any) {
      console.error('Victim save failed:', err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            {isEditing ? 'Edit Victim Details' : 'Add Victim to Case'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name */}
            <div className="col-span-2">
              <label className="admin-label">Full Name *</label>
              <Input
                value={form.full_name ?? ''}
                onChange={(e) => setField('full_name', e.target.value)}
                placeholder="Victim's full name"
                className="h-8 text-xs mt-1"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="admin-label">Gender</label>
              <select
                value={form.gender ?? ''}
                onChange={(e) => setField('gender', e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mt-1"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="admin-label">Mobile Number</label>
              <Input
                value={form.mobile_number ?? ''}
                onChange={(e) => setField('mobile_number', e.target.value)}
                placeholder="Contact number"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <label className="admin-label">Email</label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="victim@example.com"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="admin-label">Occupation</label>
              <Input
                value={form.occupation ?? ''}
                onChange={(e) => setField('occupation', e.target.value)}
                placeholder="Current occupation"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="admin-label">Address</label>
              <Input
                value={form.address ?? ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Residential address"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Injury Type */}
            <div>
              <label className="admin-label">Injury Type</label>
              <Input
                value={form.injury_type ?? ''}
                onChange={(e) => setField('injury_type', e.target.value)}
                placeholder="e.g. Minor, Severe, None"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Medical Report Number */}
            <div>
              <label className="admin-label">Medical Report #</label>
              <Input
                value={form.medical_report_number ?? ''}
                onChange={(e) => setField('medical_report_number', e.target.value)}
                placeholder="Med-Ref-XXXX"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Alive Status */}
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="victim-alive"
                checked={form.alive ?? true}
                onChange={(e) => setField('alive', e.target.checked)}
                className="rounded border-border bg-background text-primary focus:ring-primary/50 h-4 w-4"
              />
              <label htmlFor="victim-alive" className="text-xs text-foreground cursor-pointer select-none">
                Victim is alive
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isEditing ? 'Update Victim' : 'Add Victim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

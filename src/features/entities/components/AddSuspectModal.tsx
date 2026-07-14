import * as React from 'react';
import { useAddCrimeSuspectMutation, useUpdateCrimeSuspectMutation } from '@/services/crimeApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, UserPlus } from 'lucide-react';
import type { CrimeSuspect, CreateSuspectPayload } from '@/services/crimeApi';

interface AddSuspectModalProps {
  crimeId: string;
  existing?: CrimeSuspect | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const GENDERS = ['Male', 'Female', 'Other', 'Unknown'];

export function AddSuspectModal({ crimeId, existing, onClose, onSuccess }: AddSuspectModalProps) {
  const [addSuspect, { isLoading: isAdding }] = useAddCrimeSuspectMutation();
  const [updateSuspect, { isLoading: isUpdating }] = useUpdateCrimeSuspectMutation();

  const isEditing = !!existing;
  const isLoading = isAdding || isUpdating;

  const [form, setForm] = React.useState<Partial<CreateSuspectPayload>>({
    name: existing?.name ?? '',
    gender: existing?.gender ?? '',
    dob: '',
    phone: existing?.phone ?? '',
    address: existing?.address ?? '',
    district: existing?.district ?? '',
    knownAlias: existing?.knownAlias ?? '',
    reasonForSuspicion: existing?.reasonForSuspicion ?? '',
    notes: existing?.notes ?? '',
    photoUrl: existing?.photoUrl ?? '',
  });

  const setField = (k: keyof CreateSuspectPayload, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    try {
      if (isEditing && existing) {
        await updateSuspect({ crimeId, suspectId: existing.id, body: form }).unwrap();
        onSuccess('Suspect updated successfully.');
      } else {
        await addSuspect({ crimeId, body: form as CreateSuspectPayload }).unwrap();
        onSuccess('Suspect added to crime.');
      }
    } catch (err) {
      console.error('Suspect save failed:', err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            {isEditing ? 'Edit Suspect' : 'Add Suspect'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div className="col-span-2">
              <label className="admin-label">Full Name *</label>
              <Input
                value={form.name ?? ''}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Suspect's full name"
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
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* DOB */}
            <div>
              <label className="admin-label">Date of Birth</label>
              <Input
                type="date"
                value={form.dob ?? ''}
                onChange={(e) => setField('dob', e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="admin-label">Phone</label>
              <Input
                value={form.phone ?? ''}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="Contact number"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* District */}
            <div>
              <label className="admin-label">District</label>
              <Input
                value={form.district ?? ''}
                onChange={(e) => setField('district', e.target.value)}
                placeholder="Known district"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="admin-label">Address</label>
              <Input
                value={form.address ?? ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Known address"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Known Alias */}
            <div>
              <label className="admin-label">Known Alias</label>
              <Input
                value={form.knownAlias ?? ''}
                onChange={(e) => setField('knownAlias', e.target.value)}
                placeholder="Alias or nickname"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label className="admin-label">Photo URL</label>
              <Input
                value={form.photoUrl ?? ''}
                onChange={(e) => setField('photoUrl', e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Reason for Suspicion */}
            <div className="col-span-2">
              <label className="admin-label">Reason for Suspicion *</label>
              <textarea
                rows={2}
                value={form.reasonForSuspicion ?? ''}
                onChange={(e) => setField('reasonForSuspicion', e.target.value)}
                placeholder="Why is this person a suspect?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-1"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="admin-label">Notes</label>
              <textarea
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Additional investigation notes..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-1"
              />
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isEditing ? 'Update Suspect' : 'Add Suspect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

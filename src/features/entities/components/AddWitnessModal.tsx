import * as React from 'react';
import { useAddCaseWitnessMutation, useUpdateCaseWitnessMutation } from '@/services/crimeApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, UserPlus } from 'lucide-react';
import type { CaseWitness, CreateWitnessPayload } from '@/services/crimeApi';

interface AddWitnessModalProps {
  incidentId: string;
  existing?: CaseWitness | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const GENDERS = ['Male', 'Female', 'Other'];
const WITNESS_TYPES = ['Eyewitness', 'Primary Witness', 'Expert Witness', 'Character Witness', 'Hostile Witness', 'Other'];

export function AddWitnessModal({ incidentId, existing, onClose, onSuccess }: AddWitnessModalProps) {
  const [addWitness, { isLoading: isAdding }] = useAddCaseWitnessMutation();
  const [updateWitness, { isLoading: isUpdating }] = useUpdateCaseWitnessMutation();

  const isEditing = !!existing;
  const isLoading = isAdding || isUpdating;

  const [form, setForm] = React.useState<Partial<CreateWitnessPayload>>({
    incident_id: incidentId,
    full_name: existing?.fullName ?? '',
    gender: existing?.gender ?? '',
    age: existing?.age,
    mobile_number: existing?.mobileNumber ?? '',
    email: existing?.email ?? '',
    address: existing?.address ?? '',
    occupation: existing?.occupation ?? '',
    witness_type: existing?.witnessType ?? 'Eyewitness',
    statement: existing?.statement ?? '',
  });

  const setField = (k: keyof CreateWitnessPayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name?.trim()) return;
    try {
      if (isEditing && existing) {
        await updateWitness({ id: existing.id, incidentId, body: form }).unwrap();
        onSuccess('Witness updated successfully.');
      } else {
        await addWitness({ ...form, incident_id: incidentId } as CreateWitnessPayload).unwrap();
        onSuccess('Witness added to case incident.');
      }
    } catch (err: any) {
      console.error('Witness save failed:', err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            {isEditing ? 'Edit Witness Details' : 'Add Witness to Case'}
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
                placeholder="Witness's full name"
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

            {/* Age */}
            <div>
              <label className="admin-label">Age</label>
              <Input
                type="number"
                value={form.age ?? ''}
                onChange={(e) => setField('age', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Years"
                className="h-8 text-xs mt-1"
              />
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
                placeholder="witness@example.com"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Witness Type */}
            <div>
              <label className="admin-label">Witness Type</label>
              <select
                value={form.witness_type ?? 'Eyewitness'}
                onChange={(e) => setField('witness_type', e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mt-1"
              >
                {WITNESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="admin-label">Occupation</label>
              <Input
                value={form.occupation ?? ''}
                onChange={(e) => setField('occupation', e.target.value)}
                placeholder="Occupation"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="admin-label">Address</label>
              <Input
                value={form.address ?? ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Residential or business address"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Statement */}
            <div className="col-span-2">
              <label className="admin-label">Witness Statement</label>
              <textarea
                rows={3}
                value={form.statement ?? ''}
                onChange={(e) => setField('statement', e.target.value)}
                placeholder="Enter recorded statement or testimony notes..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-1"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isEditing ? 'Update Witness' : 'Add Witness'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

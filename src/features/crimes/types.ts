/**
 * CrimeLens — Crimes Feature Types
 *
 * Re-exports from crimeApi for use within the feature module,
 * plus display-layer helpers and constants.
 */
export type {
  CrimeRecord,
  CrimeSuspect,
  CrimeEvidence,
  CrimeLegalSection,
  CrimeTimelineEvent,
  CrimeActivityLog,
  CrimeStatus,
  EvidenceType,
  SuspectStatus,
  CrimeFilters,
  CreateCrimePayload,
  UpdateCrimePayload,
  CreateSuspectPayload,
  CreateEvidencePayload,
  CreateLegalSectionPayload,
} from '@/services/crimeApi';

// ---------------------------------------------------------------------------
// Display Constants
// ---------------------------------------------------------------------------

export const CRIME_STATUS_STEPS: { value: import('@/services/crimeApi').CrimeStatus; label: string; shortLabel: string }[] = [
  { value: 'reported', label: 'Reported', shortLabel: 'Reported' },
  { value: 'under_investigation', label: 'Under Investigation', shortLabel: 'Investigating' },
  { value: 'suspects_identified', label: 'Suspects Identified', shortLabel: 'Suspects' },
  { value: 'evidence_collected', label: 'Evidence Collected', shortLabel: 'Evidence' },
  { value: 'charge_sheet_filed', label: 'Charge Sheet Filed', shortLabel: 'Charge Sheet' },
  { value: 'closed', label: 'Closed', shortLabel: 'Closed' },
];

export const CRIME_STATUS_COLORS: Record<string, string> = {
  reported: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  under_investigation: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  suspects_identified: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  evidence_collected: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  charge_sheet_filed: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  closed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export const SUSPECT_STATUS_COLORS: Record<string, string> = {
  detained: 'bg-red-500/15 text-red-400 border-red-500/30',
  released: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  wanted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  under_watch: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  promoted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export const EVIDENCE_VERIFICATION_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const CUSTODY_STATUS_COLORS: Record<string, string> = {
  intact: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  disputed: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  photo: 'Photo',
  video: 'Video',
  audio: 'Audio',
  weapon: 'Weapon',
  document: 'Document',
  fingerprint: 'Fingerprint',
  dna: 'DNA',
  blood_sample: 'Blood Sample',
  vehicle: 'Vehicle',
  mobile_phone: 'Mobile Phone',
  laptop: 'Laptop',
  email: 'Email',
  chat_screenshot: 'Chat Screenshot',
  transaction_receipt: 'Transaction Receipt',
  cctv_footage: 'CCTV Footage',
  gps_log: 'GPS Log',
  ip_log: 'IP Log',
  browser_history: 'Browser History',
  apk: 'APK',
  malware_sample: 'Malware Sample',
  other: 'Other',
};

export const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  serious: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  grievous: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const TIMELINE_EVENT_ICONS: Record<string, string> = {
  crime_registered: 'file-text',
  officer_assigned: 'shield',
  evidence_uploaded: 'paperclip',
  suspect_added: 'user-plus',
  status_updated: 'refresh-cw',
  charge_sheet_filed: 'file-check',
  note_added: 'pen-line',
  legal_section_added: 'scale',
  suspect_promoted: 'user-check',
};

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';
import { FilePlus2 } from 'lucide-react';

export interface ReportFormValues {
  title: string;
  type: string;
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  sections: string[];
  scheduled: boolean;
}

export interface ReportFormProps {
  onSubmit: (values: ReportFormValues) => void;
  isGenerating?: boolean;
}

const REPORT_TYPES = [
  { value: 'crime-summary', label: 'Crime Summary Report' },
  { value: 'risk-assessment', label: 'Sector Risk Assessment' },
  { value: 'hotspot-analysis', label: 'Geographic Hotspot Analysis' },
  { value: 'network-analysis', label: 'Criminal Syndicate Linkage' },
];

const SECTIONS = [
  { id: 'executive', label: 'Executive Overview' },
  { id: 'statistics', label: 'Statistical Breakdowns' },
  { id: 'hotspots', label: 'Hotspot Coordinates Mapping' },
  { id: 'associations', label: 'Network & Entity Links' },
];

export function ReportForm({ onSubmit, isGenerating = false }: ReportFormProps) {
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState('crime-summary');
  const [format, setFormat] = React.useState<'pdf' | 'csv' | 'xlsx' | 'json'>('pdf');
  const [sections, setSections] = React.useState<string[]>(['executive', 'statistics']);
  const [scheduled, setScheduled] = React.useState(false);

  const handleSectionToggle = (sectionId: string) => {
    setSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onSubmit({ title, type, format, sections, scheduled });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Report Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="report-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Report Title
        </label>
        <Input
          id="report-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q2 Sector 4 Incident Summary"
          required
          className="bg-card h-8"
        />
      </div>

      {/* Report Type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="report-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Report Scope / Type
        </label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="report-type" className="w-full bg-card h-8">
            <SelectValue placeholder="Select Report Type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sections selection */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Include Sections
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-card/50 p-2 border border-border rounded-md">
          {SECTIONS.map((sec) => (
            <div key={sec.id} className="flex items-center gap-2 px-1 py-1">
              <Checkbox
                id={`sec-${sec.id}`}
                checked={sections.includes(sec.id)}
                onCheckedChange={() => handleSectionToggle(sec.id)}
              />
              <label htmlFor={`sec-${sec.id}`} className="text-xs text-foreground cursor-pointer select-none">
                {sec.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Export Format */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Export Format
        </span>
        <RadioGroup
          value={format}
          onValueChange={(val) => setFormat(val as any)}
          className="flex flex-wrap gap-4"
        >
          {['pdf', 'csv', 'xlsx', 'json'].map((f) => (
            <div key={f} className="flex items-center gap-1.5">
              <RadioGroupItem value={f} id={`fmt-${f}`} />
              <label htmlFor={`fmt-${f}`} className="text-xs text-foreground uppercase cursor-pointer select-none font-semibold">
                {f}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Switch Toggle for Schedule */}
      <div className="flex items-center justify-between bg-card p-3 rounded-md border border-border">
        <div className="space-y-0.5">
          <label htmlFor="scheduled-switch" className="text-body-sm font-semibold text-foreground cursor-pointer">
            Auto-Schedule Report
          </label>
          <Typography variant="caption" color="muted" className="block">
            Generate and email weekly updates automatically.
          </Typography>
        </div>
        <Switch
          id="scheduled-switch"
          checked={scheduled}
          onCheckedChange={setScheduled}
        />
      </div>

      <Button type="submit" disabled={isGenerating} size="sm" className="w-full gap-1.5 mt-2">
        <Icon icon={FilePlus2} size="xs" />
        {isGenerating ? 'Compiling Report...' : 'Compile Document'}
      </Button>
    </form>
  );
}

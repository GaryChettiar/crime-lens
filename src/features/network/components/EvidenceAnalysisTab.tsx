import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, ChevronRight, FileUp, FolderOpen, Loader2, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCrimesByEvidencePathsQuery } from '@/services/crimeApi';

type EvidenceType = 'fingerprint' | 'footprint' | 'face';
type EvidenceMatch = { name?: string; criminal_id?: string; score: number; metadata?: { original_path?: string; filename?: string } };
type EvidenceItem = { id: string; evidenceType: EvidenceType; file: File; isConfirmed: boolean; isLoading: boolean; matches?: EvidenceMatch[]; error?: string };
type CrimeMatch = { path: string; crimes: Array<{ ROWID: string; title: string; id?: string; crimeNumber?: string }> };

const MODEL_URL = 'https://models-50043087097.development.catalystappsail.in/identify';
const MODEL_ADMIN_KEY = '7f1d6e82d9b149f5a1c0f3c87b92e4d61f8e3c5a9b7d2e1f';
const AFIS_URL = 'https://crimelens-60074096850.development.catalystserverless.in/server/fingerprintafis/execute';
const matchPath = (match: EvidenceMatch) => match.metadata?.original_path || match.name || match.criminal_id || '';

export function EvidenceAnalysisTab() {
  const [evidence, setEvidence] = React.useState<EvidenceItem[]>([]);
  const [selectedFileId, setSelectedFileId] = React.useState<string | null>(null);
  const [selectedMatchPath, setSelectedMatchPath] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputId = React.useId();

  const confirmedPaths = React.useMemo(() => {
    const paths = new Set<string>();
    evidence.forEach((item) => { if (item.isConfirmed) item.matches?.forEach((match) => { const path = matchPath(match); if (path) paths.add(path); }); });
    return Array.from(paths);
  }, [evidence]);
  const { data: analysisData, isFetching: isResolvingCrimes } = useGetCrimesByEvidencePathsQuery(confirmedPaths, { skip: confirmedPaths.length === 0 });
  const crimeMatches: CrimeMatch[] = analysisData?.success && Array.isArray(analysisData.data) ? analysisData.data : [];
  const activeFile = evidence.find((item) => item.id === selectedFileId);
  const activeMatch = activeFile?.matches?.find((match) => matchPath(match) === selectedMatchPath);
  const crimesForActiveMatch = activeMatch ? crimeMatches.filter((match) => match.path === matchPath(activeMatch)).flatMap((match) => match.crimes) : [];

  const addFiles = (files: File[]) => {
    const additions = files.map((file, index) => ({ id: `${Date.now()}-${index}-${file.name}`, evidenceType: 'fingerprint' as EvidenceType, file, isConfirmed: false, isLoading: false }));
    if (additions.length === 0) return;
    setEvidence((current) => [...current, ...additions]);
    setSelectedFileId(additions[0].id);
    setSelectedMatchPath(null);
  };

  const identify = async (item: EvidenceItem) => {
    setEvidence((current) => current.map((entry) => entry.id === item.id ? { ...entry, isLoading: true, error: undefined } : entry));
    try {
      let response: Response;
      if (item.evidenceType === 'fingerprint') {
        const bytes = new Uint8Array(await item.file.arrayBuffer());
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        response = await fetch(AFIS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'identify', filename: item.file.name, topN: 5, image: btoa(binary) }) });
      } else {
        const formData = new FormData();
        formData.append('image', item.file);
        response = await fetch(`${MODEL_URL}/${item.evidenceType}`, { method: 'POST', headers: { 'X-Admin-Key': MODEL_ADMIN_KEY }, body: formData });
      }
      if (!response.ok) throw new Error(`${item.evidenceType} identification failed`);
      const payload = await response.json();
      const matches = (payload?.matches ?? payload?.results ?? []) as EvidenceMatch[];
      setEvidence((current) => current.map((entry) => entry.id === item.id ? { ...entry, isLoading: false, isConfirmed: true, matches } : entry));
      setSelectedFileId(item.id);
      setSelectedMatchPath(matches[0] ? matchPath(matches[0]) : null);
    } catch (error) {
      setEvidence((current) => current.map((entry) => entry.id === item.id ? { ...entry, isLoading: false, isConfirmed: true, matches: [], error: error instanceof Error ? error.message : 'Identification failed' } : entry));
    }
  };

  const removeItem = (id: string) => {
    setEvidence((current) => current.filter((item) => item.id !== id));
    if (selectedFileId === id) { setSelectedFileId(null); setSelectedMatchPath(null); }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" />Upload Evidence for Analysis</CardTitle></CardHeader>
        <CardContent><div role="button" tabIndex={0} onClick={() => document.getElementById(inputId)?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') document.getElementById(inputId)?.click(); }} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(Array.from(event.dataTransfer.files)); }} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><FileUp className="h-7 w-7 mx-auto mb-2 text-muted-foreground" /><p className="text-xs font-medium text-foreground">Drag and drop evidence files here</p><p className="text-[11px] text-muted-foreground mt-1">or click to browse files</p><input id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} /></div></CardContent>
      </Card>

      {evidence.length > 0 && <Card className="bg-card border border-border shadow-sm"><CardHeader><CardTitle className="text-sm flex items-center gap-2"><FolderOpen className="h-4 w-4" />Evidence Analysis Results</CardTitle></CardHeader><CardContent><div className="flex gap-4 h-[28rem] overflow-hidden">
        <div className="w-1/4 border border-border rounded-lg flex flex-col bg-muted/10"><div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground">Uploaded Evidence ({evidence.length})</div><div className="flex-1 overflow-y-auto p-2 space-y-2">{evidence.map((item) => <div key={item.id} className={`rounded-md border p-2 ${selectedFileId === item.id ? 'border-primary bg-primary/5' : 'border-border'}`}><button className="w-full text-left flex items-center justify-between gap-1" onClick={() => { setSelectedFileId(item.id); setSelectedMatchPath(null); }}><span className="truncate text-xs text-foreground">{item.file.name}</span><ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" /></button><div className="flex items-center gap-1 mt-2"><select value={item.evidenceType} disabled={item.isConfirmed || item.isLoading} onChange={(event) => setEvidence((current) => current.map((entry) => entry.id === item.id ? { ...entry, evidenceType: event.target.value as EvidenceType } : entry))} className="h-6 min-w-0 flex-1 text-[10px] rounded border border-border bg-background text-foreground"><option value="fingerprint">Fingerprint</option><option value="face">Face</option><option value="footprint">Footprint</option></select><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-primary" disabled={item.isLoading} onClick={() => item.isConfirmed ? setEvidence((current) => current.map((entry) => entry.id === item.id ? { ...entry, isConfirmed: false, matches: undefined, error: undefined } : entry)) : void identify(item)} title={item.isConfirmed ? 'Edit evidence' : 'Identify and confirm'}>{item.isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}</Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)} title="Remove evidence"><Trash2 className="h-3 w-3" /></Button></div></div>)}</div></div>
        <div className="w-1/3 border border-border rounded-lg flex flex-col"><div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground">Identification Matches</div><div className="flex-1 overflow-y-auto p-2 space-y-2">{!activeFile ? <div className="p-4 text-xs text-muted-foreground text-center">Select an uploaded evidence file.</div> : activeFile.error ? <div className="p-4 text-xs text-destructive text-center">{activeFile.error}</div> : !activeFile.isConfirmed ? <div className="p-4 text-xs text-muted-foreground text-center">Identify and confirm this file to see matches.</div> : activeFile.matches?.length ? activeFile.matches.map((match) => { const path = matchPath(match); return <button key={path} onClick={() => setSelectedMatchPath(path)} className={`w-full text-left p-2 rounded border text-xs ${selectedMatchPath === path ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}><div className="truncate font-medium text-foreground">{match.metadata?.filename || match.name || match.criminal_id || path}</div><div className="flex justify-between text-[10px] text-muted-foreground"><span className="truncate">{path}</span><span>Score: {typeof match.score === 'number' ? match.score.toFixed(4) : match.score}</span></div></button>; }) : <div className="p-4 text-xs text-muted-foreground text-center"><AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />No matches found for this file.</div>}</div></div>
        <div className="flex-1 border border-border rounded-lg flex flex-col"><div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground">Related Crimes {isResolvingCrimes && <Loader2 className="inline h-3 w-3 animate-spin" />}</div><div className="flex-1 overflow-y-auto p-3 space-y-2">{!activeMatch ? <div className="text-xs text-muted-foreground text-center py-8">Select an identification match to view related crimes.</div> : crimesForActiveMatch.length === 0 ? <div className="text-xs text-muted-foreground text-center py-8"><AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />No related crimes found for this evidence.</div> : crimesForActiveMatch.map((crime) => <Link key={crime.ROWID} to={`/entities/crimes/${crime.ROWID || crime.id}`} target="_blank" className="block p-2 rounded-md bg-muted/30 border border-border hover:bg-muted/50"><p className="text-xs font-medium text-foreground truncate">{crime.crimeNumber || crime.title || 'Related crime'}</p><p className="text-[10px] text-muted-foreground mt-0.5">Crime ID: {crime.ROWID}</p></Link>)}</div></div>
      </div></CardContent></Card>}
    </div>
  );
}

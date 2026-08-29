"use client";

import * as React from 'react';
import { FolderOpen, Upload, ChevronRight, AlertCircle, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCrimesByEvidencePathsQuery } from '@/services/crimeApi';

interface UploadedEvidence {
  fileName: string;
  evidenceId: string;
  matches: {
    path: string;
    crimes: { ROWID: string; title: string }[];
  }[];
}

export function EvidenceAnalysisTab() {
  const [uploadedEvidence, setUploadedEvidence] = React.useState<UploadedEvidence[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Extract paths from uploaded evidence
  const paths = React.useMemo(() => {
    return uploadedEvidence.reduce((acc, ev) => {
      return acc.concat(ev.matches.map(m => m.path));
    }, [] as string[]);
  }, [uploadedEvidence]);

  // Fetch crimes by evidence paths
  const { data: analysisData } = useGetCrimesByEvidencePathsQuery(paths, {
    skip: paths.length === 0,
  });

  // Update matches with actual crime data
  React.useEffect(() => {
    if (!analysisData || !analysisData.data) return;

    setUploadedEvidence(prev => 
      prev.map(ev => ({
        ...ev,
        matches: ev.matches.map(match => ({
          ...match,
          crimes: (analysisData.data as Array<{ path: string; crimes: { ROWID: string; title: string }[] }>).find(d => d.path === match.path)?.crimes || [],
        })),
      }))
    );
  }, [analysisData]);

  const activeFile = uploadedEvidence.find((d) => d.fileName === selectedFile);
  const activeMatch = activeFile?.matches.find((m) => m.path === selectedMatch);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileName = file.name;
        const evidenceId = `ev-${Date.now()}-${idx}`;

        setUploadedEvidence(prev => [
          ...prev,
          {
            fileName,
            evidenceId,
            matches: [
              {
                path: `file://${fileName}`,
                crimes: [],
              },
            ],
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Evidence for Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drag and drop your evidence files here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              id="evidence-input"
            />
            <label htmlFor="evidence-input">
              <Button asChild variant="outline" size="sm" className="text-xs">
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {uploadedEvidence.length > 0 && (
        <Card className="bg-card border border-border shadow-sm flex-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Evidence Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-96 overflow-hidden">
              {/* Sidebar: Uploaded Files */}
              <div className="w-1/4 border border-border rounded-lg flex flex-col bg-muted/10">
                <div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Uploaded Evidence ({uploadedEvidence.length})
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {uploadedEvidence.map((item) => (
                    <button
                      key={item.evidenceId}
                      onClick={() => {
                        setSelectedFile(item.fileName);
                        setSelectedMatch(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                        selectedFile === item.fileName
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="truncate">{item.fileName}</span>
                      <ChevronRight className={`h-3 w-3 ${selectedFile === item.fileName ? 'opacity-100' : 'opacity-30'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle Column: Matches for the selected file */}
              <div className="w-1/3 border border-border rounded-lg flex flex-col">
                <div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Database Matches
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {!activeFile ? (
                    <div className="p-4 text-xs text-muted-foreground text-center">
                      Select an uploaded evidence file to view matches.
                    </div>
                  ) : activeFile.matches.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground text-center">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                      No matches found for this file.
                    </div>
                  ) : (
                    activeFile.matches.map((match) => (
                      <button
                        key={match.path}
                        onClick={() => setSelectedMatch(match.path)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                          selectedMatch === match.path
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="truncate text-[10px]">{match.path}</span>
                        <span className="text-[10px] opacity-70 ml-1">
                          {match.crimes.length} crime{match.crimes.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Crime Details for the selected match */}
              <div className="flex-1 border border-border rounded-lg flex flex-col">
                <div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Related Crimes
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {!activeMatch ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      Select a match to view related crimes.
                    </div>
                  ) : !activeFile ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No active file selected.
                    </div>
                  ) : (() => {
                    const matchData = activeFile.matches.find((m: any) => m.path === activeMatch);
                    return !matchData || matchData.crimes.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-8">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                        No related crimes found for this evidence.
                      </div>
                    ) : (
                      matchData.crimes.map((crime) => (
                        <div
                          key={crime.ROWID}
                          className="p-2 rounded-md bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <p className="text-xs font-medium text-foreground truncate">{crime.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Crime ID: {crime.ROWID}
                          </p>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {uploadedEvidence.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileUp className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm font-medium">No evidence uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload evidence files above to analyze and find related crimes
          </p>
        </div>
      )}
    </div>
  );
}

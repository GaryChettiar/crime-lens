import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout/AdminLayout";
import { FolderOpen, ArrowLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalStorageData {
  fileName: string;
  evidenceId: string;
  matches: {
    path: string;
    crimes: { ROWID: string; title: string }[];
  }[];
}

export function EvidenceMatchesPage() {
  const navigate = useNavigate();
  const [data, setData] = React.useState<LocalStorageData[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("currentEvidenceAnalysis");
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load evidence analysis data", err);
    }
  }, []);

  const activeFile = data.find((d) => d.fileName === selectedFile);
  const activeMatch = activeFile?.matches.find((m) => m.path === selectedMatch);

  return (
    <AdminLayout>
      <div className="flex flex-col h-full max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Evidence Analysis Matches
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review matching evidence from the database and explore related crimes.
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-sm">
            <AlertCircle className="h-10 w-10 mb-4 opacity-50" />
            <p>No evidence analysis data found.</p>
            <Button variant="link" onClick={() => navigate('/entities/crimes')} className="mt-2">
              Return to Crimes List
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden border border-border rounded-lg bg-card shadow-sm">
            {/* Sidebar: Uploaded Files */}
            <div className="w-1/4 border-r border-border flex flex-col bg-muted/10">
              <div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Uploaded Evidence
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {data.map((item) => (
                  <button
                    key={item.evidenceId}
                    onClick={() => {
                      setSelectedFile(item.fileName);
                      setSelectedMatch(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      selectedFile === item.fileName
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span className="truncate">{item.fileName}</span>
                    <ChevronRight className={`h-4 w-4 ${selectedFile === item.fileName ? "opacity-100" : "opacity-30"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Column: Matches for the selected file */}
            <div className="w-1/3 border-r border-border flex flex-col">
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
                    No matches found in the database.
                  </div>
                ) : (
                  activeFile.matches.map((match) => (
                    <button
                      key={match.path}
                      onClick={() => setSelectedMatch(match.path)}
                      className={`w-full text-left p-3 rounded-md border text-sm transition-colors flex flex-col gap-1 ${
                        selectedMatch === match.path
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium text-foreground truncate w-full" title={match.path}>
                        {match.path.split('/').pop() || match.path}
                      </div>
                      <div className="flex items-center justify-between text-xs w-full">
                        <span className="text-muted-foreground truncate w-3/4">{match.path}</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${match.crimes.length > 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                          {match.crimes.length} Crimes
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Area: Related Crimes */}
            <div className="flex-1 flex flex-col bg-background">
              <div className="p-3 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Related Crimes
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {!activeMatch ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Select a database match to view related crimes.
                  </div>
                ) : activeMatch.crimes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mb-3 opacity-20" />
                    No crimes linked to this evidence.
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                    {activeMatch.crimes.map((crime) => (
                      <div
                        key={crime.ROWID}
                        className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground leading-tight">
                              {crime.title || "Untitled Crime"}
                            </h3>
                            <span className="shrink-0 text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                              ID: {crime.ROWID}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigate(`/entities/crimes/${crime.ROWID}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Case
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

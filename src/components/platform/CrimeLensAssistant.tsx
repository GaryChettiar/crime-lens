import * as React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useAssistantContext } from '@/hooks/useAssistantContext';
import { cn } from '@/lib/utils';
import { useSendAiChatMessageMutation } from '@/services/aiChatApi';
import { getAiChatErrorMessage, normalizeAiChatResponse, type NormalizedAiChatResponse } from '@/utils/aiChatParser';
import { AlertCircle, Bot, Loader2, RefreshCw, Send, Sparkles, User, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  status: 'sending' | 'success' | 'error';
  content: string;
  aiType?: 'casual' | 'business' | 'error';
  businessData?: {
    district?: string;
    districtId?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
    crimeCount?: number;
    crimes?: Array<{
      id: string;
      crimeNumber: string;
      title: string;
      status: string;
      occurredAt: string;
    }>;
  };
  retryMessage?: string;
  createdAt: Date;
}

const SUGGESTIONS: Record<string, Array<{ label: string; query: string }>> = {
  dashboard: [
    { label: 'Show crimes in Bangalore Urban', query: 'Show me crimes for Bangalore Urban from 2025-2026.' },
    { label: 'Which district had the most crimes?', query: 'Which district had the most crimes in 2025?' },
  ],
  analytics: [
    { label: 'Show crime trends', query: 'Show me crime trends for Bengaluru Urban in 2025.' },
    { label: 'Compare districts', query: 'Compare Bangalore Urban and Mysuru crime trends for 2025.' },
  ],
  heatmap: [
    { label: 'Show hotspots', query: 'Show hotspot crime patterns in Bengaluru Urban.' },
    { label: 'High theft areas', query: 'Show me theft cases in Bangalore Urban.' },
  ],
  network: [
    { label: 'Find suspicious patterns', query: 'Find suspicious crime patterns in Bengaluru Urban.' },
    { label: 'Route analysis', query: 'Analyze crime routes in Belagavi for 2025.' },
  ],
  general: [
    { label: 'Show crimes in Bangalore Urban', query: 'Show me crimes for Bangalore Urban from 2025-2026.' },
    { label: 'Show theft cases', query: 'Show me theft cases in Bangalore Urban.' },
  ],
};

function formatDisplayDate(dateText?: string): string {
  if (!dateText) return '—';
  const value = new Date(dateText);
  if (Number.isNaN(value.getTime())) return dateText;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

function formatDisplayDateTime(dateText?: string): string {
  if (!dateText) return '—';
  const value = new Date(dateText);
  if (Number.isNaN(value.getTime())) return dateText;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return '—';
  if (!from) return `Until ${formatDisplayDate(to)}`;
  if (!to) return `From ${formatDisplayDate(from)}`;
  return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

function getLoadingCopy(index: number): string {
  const stages = ['Thinking...', 'Analyzing...', 'Preparing your answer...'];
  return stages[index % stages.length];
}

export function CrimeLensAssistant() {
  const context = useAssistantContext();
  const [sendAiChatMessage] = useSendAiChatMessageMutation();

  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingPhase, setLoadingPhase] = React.useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (isLoading) {
        setLoadingPhase((value) => value + 1);
      }
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const replaceAssistantMessage = React.useCallback((assistantId: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? updater(msg) : msg)));
  }, []);

  const sendMessage = React.useCallback(
    async (trimmedText: string, assistantId?: string, skipUserInsert = false) => {
      if (!trimmedText.trim() || isLoading) return;

      const trimmed = trimmedText.trim();

      if (!skipUserInsert) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          status: 'success',
          content: trimmed,
          createdAt: new Date(),
        };

        const assistantMessageId = `assistant-${Date.now() + 1}`;

        setMessages((prev) => [
          ...prev,
          userMessage,
          {
            id: assistantMessageId,
            role: 'assistant',
            status: 'sending',
            content: getLoadingCopy(0),
            createdAt: new Date(),
          },
        ]);

        setIsLoading(true);
        setLoadingPhase(0);

        try {
          const apiResponse = await sendAiChatMessage({ message: trimmed }).unwrap();
          const normalized = normalizeAiChatResponse(apiResponse) as NormalizedAiChatResponse;

          replaceAssistantMessage(assistantMessageId, (message) => ({
            ...message,
            status: 'success',
            aiType: normalized.type,
            content:
              normalized.type === 'casual'
                ? normalized.reply ?? 'Hey! I’m CrimeLens AI. How can I help?'
                : normalized.summary ?? 'Here are the latest CrimeLens results.',
            businessData:
              normalized.type === 'business'
                ? {
                    district: normalized.district,
                    districtId: normalized.districtId,
                    dateRange: normalized.dateRange,
                    crimeCount: normalized.crimeCount,
                    crimes: normalized.crimes,
                  }
                : undefined,
            createdAt: new Date(),
          }));
        } catch (error) {
          const messageText = getAiChatErrorMessage(error);
          replaceAssistantMessage(assistantMessageId, (message) => ({
            ...message,
            status: 'error',
            aiType: 'error',
            content: messageText,
            retryMessage: trimmed,
            createdAt: new Date(),
          }));
        } finally {
          setIsLoading(false);
        }

        return;
      }

      const retryAssistantId = assistantId ?? `assistant-${Date.now()}`;
      replaceAssistantMessage(retryAssistantId, (message) => ({
        ...message,
        status: 'sending',
        content: getLoadingCopy(0),
        aiType: 'error',
        retryMessage: trimmed,
        createdAt: new Date(),
      }));

      setIsLoading(true);
      setLoadingPhase(0);

      try {
        const apiResponse = await sendAiChatMessage({ message: trimmed }).unwrap();
        const normalized = normalizeAiChatResponse(apiResponse) as NormalizedAiChatResponse;

        replaceAssistantMessage(retryAssistantId, (message) => ({
          ...message,
          status: 'success',
          aiType: normalized.type,
          content:
            normalized.type === 'casual'
              ? normalized.reply ?? 'Hey! I’m CrimeLens AI. How can I help?'
              : normalized.summary ?? 'Here are the latest CrimeLens results.',
          businessData:
            normalized.type === 'business'
              ? {
                  district: normalized.district,
                  districtId: normalized.districtId,
                  dateRange: normalized.dateRange,
                  crimeCount: normalized.crimeCount,
                  crimes: normalized.crimes,
                }
              : undefined,
          retryMessage: undefined,
          createdAt: new Date(),
        }));
      } catch (error) {
        const messageText = getAiChatErrorMessage(error);
        replaceAssistantMessage(retryAssistantId, (message) => ({
          ...message,
          status: 'error',
          aiType: 'error',
          content: messageText,
          retryMessage: trimmed,
          createdAt: new Date(),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, replaceAssistantMessage],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const nextPrompt = inputText.trim();
    setInputText('');
    void sendMessage(nextPrompt, undefined, false);
  };

  const handleRetry = (assistantId: string, retryText: string) => {
    if (isLoading) return;
    void sendMessage(retryText, assistantId, true);
  };

  const renderAssistantBody = (message: ChatMessage) => {
    if (message.status === 'sending') {
      return (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse"
                style={{ animationDelay: `${dot * 140}ms` }}
              />
            ))}
          </div>
          <span>{getLoadingCopy(loadingPhase)}</span>
        </div>
      );
    }

    if (message.status === 'error') {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{message.content}</span>
          </div>
          {message.retryMessage && (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleRetry(message.id, message.retryMessage!)} aria-label="Retry AI request">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    if (message.aiType === 'casual') {
      return <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</p>;
    }

    if (message.aiType === 'business' && message.businessData) {
      const { district, dateRange, crimeCount, crimes = [] } = message.businessData;

      return (
        <div className="space-y-4 text-sm text-foreground">
          <p className="whitespace-pre-wrap leading-6">{message.content}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Crimes</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{crimeCount ?? crimes.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">District</div>
              <div className="mt-2 text-sm font-semibold leading-5">{district || 'Selected district'}</div>
            </div>
          </div>

          {dateRange && (
            <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              {formatDateRange(dateRange.from, dateRange.to)}
            </div>
          )}

          {crimeCount === 0 || crimes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">No crimes found</div>
              <div className="mt-1">No crime records were found for {district || 'the selected district'} during the selected period.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="border-b border-border bg-muted/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Crime Records
              </div>

              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-muted/10 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Crime #</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Occurred</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crimes.map((crime) => (
                      <tr key={crime.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 font-medium text-foreground">{crime.crimeNumber || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{crime.title || '—'}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full border border-border bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-foreground">
                            {crime.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDisplayDateTime(crime.occurredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    return <p className="whitespace-pre-wrap leading-6 text-foreground">{message.content}</p>;
  };

  const activeSuggestions = SUGGESTIONS[context] ?? SUGGESTIONS.general;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground shadow-2xl transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open CrimeLens AI assistant"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">AI Assistant</span>
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[92vw]  border-l border-border bg-background p-0" showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold text-foreground">CrimeLens AI</SheetTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" size="sm" className="h-5 px-1.5 text-[9px] uppercase tracking-[0.18em]">
                    {context}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close CrimeLens AI assistant" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          <div className="flex h-[calc(100%-112px)] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && !isLoading ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">CrimeLens AI</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Ask questions about crime data, districts, stations, and trends.
                  </p>
                  <div className="mt-4 w-full space-y-2">
                    {activeSuggestions.slice(0, 3).map((suggestion) => (
                      <button
                        key={suggestion.query}
                        type="button"
                        onClick={() => {
                          setInputText(suggestion.query);
                          void sendMessage(suggestion.query, undefined, false);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'assistant' && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl border px-3.5 py-2.5 shadow-sm',
                      message.role === 'user' ? 'border-primary/20 bg-primary text-primary-foreground rounded-br-md' : 'border-border bg-card text-foreground rounded-bl-md',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                      <span>{message.role === 'user' ? 'You' : 'CrimeLens AI'}</span>
                      {message.status === 'success' && <span>{message.createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
                    </div>

                    {renderAssistantBody(message)}
                  </div>

                  {message.role === 'user' && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-sm rounded-bl-md">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">CrimeLens AI</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{getLoadingCopy(loadingPhase)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card/60 px-3 py-3">
              <form onSubmit={handleSubmit} className="space-y-2">
                <Textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      if (!inputText.trim() || isLoading) return;
                      const nextPrompt = inputText.trim();
                      setInputText('');
                      void sendMessage(nextPrompt, undefined, false);
                    }
                  }}
                  placeholder="Ask CrimeLens AI..."
                  aria-label="Ask CrimeLens AI"
                  className="min-h-[44px] max-h-28 resize-none py-2.5 text-sm"
                  disabled={isLoading}
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {isLoading ? 'Working...' : 'Ready'}
                  </span>
                  <Button type="submit" size="sm" className="gap-2" disabled={!inputText.trim() || isLoading} aria-label="Send message to CrimeLens AI">
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default CrimeLensAssistant;

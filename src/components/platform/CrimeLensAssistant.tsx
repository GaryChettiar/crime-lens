import * as React from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useAssistantContext } from '@/hooks/useAssistantContext';
import { setDistrict, setCrimeTypes, setSeverities } from '@/store/slices/globalFiltersSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/atoms/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Send, Bot, User, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const CONTEXT_GREETINGS = {
  dashboard: "Welcome to the Tactical Command. I can assist you with district overview analytics, response queue backlogs, and recent incidents.",
  analytics: "I have loaded the Modularity Communities and Degree Centrality vectors. Ask me to compare district risks, analyze cybercrime spikes, or summarize anomalies.",
  heatmap: "Geospatial playback is active. I can adjust district boundaries on the canvas or retrieve public festival crowd threat correlations for you.",
  network: "The Syndicate Association Graph is online. Ask me to identify degree centrality hubs, highlight active smuggling networks, or inspect association paths.",
  general: "Hello, I am the CrimeLens Predictive Assistant. How can I help you navigate the intelligence dashboard?"
};

const SUGGESTIONS = {
  dashboard: [
    { label: "Show summary for Bangalore", query: "Show summary for Bangalore Urban", action: { type: 'setDistrict', value: 'Bangalore' } },
    { label: "List high risk areas", query: "List high risk districts", action: { type: 'setDistrict', value: null } },
  ],
  analytics: [
    { label: "Show cybercrime trends", query: "Analyze cybercrime spikes", action: { type: 'setCrimeType', value: 'cyber' } },
    { label: "Why did risk increase in Mysuru?", query: "Why did risk increase in Mysuru?", action: { type: 'setDistrict', value: 'Mysore' } },
  ],
  heatmap: [
    { label: "Show hotspots in Mysuru", query: "Show hotspots in Mysuru", action: { type: 'setDistrict', value: 'Mysore' } },
    { label: "Compare Bangalore and Belagavi", query: "Compare Bangalore and Belagavi", action: { type: 'compare', value: ['Bangalore', 'Belgaum'] } },
  ],
  network: [
    { label: "Show Belagavi smuggling ring", query: "Show Belagavi Smuggling Network details", action: { type: 'setDistrict', value: 'Belgaum' } },
    { label: "Highlight most connected suspects", query: "Identify degree centrality hubs", action: { type: 'setSeverity', value: 'critical' } },
  ]
};

const MOCK_ANSWERS: Record<string, string> = {
  "show summary for bangalore urban": "Bengaluru Urban displays an active risk score of 88/100, showing a 14.2% MoM escalation in crimes (primarily cyber-fraud and highway hijackings). Dispatched 12 patrol grids to high-footfall nodes. I've updated your global view to Bengaluru Urban.",
  "list high risk districts": "Active alerts indicate 5 High-Risk Districts in Karnataka: Bengaluru Urban (88/100), Belagavi (74/100), Kalaburagi (70/100), Mysuru (66/100), and Ballari (62/100). The most significant growth is digital cash transfer fraud in Bengaluru.",
  "analyze cybercrime spikes": "Cyber Crime has spiked 31.7% over 14 days, centered heavily in Bengaluru Urban and Hubballi. Degree centrality hubs identify shared CDR burner line +91 9845-00129 connecting three suspects. I've set your crime filter to Cyber Crime.",
  "why did risk increase in mysuru?": "Mysuru's risk score rose to 66% due to spatial clustering of nighttime thefts (22:00-02:00) coinciding with prep-work for local public events. Pre-emptive patrol grids have been deployed. I've set your district filter to Mysuru.",
  "show hotspots in mysuru": "Showing hotspots in Mysuru. Active sectors: Nazarbad, Kuvempunagar, and Vijayanagar. Historical theft risk is +28% due to high transit flow. I've centered your map view on Mysuru.",
  "compare bangalore and belagavi": "Comparing Bengaluru Urban (Risk: 88, 342 cases) vs Belagavi (Risk: 74, 198 cases). Bengaluru has 3x higher cybercrime density, while Belagavi shows abnormal property and highway robberies along the NH-48 corridor.",
  "show belagavi smuggling network details": "The Belagavi Smuggling Network contains 12 active nodes. Cross-border correlation models suggest contraband routes originating from Maharashtra. I've set your district context to Belagavi to inspect the active nodes.",
  "identify degree centrality hubs": "The highest degree centrality hubs are Suspect Sunil Gowda (12 links), CDR phone +91 9845-00129 (15 links), and RTO vehicle KA-03-MG-4581 (9 links). Sunil Gowda acts as the key organizer. I've highlighted critical association paths."
};

export function CrimeLensAssistant() {
  const dispatch = useAppDispatch();
  const context = useAssistantContext();

  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize with greeting based on context
  React.useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: CONTEXT_GREETINGS[context] || CONTEXT_GREETINGS.general,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [context]);

  // Scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const executeAction = (action: { type: string; value: any }) => {
    if (action.type === 'setDistrict') {
      dispatch(setDistrict(action.value));
    } else if (action.type === 'setCrimeType') {
      dispatch(setCrimeTypes(action.value ? [action.value] : []));
    } else if (action.type === 'setSeverity') {
      dispatch(setSeverities(action.value ? [action.value] : []));
    } else if (action.type === 'compare') {
      dispatch(setDistrict(action.value[0])); // Set first as focus
    }
  };

  const handleSendMessage = (text: string, action?: { type: string; value: any }) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    if (action) {
      executeAction(action);
    }

    // Simulate AI response
    setTimeout(() => {
      const queryKey = text.toLowerCase().trim();
      let answerText = "I have processed your query. I am reviewing the historical CAD databases and geospatial logs to compile the predictive risk forecasts for this request.";

      // Check for exact mock match
      for (const [key, ans] of Object.entries(MOCK_ANSWERS)) {
        if (queryKey.includes(key) || key.includes(queryKey)) {
          answerText = ans;
          
          // Perform automatic filter dispatches if the user typed it in
          if (key.includes('bangalore')) dispatch(setDistrict('Bangalore'));
          if (key.includes('mysuru')) dispatch(setDistrict('Mysore'));
          if (key.includes('belagavi')) dispatch(setDistrict('Belgaum'));
          if (key.includes('cybercrime')) dispatch(setCrimeTypes(['cyber']));
          break;
        }
      }

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  const activeSuggestions = SUGGESTIONS[context as keyof typeof SUGGESTIONS] || [];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group flex items-center justify-center border border-primary-foreground/15"
        aria-label="Open CrimeLens AI Assistant"
      >
        <Sparkles className="h-5 w-5 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
          AI Assistant
        </span>
      </button>

      {/* Slide-out Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-[380px] sm:w-[440px] border-l border-border bg-slate-950 p-0 flex flex-col h-full z-50"
          showCloseButton={false}
        >
          {/* Header */}
          <SheetHeader className="border-b border-border/80 p-4 bg-card/40 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded text-primary animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="font-bold text-sm flex items-center gap-1.5 text-foreground leading-none">
                  CrimeLens Assistant
                </SheetTitle>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" size="sm" className="bg-slate-900/60 text-[9px] uppercase tracking-wider py-0 font-sans font-bold">
                    Context: {context}
                  </Badge>
                  <span className="size-1 rounded-full bg-success animate-pulse" />
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Predictive Model v4</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer hover:bg-muted/10"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 max-w-[85%] animate-in fade-in duration-150",
                  msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center shrink-0 border",
                    msg.sender === 'user'
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-primary/10 border-primary/20 text-primary"
                  )}
                >
                  {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={cn(
                      "p-3 rounded-lg text-xs leading-relaxed border shadow-xs",
                      msg.sender === 'user'
                        ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                        : "bg-card text-foreground border-border rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-muted-foreground font-semibold block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center animate-pulse">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border text-muted-foreground p-2.5 rounded-lg rounded-tl-none text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>Synthesizing incident logs...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply suggestions bar */}
          {activeSuggestions.length > 0 && (
            <div className="p-3 border-t border-border/40 bg-muted/5 space-y-1.5">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-1 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Suggested Context Queries
              </span>
              <div className="flex flex-col gap-1.5">
                {activeSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug.query, sug.action)}
                    className="w-full text-left text-[10px] font-bold text-primary hover:text-foreground hover:bg-primary/10 border border-primary/25 bg-primary/5 rounded px-2.5 py-1.5 transition-all cursor-pointer flex items-center justify-between shrink-0"
                  >
                    <span>{sug.label}</span>
                    <Sparkles className="h-3 w-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input Form */}
          <div className="p-3 border-t border-border bg-card/30">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask about ${context} variables...`}
                className="text-xs h-8.5 focus:ring-1 focus:ring-primary"
                disabled={isTyping}
                aria-label="Assistant input query"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                size="icon"
                className="h-8.5 w-8.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-label="Send query"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default CrimeLensAssistant;

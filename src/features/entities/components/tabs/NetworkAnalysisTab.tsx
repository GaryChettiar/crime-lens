import * as React from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  useBuildNetworkGraphMutation,
  type CrimeNetworkNode,
  type CrimeNetworkEdge,
  type CrimeNetworkSummary,
} from '@/services/networkApi';
import { Button } from '@/components/ui/button';
import {
  GitBranch, RefreshCw, Loader2, AlertCircle,
  Users, ShieldAlert, FileText, Car, Tag, MapPin, Building2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Node colours per entity type
// ---------------------------------------------------------------------------
const NODE_META: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  incident:      { bg: '#ef4444', border: '#dc2626', text: '#fff', emoji: '⚠' },
  criminal:      { bg: '#f97316', border: '#ea580c', text: '#fff', emoji: '👤' },
  evidence:      { bg: '#8b5cf6', border: '#7c3aed', text: '#fff', emoji: '🗂' },
  vehicle:       { bg: '#06b6d4', border: '#0891b2', text: '#fff', emoji: '🚗' },
  alias:         { bg: '#eab308', border: '#ca8a04', text: '#000', emoji: '🏷' },
  biometric:     { bg: '#10b981', border: '#059669', text: '#fff', emoji: '👆' },
  district:      { bg: '#6366f1', border: '#4f46e5', text: '#fff', emoji: '📍' },
  policeStation: { bg: '#0ea5e9', border: '#0284c7', text: '#fff', emoji: '🏛' },
};

// ---------------------------------------------------------------------------
// Custom node component
// ---------------------------------------------------------------------------
function EntityNode({ data }: { data: { label: string; subtitle: string; type: string } }) {
  const meta = NODE_META[data.type] ?? { bg: '#6b7280', border: '#4b5563', text: '#fff', emoji: '●' };
  const isRoot = data.type === 'incident';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          background: meta.bg,
          borderColor: meta.border,
          color: meta.text,
          boxShadow: isRoot ? `0 0 0 3px white, 0 0 0 5px ${meta.border}` : undefined,
        }}
        className="flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2 min-w-[90px] max-w-[120px] cursor-pointer select-none transition-transform hover:scale-105"
      >
        <span className="text-lg leading-none">{meta.emoji}</span>
        <span
          className="text-[10px] font-bold mt-1 text-center leading-tight"
          style={{ color: meta.text }}
          title={data.label}
        >
          {data.label.length > 16 ? data.label.slice(0, 15) + '…' : data.label}
        </span>
        {data.subtitle && (
          <span
            className="text-[8px] mt-0.5 text-center leading-tight opacity-80 truncate max-w-[100px]"
            style={{ color: meta.text }}
            title={data.subtitle}
          >
            {data.subtitle.length > 18 ? data.subtitle.slice(0, 17) + '…' : data.subtitle}
          </span>
        )}
        <span
          className="text-[7px] mt-1 uppercase tracking-wide opacity-60 font-semibold"
          style={{ color: meta.text }}
        >
          {data.type}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

const nodeTypes = { entity: EntityNode };

// ---------------------------------------------------------------------------
// Layout: radial tiers around a centre root
// ---------------------------------------------------------------------------
function computeLayout(
  rawNodes: CrimeNetworkNode[],
  rawEdges: CrimeNetworkEdge[],
): { nodes: Node[]; edges: Edge[] } {
  // De-duplicate by id
  const nodeMap = new Map<string, CrimeNetworkNode>();
  for (const n of rawNodes) nodeMap.set(n.id, n);
  const uniqueNodes = Array.from(nodeMap.values());

  // Find root (incident type is centre)
  const root = uniqueNodes.find(n => n.type === 'incident') ?? uniqueNodes[0];
  if (!root) return { nodes: [], edges: [] };

  // Group non-root nodes by type for tiered radial layout
  const groups: Record<string, CrimeNetworkNode[]> = {};
  for (const n of uniqueNodes) {
    if (n.id === root.id) continue;
    (groups[n.type] ??= []).push(n);
  }

  const CX = 0;
  const CY = 0;
  const flowNodes: Node[] = [];
  const TIER_GAP = 220;

  // Root at centre
  flowNodes.push({
    id: root.id,
    type: 'entity',
    position: { x: CX, y: CY },
    data: { label: root.label, subtitle: root.subtitle ?? '', type: root.type },
    draggable: true,
  });

  // Each type forms a ring
  const typeList = Object.keys(groups);
  typeList.forEach((type, ti) => {
    const tier = ti + 1;
    const members = groups[type];
    const radius = tier * TIER_GAP;
    const angleStep = (2 * Math.PI) / members.length;
    const offset = (ti * Math.PI) / typeList.length; // rotate each ring slightly
    members.forEach((n, i) => {
      const angle = i * angleStep + offset;
      flowNodes.push({
        id: n.id,
        type: 'entity',
        position: { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) },
        data: { label: n.label, subtitle: n.subtitle ?? '', type: n.type },
        draggable: true,
      });
    });
  });

  // De-duplicate edges
  const edgeMap = new Map<string, CrimeNetworkEdge>();
  for (const e of rawEdges) {
    const key = `${e.source}__${e.target}`;
    if (!edgeMap.has(key)) edgeMap.set(key, e);
  }

  const flowEdges: Edge[] = Array.from(edgeMap.values()).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: (e as any).relationship ?? e.label ?? '',
    labelStyle: { fontSize: 8, fill: '#9ca3af' },
    labelBgStyle: { fill: 'transparent' },
    style: { stroke: '#6b7280', strokeWidth: 1.2, strokeOpacity: 0.6 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280', width: 10, height: 10 },
    animated: false,
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

// ---------------------------------------------------------------------------
// Summary pill icons
// ---------------------------------------------------------------------------
const SUMMARY_ICONS: Record<keyof CrimeNetworkSummary, React.ElementType> = {
  criminals:     Users,
  incidents:     ShieldAlert,
  evidence:      FileText,
  vehicles:      Car,
  aliases:       Tag,
  districts:     MapPin,
  policeStations: Building2,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface NetworkAnalysisTabProps {
  crimeId: string;
  crimeNumber: string;
}

export function NetworkAnalysisTab({ crimeId, crimeNumber }: NetworkAnalysisTabProps) {
  const [buildGraph, { isLoading, data, error }] = useBuildNetworkGraphMutation();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selected, setSelected] = React.useState<CrimeNetworkNode | null>(null);

  // raw deduplicated source data for the detail panel
  const uniqueNodes = React.useMemo(() => {
    if (!data?.data?.nodes) return [];
    const map = new Map<string, CrimeNetworkNode>();
    for (const n of data.data.nodes) map.set(n.id, n);
    return Array.from(map.values());
  }, [data]);

  const uniqueEdges = React.useMemo(() => {
    if (!data?.data?.edges) return [];
    const map = new Map<string, CrimeNetworkEdge>();
    for (const e of data.data.edges) {
      const key = `${e.source}__${e.target}`;
      if (!map.has(key)) map.set(key, e);
    }
    return Array.from(map.values());
  }, [data]);

  // Fetch on mount
  React.useEffect(() => {
    buildGraph({ root: { type: 'incident', id: crimeId } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crimeId]);

  // Re-layout whenever API data changes
  React.useEffect(() => {
    if (!data?.data) return;
    const { nodes: fn, edges: fe } = computeLayout(data.data.nodes, data.data.edges);
    setNodes(fn);
    setEdges(fe);
    setSelected(null);
  }, [data, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = React.useCallback((_evt, node) => {
    const raw = uniqueNodes.find(n => n.id === node.id);
    setSelected(prev => prev?.id === node.id ? null : (raw ?? null));
  }, [uniqueNodes]);

  const summary: CrimeNetworkSummary | undefined = data?.data?.summary;

  const handleRebuild = () => buildGraph({ root: { type: 'incident', id: crimeId } });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Network Analysis</p>
            <p className="text-xs text-muted-foreground font-mono">Root: {crimeNumber}</p>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1.5" disabled={isLoading} onClick={handleRebuild}>
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Rebuild
        </Button>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(summary) as Array<keyof CrimeNetworkSummary>).map(key => {
            const count = summary[key];
            if (!count) return null;
            const Icon = SUMMARY_ICONS[key];
            return (
              <span key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 text-[11px] font-medium text-foreground">
                <Icon className="h-3 w-3 text-muted-foreground" />
                {count} {key}
              </span>
            );
          })}
        </div>
      )}

      {/* Graph area */}
      <div className="relative rounded-xl border border-border/60 overflow-hidden bg-[#0f1117]" style={{ height: 560 }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Building network graph…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-foreground">Failed to load network</p>
            <p className="text-xs text-muted-foreground">Could not connect to the network analysis service.</p>
            <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={handleRebuild}>Retry</Button>
          </div>
        )}

        {!isLoading && !error && nodes.length === 0 && data && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <GitBranch className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No network data found for this incident.</p>
          </div>
        )}

        {nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ animated: false }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e2130" gap={20} size={1} />
          </ReactFlow>
        )}
      </div>

      {/* Node detail panel */}
      {selected && (() => {
        const meta = NODE_META[selected.type] ?? { bg: '#6b7280', border: '#4b5563', emoji: '●' };
        const connections = uniqueEdges.filter(
          e => e.source === selected.id || e.target === selected.id
        );
        return (
          <div className="bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm space-y-3">
            {/* Node identity */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: meta.bg + '28', border: `1px solid ${meta.border}60` }}
                >
                  {meta.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selected.label}</p>
                  {selected.subtitle && (
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-xs" title={selected.subtitle}>
                      {selected.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <span
                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize"
                style={{ background: meta.bg + '20', borderColor: meta.border + '60', color: meta.bg }}
              >
                {selected.type}
              </span>
            </div>

            {/* Properties */}
            {selected.properties && Object.keys(selected.properties).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(selected.properties)
                  .filter(([, v]) => v !== null && v !== undefined)
                  .map(([k, v]) => (
                    <div key={k} className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{String(v)}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Connections */}
            {connections.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Connections ({connections.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {connections.map(e => {
                    const otherId = e.source === selected.id ? e.target : e.source;
                    const other = uniqueNodes.find(n => n.id === otherId);
                    if (!other) return null;
                    const om = NODE_META[other.type] ?? { bg: '#6b7280', border: '#4b5563', emoji: '●' };
                    const rel = (e as any).relationship ?? e.label ?? '';
                    return (
                      <button
                        key={e.id ?? otherId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] text-foreground hover:opacity-80 transition-opacity"
                        style={{ background: om.bg + '18', borderColor: om.border + '60' }}
                        onClick={() => setSelected(other)}
                      >
                        <span>{om.emoji}</span>
                        <span>{other.label.length > 20 ? other.label.slice(0, 19) + '…' : other.label}</span>
                        {rel && <span className="text-muted-foreground">· {rel}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(NODE_META).map(([type, s]) => (
          <span key={type}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium"
            style={{ borderColor: s.border + '80', background: s.bg + '20', color: s.text === '#fff' ? '#e5e7eb' : '#374151' }}>
            <span>{s.emoji}</span>{type}
          </span>
        ))}
      </div>
    </div>
  );
}

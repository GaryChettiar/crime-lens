import * as React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, Network, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useBuildNetworkGraphMutation } from '@/services/networkApi';

interface NetworkAnalysisTabProps {
  crimeId: string;
  crimeNumber: string;
}

function getNodeTypeColor(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized === 'incident') return { bg: '#ef4444', border: '#fca5a5', text: '#fff7f7' };
  if (normalized === 'criminal') return { bg: '#fff1d6', border: '#f7b267', text: '#7a4b16' };
  if (normalized === 'evidence') return { bg: '#e0f2fe', border: '#7dd3fc', text: '#0f172a' };
  if (normalized === 'vehicle') return { bg: '#dcfce7', border: '#86efac', text: '#14532d' };
  if (normalized === 'alias') return { bg: '#f3e8ff', border: '#c4b5fd', text: '#4c1d95' };
  if (normalized === 'policestation' || normalized === 'station') return { bg: '#e0e7ff', border: '#a5b4fc', text: '#312e81' };
  return { bg: '#f8fafc', border: '#cbd5e1', text: '#0f172a' };
}

function getNodePosition(nodeId: string, nodeType: string, layer: number, index: number, totalInLayer: number) {
  const centerX = 540;
  const centerY = 250;

  if (nodeType === 'incident') {
    return { x: centerX, y: centerY };
  }

  const angle = totalInLayer === 1 ? 0 : (index / totalInLayer) * Math.PI * 2;
  const radius = 160 + layer * 170;
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;

  return { x, y };
}

export function NetworkAnalysisTab({ crimeId, crimeNumber }: NetworkAnalysisTabProps) {
  const [buildGraph, { data: graphResponse, isLoading }] = useBuildNetworkGraphMutation();
  const [expandedNodeIds, setExpandedNodeIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!crimeId) return;
    buildGraph({ root: { type: 'incident', id: crimeId } });
  }, [buildGraph, crimeId]);

  const graphData = React.useMemo(() => {
    if (!graphResponse) return null;

    const payload = (graphResponse as any)?.data ?? graphResponse;
    const normalizedPayload =
      payload && typeof payload === 'object' && Array.isArray((payload as any).nodes)
        ? payload
        : payload && typeof payload === 'object' && 'data' in payload
          ? (payload as any).data
          : null;

    if (!normalizedPayload || !Array.isArray((normalizedPayload as any).nodes)) {
      return null;
    }

    const allowedTypes = new Set(['incident', 'criminal', 'evidence']);
    const filteredNodes = (normalizedPayload as any).nodes.filter((node: any) => {
      const type = String(node?.type ?? '').toLowerCase();
      return allowedTypes.has(type);
    });

    const filteredNodeIds = new Set(filteredNodes.map((node: any) => String(node.id)));
    const filteredEdges = (normalizedPayload as any).edges.filter((edge: any) => {
      const source = String(edge?.source ?? '');
      const target = String(edge?.target ?? '');
      return filteredNodeIds.has(source) && filteredNodeIds.has(target);
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    } as {
      nodes: Array<{ id: string; type: string; label?: string }>;
      edges: Array<{ id: string; source: string; target: string; label?: string }>;
    };
  }, [graphResponse]);

  const allNodes = React.useMemo(() => graphData?.nodes ?? [], [graphData]);
  const allEdges = React.useMemo(() => graphData?.edges ?? [], [graphData]);
  const rootNodeId = React.useMemo(() => {
    const preferred = `incident_${crimeId}`;
    if (allNodes.some((node) => String(node.id) === preferred)) return preferred;
    return allNodes.find((node) => String(node.type).toLowerCase() === 'incident')?.id ?? preferred;
  }, [allNodes, crimeId]);

  const adjacency = React.useMemo(() => {
    const map = new Map<string, string[]>();

    allEdges.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      map.set(source, [...(map.get(source) ?? []), target]);
      map.set(target, [...(map.get(target) ?? []), source]);
    });

    return map;
  }, [allEdges]);

  const layerMap = React.useMemo(() => {
    const map = new Map<string, number>();
    const queue: Array<{ id: string; depth: number }> = [{ id: rootNodeId, depth: 0 }];
    const seen = new Set<string>([rootNodeId]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      map.set(current.id, current.depth);

      const neighbors = adjacency.get(current.id) ?? [];
      neighbors.forEach((neighbor) => {
        if (seen.has(neighbor)) return;
        seen.add(neighbor);
        queue.push({ id: neighbor, depth: current.depth + 1 });
      });
    }

    return map;
  }, [adjacency, rootNodeId]);

  const visibleNodeIds = React.useMemo(() => {
    if (!rootNodeId) return new Set<string>();

    const visible = new Set<string>([rootNodeId]);
    const queue = [rootNodeId];

    while (queue.length > 0) {
      const currentId = queue.pop();
      if (!currentId) continue;

      if (!expandedNodeIds.has(currentId) && currentId !== rootNodeId) continue;

      const neighbors = adjacency.get(currentId) ?? [];
      neighbors.forEach((neighbor) => {
        if (!visible.has(neighbor)) {
          visible.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    return visible;
  }, [adjacency, expandedNodeIds, rootNodeId]);

  React.useEffect(() => {
    if (!allNodes.length) return;

    const nextExpanded = new Set<string>();
    allNodes.forEach((node) => {
      if (!node.id) return;
      const nodeId = String(node.id);
      if (nodeId === rootNodeId || (adjacency.get(nodeId)?.length ?? 0) > 0) {
        nextExpanded.add(nodeId);
      }
    });

    setExpandedNodeIds(nextExpanded);
  }, [adjacency, allNodes, rootNodeId]);

  const visibleNodes = React.useMemo(
    () => allNodes.filter((node) => visibleNodeIds.has(String(node.id))),
    [allNodes, visibleNodeIds],
  );

  const visibleEdges = React.useMemo(
    () => allEdges.filter(
      (edge) => visibleNodeIds.has(String(edge.source)) && visibleNodeIds.has(String(edge.target)),
    ),
    [allEdges, visibleNodeIds],
  );

  const toggleNodeCollapse = React.useCallback((nodeId: string) => {
    setExpandedNodeIds((current) => {
      if (nodeId === rootNodeId) return current;
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, [rootNodeId]);

  const flowNodes = React.useMemo<Node[]>(() => {
    const groups = new Map<number, Array<{ node: typeof allNodes[number]; index: number }>>();
    visibleNodes.forEach((node, index) => {
      const layer = layerMap.get(String(node.id)) ?? 0;
      const bucket = groups.get(layer) ?? [];
      bucket.push({ node, index });
      groups.set(layer, bucket);
    });

    return visibleNodes.map((node, index) => {
      const nodeId = String(node.id);
      const nodeType = String(node.type ?? 'unknown');
      const layer = layerMap.get(nodeId) ?? 0;
      const group = groups.get(layer) ?? [];
      const groupIndex = group.findIndex((entry) => entry.node.id === node.id);
      const totalInLayer = group.length;
      const position = getNodePosition(nodeId, nodeType, layer, groupIndex >= 0 ? groupIndex : index, totalInLayer || 1);
      const palette = getNodeTypeColor(nodeType);
      const isRoot = nodeId === rootNodeId;
      const isExpanded = expandedNodeIds.has(nodeId) || isRoot;

      const nodeLabel = (
        <div className="relative flex flex-col items-center gap-1 select-none text-center">
          <span className="drag-handle absolute -left-1 -top-1 flex h-4 w-4 cursor-grab items-center justify-center rounded border border-slate-300/80 bg-white/80 text-[8px] text-slate-500 shadow-sm active:cursor-grabbing">
            ⋮
          </span>
          {!isRoot && (
            <button
              type="button"
              aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded border border-white/30 bg-slate-900/25 text-[9px] text-white backdrop-blur-sm"
              onClick={(event) => {
                event.stopPropagation();
                toggleNodeCollapse(nodeId);
              }}
            >
              {isExpanded ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
            </button>
          )}
          <span className="max-w-[140px] truncate text-[10px] font-bold" title={node.label ?? node.id}>
            {node.label ?? node.id}
          </span>
          <span className="text-[8px] uppercase tracking-[0.12em] opacity-80">{nodeType}</span>
        </div>
      );

      return {
        id: nodeId,
        type: 'default',
        dragHandle: '.drag-handle',
        position,
        data: {
          label: nodeLabel,
          nodeType,
          isRoot,
        },
        style: {
          background: isRoot ? '#ef4444' : palette.bg,
          color: isRoot ? '#ffffff' : palette.text,
          border: `2px solid ${isRoot ? '#fca5a5' : palette.border}`,
          borderRadius: 14,
          width: isRoot ? 170 : 138,
          padding: '10px 12px',
          boxShadow: isRoot ? '0 0 0 5px rgba(239,68,68,0.18), 0 10px 20px rgba(239,68,68,0.12)' : '0 8px 18px rgba(15,23,42,0.08)',
          transition: 'all 0.2s ease',
        },
      } as Node;
    });
  }, [expandedNodeIds, layerMap, rootNodeId, toggleNodeCollapse, visibleNodes]);

  const flowEdges = React.useMemo<Edge[]>(() =>
    visibleEdges.map((edge) => ({
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      label: edge.label ?? 'related',
      style: { stroke: '#94a3b8', strokeWidth: 1.25, opacity: 0.8 },
      labelStyle: { fill: '#64748b', fontSize: 9 },
    })),
    [visibleEdges],
  );

  const hasGraph = allNodes.length > 0;

  return (
    <div className="space-y-4">
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Network className="h-4 w-4 text-primary" />
            {crimeNumber ? `Crime network: ${crimeNumber}` : 'Incident network'}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Root incident is shown first, with linked evidence, criminals, and shared matches from related crimes.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="h-[560px] w-full overflow-hidden rounded-lg border border-border bg-[#f5f7fb]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Building crime network…
              </div>
            ) : !hasGraph ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                No related evidence or criminal links were found for this crime.
              </div>
            ) : (
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.75) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                  backgroundColor: '#f5f7fb',
                }}
              >
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  fitView
                  fitViewOptions={{ padding: 0.25 }}
                  minZoom={0.2}
                  maxZoom={2}
                  nodesDraggable
                  elementsSelectable
                  proOptions={{ hideAttribution: true }}
                  className="h-full w-full"
                >
                  <Controls showInteractive={false} className="!bg-white !border !border-slate-200 !shadow-sm" />
                </ReactFlow>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

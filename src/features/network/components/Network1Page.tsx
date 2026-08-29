"use client"

import * as React from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetEntityOptionsQuery, useBuildNetworkGraphMutation } from '@/services/networkApi';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper to calculate concentric position stably for simple display
function getNodePosition(nodeId: string, nodeType: string, index: number) {
  const rawMatch = String(nodeId).match(/\d+/g);
  const numId = rawMatch ? Number(rawMatch[rawMatch.length - 1]) : (index + 1 || 1);
  let x = 0;
  let y = 0;

  if (nodeType === 'suspect' || nodeType === 'criminal') {
    const angle = (numId / 8) * 2 * Math.PI;
    x = Math.cos(angle) * 260;
    y = Math.sin(angle) * 260;
  } else if (nodeType === 'incident' || nodeType === 'crime') {
    const angle = (numId / 12) * 2 * Math.PI;
    x = Math.cos(angle) * 490;
    y = Math.sin(angle) * 490;
  } else if (nodeType === 'vehicle') {
    const angle = (numId / 12) * 2 * Math.PI;
    x = Math.cos(angle) * 700;
    y = Math.sin(angle) * 700;
  } else if (nodeType === 'evidence') {
    const angle = (numId / 10) * 2 * Math.PI;
    x = Math.cos(angle) * 920;
    y = Math.sin(angle) * 920;
  } else {
    const angle = (numId / 15) * 2 * Math.PI;
    x = Math.cos(angle) * 1150;
    y = Math.sin(angle) * 1150;
  }

  return { x: x + 1000, y: y + 1000 };
}

function GraphController({ nodesCount }: { nodesCount: number }) {
  const { fitView } = useReactFlow();

  React.useEffect(() => {
    if (nodesCount > 0) {
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.15 });
      }, 150);
    }
  }, [nodesCount, fitView]);

  return null;
}

export function Network1PageContent() {
  const { data: optionsData, isLoading: optionsLoading } = useGetEntityOptionsQuery();
  const [buildGraph, { data: graphResponse, isLoading: isGraphLoading }] = useBuildNetworkGraphMutation();

  const [entityType, setEntityType] = React.useState<string>('criminal');
  const [entityId, setEntityId] = React.useState<string>('');
  const [collapsedNodeIds, setCollapsedNodeIds] = React.useState<Set<string>>(new Set());

  const graphData = React.useMemo(() => {
    const payload = graphResponse?.data ?? graphResponse;
    if (!payload || typeof payload !== 'object') return null;

    if (Array.isArray((payload as { nodes?: unknown }).nodes)) {
      return payload as { nodes: Array<{ id: string; type: string; label?: string }> ; edges: Array<{ id: string; source: string; target: string }> };
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      const nested = (payload as { data?: unknown }).data;
      if (nested && typeof nested === 'object' && 'nodes' in nested) {
        return nested as { nodes: Array<{ id: string; type: string; label?: string }> ; edges: Array<{ id: string; source: string; target: string }> };
      }
    }

    return null;
  }, [graphResponse]);

  const normalizedNodes = React.useMemo(
    () => (Array.isArray(graphData?.nodes) ? graphData.nodes : []),
    [graphData],
  );
  const normalizedEdges = React.useMemo(
    () => (Array.isArray(graphData?.edges) ? graphData.edges : []),
    [graphData],
  );

  const currentOptions = React.useMemo(() => {
    if (!optionsData?.data) return [];
    if (entityType === 'criminal') {
      return [
        ...(optionsData.data.criminals ?? []).map((item) => ({ ...item, type: 'criminal' as const })),
        ...(optionsData.data.suspects ?? []).map((item) => ({ ...item, type: 'suspect' as const })),
      ];
    }
    if (entityType === 'vehicle') return (optionsData.data.vehicles ?? []).map((item) => ({ ...item, type: 'vehicle' as const }));
    if (entityType === 'evidence') return (optionsData.data.evidences ?? []).map((item) => ({ ...item, type: 'evidence' as const }));
    return [];
  }, [optionsData, entityType]);

  const selectedEntity = currentOptions.find((option) => option.id === entityId) ?? null;

  const handleGenerate = () => {
    const selectedOption = currentOptions.find((option) => option.id === entityId) ?? null;
    const rootType = selectedOption?.type ?? entityType;

    if (rootType && entityId) {
      buildGraph({ root: { type: rootType, id: entityId } });
    }
  };

  const rootNodeIds = React.useMemo(() => {
    const rootType = selectedEntity?.type ?? entityType;
    const ids = new Set<string>([String(entityId), `${rootType}_${entityId}`]);
    if (entityId) ids.add(String(entityId));
    return ids;
  }, [entityId, entityType, selectedEntity]);

  const adjacency = React.useMemo(() => {
    const map = new Map<string, string[]>();
    normalizedEdges.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      map.set(source, [...(map.get(source) ?? []), target]);
      map.set(target, [...(map.get(target) ?? []), source]);
    });
    return map;
  }, [normalizedEdges]);

  const hiddenNodeIds = React.useMemo(() => {
    const hidden = new Set<string>();
    const queue = Array.from(collapsedNodeIds);

    while (queue.length > 0) {
      const current = queue.pop();
      if (!current || hidden.has(current)) continue;
      hidden.add(current);
      const children = adjacency.get(current) ?? [];
      children.forEach((child) => {
        if (!hidden.has(child)) queue.push(child);
      });
    }

    return hidden;
  }, [adjacency, collapsedNodeIds]);

  const visibleNodes = React.useMemo(
    () => normalizedNodes.filter((node) => !hiddenNodeIds.has(String(node.id)) || collapsedNodeIds.has(String(node.id))),
    [collapsedNodeIds, hiddenNodeIds, normalizedNodes],
  );

  const visibleEdges = React.useMemo(
    () => normalizedEdges.filter((edge) => !hiddenNodeIds.has(String(edge.source)) && !hiddenNodeIds.has(String(edge.target))),
    [hiddenNodeIds, normalizedEdges],
  );

  const toggleNodeCollapse = (nodeId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const reactFlowNodes = React.useMemo(() => {
    if (!visibleNodes.length) return [];
    return visibleNodes.map((node, index) => {
      const nodeType = typeof node.type === 'string' ? node.type : 'unknown';
      let border = '1.5px solid #475569';
      if (nodeType === 'criminal') border = '1.5px solid #F43F5E';
      if (nodeType === 'suspect') border = '1.5px solid #FB7185';
      if (nodeType === 'incident' || nodeType === 'crime') border = '1.5px solid #F59E0B';
      if (nodeType === 'vehicle') border = '1.5px solid #10B981';
      if (nodeType === 'evidence') border = '1.5px solid #3B82F6';

      const isRoot = rootNodeIds.has(String(node.id));
      if (isRoot) border = '3px solid #ffffff';
      const isCollapsed = collapsedNodeIds.has(String(node.id));

      return {
        id: String(node.id),
        draggable: true,
        position: getNodePosition(String(node.id), nodeType, index),
        data: {
          label: (
            <div className="flex flex-col items-center gap-1 select-none">
              <button
                type="button"
                className="absolute right-1 top-1 rounded border border-white/20 bg-black/20 px-1 text-[8px] leading-none text-foreground"
                onClick={(event) => toggleNodeCollapse(String(node.id), event)}
                title={isCollapsed ? 'Expand node' : 'Collapse node'}
              >
                {isCollapsed ? '+' : '−'}
              </button>
              <span className="font-bold text-[10px] truncate max-w-[110px] text-foreground pr-4">
                {node.label || node.id}
              </span>
              <span className="text-[8px] opacity-75 font-semibold uppercase tracking-wider">
                {nodeType}
              </span>
            </div>
          ),
        },
        style: {
          background: isRoot ? 'var(--color-primary)' : 'hsl(var(--card))',
          color: isRoot ? '#ffffff' : 'hsl(var(--card-foreground))',
          border,
          borderRadius: '6px',
          boxShadow: isRoot ? '0 0 15px rgba(59, 130, 246, 0.8)' : 'none',
          padding: '6px',
          width: 130,
        },
      };
    });
  }, [collapsedNodeIds, rootNodeIds, visibleNodes]);

  const reactFlowEdges = React.useMemo(() => {
    if (!visibleEdges.length) return [];
    return visibleEdges.map((edge) => ({
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
      style: {
        stroke: '#818CF8',
        strokeWidth: 2,
        opacity: 0.75,
      },
    }));
  }, [visibleEdges]);

  return (
    <DashboardLayout title="Entity Network Analysis">
      <div className="space-y-4 max-w-7xl mx-auto pb-12 px-4 flex flex-col min-h-[90vh]">
        <Card className="bg-card border border-border shadow-sm shrink-0">
          <CardHeader>
            <CardTitle>Select Root Entity</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-center">
            <Select value={entityType} onValueChange={(val) => { setEntityType(val); setEntityId(''); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityId} onValueChange={setEntityId} disabled={optionsLoading || !currentOptions.length}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder={
                  optionsLoading
                    ? 'Loading...'
                    : entityType === 'criminal'
                      ? 'Select Criminal or Suspect'
                      : 'Select Specific Entity'
                } />
              </SelectTrigger>
              <SelectContent>
                {currentOptions.map((opt) => (
                  <SelectItem key={`${opt.type ?? entityType}-${opt.id}`} value={opt.id}>
                    {opt.type === 'suspect' ? 'Suspect: ' : ''}
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleGenerate} disabled={!entityId || isGraphLoading}>
              {isGraphLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Graph
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm flex-1 overflow-hidden relative min-h-[600px]">
          {visibleNodes.length > 0 ? (
            <div className="relative h-[600px] w-full min-w-0" style={{ width: '100%', height: '600px' }}>
              <ReactFlow
                nodes={reactFlowNodes}
                edges={reactFlowEdges}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.15}
                maxZoom={2.5}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                attributionPosition="bottom-right"
                className="h-full w-full"
                style={{ width: '100%', height: '100%' }}
              >
                <Background color="#334155" gap={16} />
                <Controls className="bg-card border-border text-foreground fill-foreground" />
                <GraphController nodesCount={reactFlowNodes.length} />
              </ReactFlow>
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center text-sm text-muted-foreground">
              {isGraphLoading ? 'Generating network graph...' : 'Select an entity and generate the graph.'}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function Network1Page() {
  return (
    <ReactFlowProvider>
      <Network1PageContent />
    </ReactFlowProvider>
  );
}

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
  const numId = parseInt(nodeId.split('-')[1]) || index || 1;
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

  return { x: x + 1500, y: y + 1500 };
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

  const graphData = React.useMemo(() => {
    const payload = graphResponse?.data ?? graphResponse;
    return payload && typeof payload === 'object' && 'nodes' in payload ? payload : null;
  }, [graphResponse]);

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

  const reactFlowNodes = React.useMemo(() => {
    if (!graphData?.nodes) return [];
    return graphData.nodes.map((node, index) => {
      let border = '1.5px solid #475569';
      if (node.type === 'criminal') border = '1.5px solid #F43F5E';
      if (node.type === 'suspect') border = '1.5px solid #FB7185';
      if (node.type === 'incident') border = '1.5px solid #F59E0B';
      if (node.type === 'vehicle') border = '1.5px solid #10B981';
      if (node.type === 'evidence') border = '1.5px solid #3B82F6';

      const rootType = selectedEntity?.type ?? entityType;
      const isRoot = node.id === `${rootType}_${entityId}`;
      if (isRoot) border = '3px solid #ffffff';

      return {
        id: node.id,
        position: getNodePosition(node.id, node.type, index),
        data: {
          label: (
            <div className="flex flex-col items-center gap-1 select-none">
              <span className="font-bold text-[10px] truncate max-w-[110px] text-foreground">
                {node.label || node.id}
              </span>
              <span className="text-[8px] opacity-75 font-semibold uppercase tracking-wider">
                {node.type}
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
  }, [graphResponse, entityType, entityId]);

  const reactFlowEdges = React.useMemo(() => {
    if (!graphData?.edges) return [];
    return graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: {
        stroke: '#818CF8',
        strokeWidth: 2,
        opacity: 0.75,
      },
    }));
  }, [graphData]);

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
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#334155" gap={16} />
            <Controls className="bg-card border-border text-foreground fill-foreground" />
            <GraphController nodesCount={reactFlowNodes.length} />
          </ReactFlow>
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

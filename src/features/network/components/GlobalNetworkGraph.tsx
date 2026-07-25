"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { useGetCurrentUserQuery } from "@/services/authApi";
import {
  useGetGlobalNetworkGraphQuery,
  type GlobalNetworkGraphParams,
  type GlobalNetworkNode,
  type GlobalNetworkEdge,
} from "@/services/networkApi";
import { Loader2, ArrowLeft, RefreshCw, Info } from "lucide-react";

const TYPE_STYLES: Record<
  string,
  { background: string; border: string; color: string }
> = {
  STATE: { background: "#0f172a", border: "#818cf8", color: "#e0e7ff" },
  DISTRICT: { background: "#1e293b", border: "#38bdf8", color: "#dbeafe" },
  STATION: { background: "#0f172a", border: "#38bdf8", color: "#f8fafc" },
  policeStation: { background: "#0f172a", border: "#38bdf8", color: "#f8fafc" },
  incident: { background: "#7c2d12", border: "#f97316", color: "#ffedd5" },
  criminal: { background: "#881337", border: "#ec4899", color: "#fce7f3" },
  vehicle: { background: "#0f766e", border: "#2dd4bf", color: "#d1fae5" },
  alias: { background: "#78350f", border: "#f59e0b", color: "#fffbeb" },
  evidence: { background: "#4b5563", border: "#94a3b8", color: "#e2e8f0" },
};

function parseNumericSuffix(id: string) {
  const match = id.match(/(\d+)$/);
  if (!match) return 1;
  return Number(match[1]) || 1;
}

function calculateLayout(nodes: GlobalNetworkNode[]) {
  const groups: Record<string, GlobalNetworkNode[]> = {};
  const order = [
    "STATE",
    "DISTRICT",
    "STATION",
    "policeStation",
    "incident",
    "criminal",
    "vehicle",
    "alias",
    "evidence",
  ];

  for (const node of nodes) {
    const group = order.includes(node.type) ? node.type : "unknown";
    (groups[group] ||= []).push(node);
  }

  const center = { x: 1200, y: 1200 };
  const radiusStep = 180;
  const nodePositions: Record<string, { x: number; y: number }> = {};

  order.forEach((type, tierIndex) => {
    const members = groups[type] || [];
    if (members.length === 0) return;
    const radius = (tierIndex + 1) * radiusStep;
    const angleStep = (2 * Math.PI) / members.length;
    const offset = (tierIndex * Math.PI) / Math.max(1, order.length);

    members.forEach((node, index) => {
      const angle = index * angleStep + offset;
      nodePositions[node.id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
  });

  if (nodes.length === 1) {
    nodePositions[nodes[0].id] = center;
  }

  return nodePositions;
}

function buildFlowNodes(nodes: GlobalNetworkNode[], selectedId: string | null) {
  const positions = calculateLayout(nodes);
  return nodes.map((node) => {
    const style = TYPE_STYLES[node.type] ?? {
      background: "#111827",
      border: "#475569",
      color: "#f8fafc",
    };
    const isSelected = selectedId === node.id;

    return {
      id: node.id,
      type: "default",
      position: positions[node.id] ?? { x: 1200, y: 1200 },
      data: {
        label: node.label,
        subtitle: node.type,
      },
      style: {
        background: style.background,
        border: `2px solid ${isSelected ? "#ffffff" : style.border}`,
        color: style.color,
        padding: 12,
        width: 180,
        borderRadius: 16,
        boxShadow: isSelected
          ? "0 0 0 4px rgba(148, 163, 184, 0.35)"
          : undefined,
      },
    };
  });
}

function buildFlowEdges(edges: GlobalNetworkEdge[]) {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "default",
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 10,
      height: 8,
    },
    label: edge.label ?? edge.relationship ?? "",
    style: {
      stroke: "#94a3b8",
      strokeWidth: 1.2,
      opacity: 0.8,
    },
    labelStyle: {
      fill: "#cbd5e1",
      fontSize: 9,
      pointerEvents: "none" as const,
    },
  }));
}

export function GlobalNetworkGraph() {
  const { data: currentUser, isLoading: userLoading } =
    useGetCurrentUserQuery();
  const [selectedNode, setSelectedNode] =
    React.useState<GlobalNetworkNode | null>(null);
  const [history, setHistory] = React.useState<
    Array<{ level?: string; nodeId?: string; label: string }>
  >([]);
  const [activeParams, setActiveParams] =
    React.useState<GlobalNetworkGraphParams>({});

  const queryWithRole = React.useCallback(
    (params: GlobalNetworkGraphParams): GlobalNetworkGraphParams | null => {
      if (!currentUser) return null;
      const payload: GlobalNetworkGraphParams = { ...params };
      if (currentUser.role === "DISTRICT_COMMANDER") {
        payload.districtId = currentUser.districtId ?? undefined;
      } else if (currentUser.role === "STATION_COMMANDER") {
        payload.stationId = currentUser.stationId ?? undefined;
      }
      return payload;
    },
    [currentUser],
  );

  const queryParams = React.useMemo(
    () => queryWithRole(activeParams),
    [activeParams, queryWithRole],
  );
  const { data, isLoading, error } = useGetGlobalNetworkGraphQuery(
    queryParams ?? undefined,
    {
      skip: !queryParams,
    },
  );

  const loadGraph = React.useCallback(
    (params: GlobalNetworkGraphParams, label?: string) => {
      const query = queryWithRole(params);
      if (!query) return;
      setSelectedNode(null);
      setActiveParams(query);
      if (!params.level && !params.nodeId) {
        setHistory([]);
      } else if (label) {
        setHistory((prev) => [...prev, { ...params, label }]);
      }
    },
    [queryWithRole],
  );

  React.useEffect(() => {
    if (!userLoading && currentUser) {
      loadGraph({}, "State");
    }
  }, [currentUser, userLoading, loadGraph]);

  const { nodes: graphNodes, edges: graphEdges } = React.useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    if ("data" in data && data.data) {
      return {
        nodes: data.data.nodes ?? [],
        edges: data.data.edges ?? [],
      };
    }
    return {
      nodes: (data as any).nodes ?? [],
      edges: (data as any).edges ?? [],
    };
  }, [data]);
  console.log("raw data:", data);
  console.log("parsed nodes/edges:", graphNodes.length, graphEdges.length);
  const nodes = React.useMemo(
    () => buildFlowNodes(graphNodes, selectedNode?.id ?? null),
    [graphNodes, selectedNode],
  );
console.log('built nodes sample:', nodes.slice(0, 3));
  const edges = React.useMemo(() => buildFlowEdges(graphEdges), [graphEdges]);

  const handleNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const rawNode = graphNodes.find(
        (item: GlobalNetworkNode) => item.id === node.id,
      );
      if (!rawNode) return;
      setSelectedNode(rawNode);
      if (
        rawNode.canDrillDown &&
        rawNode.drillDown?.level &&
        rawNode.drillDown?.nodeId
      ) {
        loadGraph(
          { level: rawNode.drillDown.level, nodeId: rawNode.drillDown.nodeId },
          rawNode.label,
        );
      }
    },
    [graphNodes, loadGraph],
  );

  const onReset = React.useCallback(() => {
    setHistory([]);
    loadGraph({}, "State");
  }, [loadGraph]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>Global Network Drilldown</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            The global network API returns self-contained drilldown nodes. Click
            an expandable node to fetch the next level without manual ID
            mapping.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={isLoading || userLoading}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadGraph(activeParams)}
            disabled={!currentUser || isLoading || userLoading}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>Role:</span>
        <span className="rounded-full border border-border px-2 py-1 text-xs text-foreground">
          {currentUser?.role ?? "Loading..."}
        </span>
        {currentUser?.districtId && (
          <span className="rounded-full border border-border px-2 py-1 text-xs text-foreground">
            districtId={currentUser.districtId}
          </span>
        )}
        {currentUser?.stationId && (
          <span className="rounded-full border border-border px-2 py-1 text-xs text-foreground">
            stationId={currentUser.stationId}
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-[auto_1fr] items-start">
        <div className="rounded-xl border border-border/70 bg-card p-3 min-w-[220px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Drilldown Trail
          </p>
          <div className="mt-3 space-y-2 text-[11px] text-foreground">
            {history.length === 0 ? (
              <p className="text-muted-foreground">
                Top-level graph loaded for your role.
              </p>
            ) : (
              history.map((entry, index) => (
                <div
                  key={`${entry.level ?? "root"}-${entry.nodeId ?? index}`}
                  className="rounded-lg bg-slate-950/60 p-2 border border-border"
                >
                  <div className="font-semibold text-foreground truncate">
                    {entry.label}
                  </div>
                  <div className="text-muted-foreground">
                    {entry.level ?? "root"}{" "}
                    {entry.nodeId ? `· ${entry.nodeId}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-slate-950/90 min-h-[520px] overflow-hidden">
          {userLoading || isLoading ? (
            <div className="flex h-[520px] items-center justify-center px-4">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Loading global network…</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-[520px] flex-col items-center justify-center gap-3 text-center px-6 text-muted-foreground">
              <span className="text-sm font-semibold text-foreground">
                Unable to load network
              </span>
              <span className="text-xs">
                {String(
                  (error as any)?.data ??
                    (error as any)?.message ??
                    "An unknown error occurred.",
                )}
              </span>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.15}
              maxZoom={2.5}
              defaultEdgeOptions={{ animated: false }}
              proOptions={{ hideAttribution: true }}
              className="h-[520px]"
            >
              <Background gap={24} size={1} color="#1f2937" />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
      </div>

      {selectedNode && (
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedNode.label}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {selectedNode.type}
              </p>
            </div>
            <span className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
              {selectedNode.canDrillDown ? "Expandable" : "Leaf"}
            </span>
          </div>
          {selectedNode.subtitle && (
            <p className="text-xs text-muted-foreground mb-3">
              {selectedNode.subtitle}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedNode.rawId && (
              <div className="rounded-lg bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Raw ID
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {selectedNode.rawId}
                </p>
              </div>
            )}
            {selectedNode.properties &&
              Object.entries(selectedNode.properties).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {String(value)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/atoms/Badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { NetworkDetailsPanel } from '@/components/organisms/NetworkDetailsPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useIntelligence, NewsMentionCard } from '@/features/intelligence';
import { setSyndicateId } from '@/store/slices/globalFiltersSlice';
import {
  useGetNetworkGraphQuery,
  useGetNetworkNodeQuery,
  useGetNetworkClustersQuery,
  useGetShortestPathQuery,
  useGetSharedPhonesQuery,
  useGetSharedVehiclesQuery,
  useGetCommonAssociatesQuery,
} from '@/services/networkApi';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  Layers,
  FileSearch,
  Brain,
  Clock,
  Network,
  GitCommit,
  User,
  Car,
  Phone,
  Sparkles,
  Info
} from 'lucide-react';

const COMMUNITY_COLORS = [
  { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' }, // Cyan
  { border: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' }, // Purple
  { border: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' }, // Orange
  { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' }, // Green
  { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' }  // Pink
];

// Helper to calculate concentric position stably
function getNodePosition(nodeId: string, nodeType: string) {
  const numId = parseInt(nodeId.split('-')[1]) || 1;
  let x = 0;
  let y = 0;

  if (nodeType === 'suspect') {
    const angle = (numId / 8) * 2 * Math.PI;
    x = Math.cos(angle) * 260;
    y = Math.sin(angle) * 260;
  } else if (nodeType === 'phone') {
    const angle = (numId / 15) * 2 * Math.PI;
    x = Math.cos(angle) * 490;
    y = Math.sin(angle) * 490;
  } else if (nodeType === 'vehicle') {
    const angle = (numId / 12) * 2 * Math.PI;
    x = Math.cos(angle) * 700;
    y = Math.sin(angle) * 700;
  } else if (nodeType === 'crime') {
    const angle = (numId / 16) * 2 * Math.PI;
    x = Math.cos(angle) * 920;
    y = Math.sin(angle) * 920;
  } else if (nodeType === 'location') {
    const angle = (numId / 10) * 2 * Math.PI;
    x = Math.cos(angle) * 1150;
    y = Math.sin(angle) * 1150;
  } else if (nodeType === 'police_station') {
    const angle = (numId / 6) * 2 * Math.PI;
    x = Math.cos(angle) * 1350;
    y = Math.sin(angle) * 1350;
  }

  return { x: x + 1500, y: y + 1500 };
}

function GraphController({ triggerRefit }: { triggerRefit: any }) {
  const { fitView } = useReactFlow();

  React.useEffect(() => {
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.15 });
    }, 150);
  }, [triggerRefit, fitView]);

  return null;
}

export function NetworkPageContent() {
  const { fitView } = useReactFlow();
  const [search, setSearch] = React.useState('');
  const [riskLevel, setRiskLevel] = React.useState('all');
  const [minConnections, setMinConnections] = React.useState(0);
  const [showLeafNodes, setShowLeafNodes] = React.useState(true);
  
  // New Toggles & Modes (Requirements 2, 4 & 5)
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const selectedSyndicateId = globalFilters.syndicateId;
  const setSelectedSyndicateId = (val: string | null) => {
    dispatch(setSyndicateId(val));
  };
  const [graphMode, setGraphMode] = React.useState<'network' | 'community' | 'shortest_path'>('network');
  const [hopCount, setHopCount] = React.useState<'1' | '2' | 'all'>('all');

  // Entity Type Filter States (Collapsible Toolbar, Default: Expanded)
  const [showSuspects, setShowSuspects] = React.useState(true);
  const [showCrimes, setShowCrimes] = React.useState(true);
  const [showVehicles, setShowVehicles] = React.useState(true);
  const [showPhones, setShowPhones] = React.useState(true);
  const [showLocations, setShowLocations] = React.useState(true);
  const [showPoliceStations, setShowPoliceStations] = React.useState(false); // Infrastructure, Default: OFF

  // Shortest Path States (Requirement 3)
  const [pathSource, setPathSource] = React.useState('');
  const [pathTarget, setPathTarget] = React.useState('');
  const [activePathQuery, setActivePathQuery] = React.useState<{ sourceId: string; targetId: string } | null>(null);

  // Selected Inspect state
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'dossier' | 'insights' | 'timeline'>('dossier');
  const intelRef = React.useRef<HTMLDivElement>(null);

  // Automatically clear shortest path overlay and reset to standard view when other filters change
  React.useEffect(() => {
    setActivePathQuery(null);
    if (graphMode === 'shortest_path') {
      setGraphMode('network');
    }
  }, [
    globalFilters.district,
    globalFilters.syndicateId,
    search,
    riskLevel,
    minConnections,
    showLeafNodes,
    showSuspects,
    showCrimes,
    showVehicles,
    showPhones,
    showLocations,
    showPoliceStations
  ]);

  // Fetch standard graph data
  const { data, isLoading, error } = useGetNetworkGraphQuery({
    search,
    nodeType: 'all',
    riskLevel,
    minConnections: minConnections || undefined,
  });

  const { data: syndicates = [] } = useGetNetworkClustersQuery();

  // Fetch shortest path (Requirement 3)
  const { data: shortestPathResult } = useGetShortestPathQuery(
    activePathQuery!,
    { skip: !activePathQuery }
  );

  // Fetch Neo4j syndicate insights (Requirement 5)
  const { data: sharedPhones } = useGetSharedPhonesQuery(
    { syndicateId: selectedSyndicateId! },
    { skip: !selectedSyndicateId }
  );
  const { data: sharedVehicles } = useGetSharedVehiclesQuery(
    { syndicateId: selectedSyndicateId! },
    { skip: !selectedSyndicateId }
  );
  const { data: commonAssociates } = useGetCommonAssociatesQuery(
    { syndicateId: selectedSyndicateId! },
    { skip: !selectedSyndicateId }
  );

  // Fetch detailed node info
  const { data: selectedNodeDetails } = useGetNetworkNodeQuery(
    selectedNodeId || '',
    { skip: !selectedNodeId }
  );

  const selectedSyndicate = React.useMemo(() => {
    return syndicates.find(s => s.id === selectedSyndicateId);
  }, [syndicates, selectedSyndicateId]);

  const { classifiedArticles } = useIntelligence();

  const getSyndicateMatchCriteria = (syndicateName: string): { districts: string[]; keywords: string[] } => {
    const name = syndicateName.toLowerCase();
    if (name.includes('cyber') || name.includes('bengaluru')) {
      return {
        districts: ['Bengaluru Urban', 'Bengaluru Rural'],
        keywords: ['cyber', 'fraud', 'online scam', 'phishing', 'jamtara', 'hacking'],
      };
    }
    if (name.includes('vehicle') || name.includes('mysuru')) {
      return {
        districts: ['Mysuru'],
        keywords: ['vehicle', 'theft', 'robbery', 'heist', 'stolen', 'car lifting'],
      };
    }
    if (name.includes('smuggling') || name.includes('belagavi')) {
      return {
        districts: ['Belagavi'],
        keywords: ['smuggling', 'contraband', 'border', 'seizure', 'illegal transit'],
      };
    }
    if (name.includes('distribution') || name.includes('north')) {
      return {
        districts: ['Hubballi-Dharwad', 'Kalaburagi', 'Ballari'],
        keywords: ['drugs', 'narcotics', 'ganja', 'heroin', 'cocaine', 'peddler', 'seized'],
      };
    }
    if (name.includes('coastal') || name.includes('narcotics')) {
      return {
        districts: ['Dakshina Kannada', 'Udupi', 'Uttara Kannada'],
        keywords: ['narcotics', 'drugs', 'mangalore', 'mangaluru', 'sea route', 'coastal', 'boat'],
      };
    }
    return { districts: [], keywords: [] };
  };

  const syndicateArticles = React.useMemo(() => {
    if (!selectedSyndicate) return [];
    const { districts, keywords } = getSyndicateMatchCriteria(selectedSyndicate.name);
    
    return classifiedArticles.filter((art) => {
      const hasDistrict = art.districts.some((d) =>
        districts.some((target) => d.toLowerCase().includes(target.toLowerCase()))
      );
      const text = `${art.title} ${art.summary}`.toLowerCase();
      const hasKeyword = keywords.some((kw) => text.includes(kw));
      
      return hasDistrict || hasKeyword;
    });
  }, [classifiedArticles, selectedSyndicate]);

  const syndicateIntelStats = React.useMemo(() => {
    if (syndicateArticles.length === 0) return null;
    const confidenceScore = Math.min(98, 65 + syndicateArticles.length * 5);
    const criticalCount = syndicateArticles.filter((a) => a.severity === 'critical').length;
    const mentionFrequency = syndicateArticles.length > 5 ? 'Daily Alerting' : 'Weekly Aggregation';
    
    const sortedDates = [...syndicateArticles]
      .map((a) => new Date(a.published).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => b - a);
    const lastReportedDate = sortedDates.length > 0 ? new Date(sortedDates[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent';

    return {
      count: syndicateArticles.length,
      confidenceScore,
      mentionFrequency,
      lastReportedDate,
      criticalCount,
    };
  }, [syndicateArticles]);

  // Compute connections list from graph edges
  const selectedNodeConnections = React.useMemo(() => {
    if (!selectedNodeId || !data?.edges) return [];
    const selectedEdges = data.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
    return selectedEdges.map((e) => {
      const isSource = e.source === selectedNodeId;
      const targetId = isSource ? e.target : e.source;
      const targetNode = data.nodes.find((n) => n.id === targetId);
      return {
        targetId,
        targetLabel: targetNode?.label ?? targetId,
        type: e.type,
        weight: e.weight,
      };
    });
  }, [selectedNodeId, data?.edges, data?.nodes]);

  // Helper: check adjacency to syndicate suspects
  const isConnectedToSyndicate = React.useCallback((nodeId: string, maxHops: number = 2) => {
    if (!selectedSyndicate || !data?.edges) return false;
    const cartelSuspects = new Set(selectedSyndicate.keyNodes);
    if (cartelSuspects.has(nodeId)) return true;

    // BFS connection check up to maxHops
    const queue: { id: string; dist: number }[] = [{ id: nodeId, dist: 0 }];
    const visited = new Set<string>([nodeId]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (cartelSuspects.has(curr.id)) return true;
      if (curr.dist >= maxHops) continue;

      for (const edge of data.edges) {
        let neighbor: string | null = null;
        if (edge.source === curr.id) neighbor = edge.target;
        else if (edge.target === curr.id) neighbor = edge.source;

        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, dist: curr.dist + 1 });
        }
      }
    }
    return false;
  }, [selectedSyndicate, data?.edges]);

  // Calculate Node Filter (Collapsible checkboxes, Unrelated, Hops)
  const filteredNodes = React.useMemo(() => {
    if (!data?.nodes) return [];
    let list = data.nodes;

    // Filter by checkbox toggles
    if (!showSuspects) list = list.filter(n => n.type !== 'suspect');
    if (!showCrimes) list = list.filter(n => n.type !== 'crime');
    if (!showVehicles) list = list.filter(n => n.type !== 'vehicle');
    if (!showPhones) list = list.filter(n => n.type !== 'phone');
    if (!showLocations) list = list.filter(n => n.type !== 'location');
    if (!showPoliceStations) list = list.filter(n => n.type !== 'police_station');

    // Collapse Phone/Vehicles leaf nodes
    if (!showLeafNodes) {
      list = list.filter((n) => n.type !== 'phone' && n.type !== 'vehicle');
    }

    // Filter by Syndicate Hops boundaries (Requirement 2 & 5)
    if (selectedSyndicateId && selectedSyndicate) {
      if (hopCount === '1' || hopCount === '2') {
        const allowedHops = hopCount === '1' ? 1 : 2;
        list = list.filter((n) => isConnectedToSyndicate(n.id, allowedHops));
      } else {
        // Entire Network: keep all syndicate connected components
        list = list.filter((n) => isConnectedToSyndicate(n.id, 4));
      }
    }

    return list;
  }, [
    data?.nodes, 
    showSuspects, 
    showCrimes, 
    showVehicles, 
    showPhones, 
    showLocations, 
    showPoliceStations, 
    showLeafNodes, 
    selectedSyndicateId, 
    selectedSyndicate, 
    hopCount, 
    isConnectedToSyndicate
  ]);

  const filteredEdges = React.useMemo(() => {
    if (!data?.edges) return [];
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return data.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [data?.edges, filteredNodes]);

  // Degree Centrality calculations (Requirement 6)
  const degreeCentrality = React.useMemo(() => {
    if (!data?.nodes) return { suspects: [], phones: [], vehicles: [] };
    const allNodes = data.nodes;

    const suspects = [...allNodes]
      .filter((n) => n.type === 'suspect')
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 3);

    const phones = [...allNodes]
      .filter((n) => n.type === 'phone')
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 3);

    const vehicles = [...allNodes]
      .filter((n) => n.type === 'vehicle')
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 3);

    return { suspects, phones, vehicles };
  }, [data?.nodes]);

  // Convert to ReactFlow Nodes
  const reactFlowNodes = React.useMemo(() => {
    return filteredNodes.map((node) => {
      const isSelected = selectedNodeId === node.id;
      const isPathNode = graphMode === 'shortest_path' && (shortestPathResult?.pathNodeIds?.includes(node.id) || false);
      const isActivePath = graphMode === 'shortest_path' && !!shortestPathResult?.pathNodeIds?.length;

      // Syndicate highlight calculations (Requirement 4)
      const isSyndicateMember = selectedSyndicate?.keyNodes.includes(node.id) || false;
      const isRelated = selectedSyndicateId ? (isSyndicateMember || isConnectedToSyndicate(node.id, 2)) : true;

      // Opacity fading logic
      let opacity = 1;
      const activeDistrict = globalFilters.district;
      const belongsToDistrict = !activeDistrict ||
        (node.type === 'location' && node.label.toLowerCase() === activeDistrict.toLowerCase()) ||
        ((node.properties as any)?.district?.toLowerCase() === activeDistrict.toLowerCase()) ||
        ((node.properties as any)?.location?.toLowerCase().includes(activeDistrict.toLowerCase()));

      if (isActivePath) {
        opacity = isPathNode ? 1.0 : 0.15;
      } else if (selectedSyndicateId) {
        opacity = isRelated && belongsToDistrict ? 1.0 : 0.25;
      } else if (activeDistrict) {
        opacity = belongsToDistrict ? 1.0 : 0.25;
      }

      let border = '';
      let background = 'hsl(var(--card))';
      let color = 'hsl(var(--card-foreground))';

      if (graphMode === 'community') {
        const commId = node.properties.communityId ?? 0;
        const colorSet = COMMUNITY_COLORS[commId % COMMUNITY_COLORS.length];
        border = isSelected 
          ? '2.5px solid #ffffff' 
          : isPathNode 
          ? '2.5px solid #10B981' 
          : `1.5px solid ${colorSet.border}`;
        background = isSelected ? 'var(--color-primary)' : colorSet.bg;
        if (isSelected) color = '#ffffff';
      } else {
        if (isSelected) {
          background = 'var(--color-primary)';
          color = '#ffffff';
          border = '2.5px solid #ffffff';
        } else if (isPathNode) {
          border = '2.5px solid #10B981';
          background = 'rgba(16, 185, 129, 0.15)';
        } else {
          border = node.type === 'suspect' ? '1.5px solid #F43F5E'
                 : node.type === 'crime' ? '1.5px solid #F59E0B'
                 : node.type === 'location' ? '1.5px solid #3B82F6'
                 : node.type === 'vehicle' ? '1.5px solid #10B981'
                 : node.type === 'phone' ? '1.5px solid #6366F1'
                 : '1.5px solid #EC4899'; // Police station
        }
      }

      const style: React.CSSProperties = {
        background,
        color,
        border,
        borderRadius: '6px',
        boxShadow: isSelected 
          ? '0 0 15px rgba(59, 130, 246, 0.8)' 
          : isPathNode 
          ? '0 0 15px rgba(16, 185, 129, 0.8)' 
          : isSyndicateMember 
          ? '0 0 10px rgba(244, 63, 94, 0.4)' 
          : 'none',
        padding: '6px',
        width: 130,
        opacity,
        transition: 'all 0.3s ease'
      };

      return {
        id: node.id,
        position: getNodePosition(node.id, node.type),
        data: {
          label: (
            <div className="flex flex-col items-center gap-1 select-none">
              <span className="font-bold text-[10px] truncate max-w-[110px] text-foreground">{node.label}</span>
              <span className="text-[8px] opacity-75 font-semibold uppercase tracking-wider">{node.type.replace('_', ' ')}</span>
              {node.riskScore > 65 && (
                <span className="text-[7.5px] bg-danger/10 text-danger px-1 rounded border border-danger/20 font-bold font-data">
                  Risk: {node.riskScore}
                </span>
              )}
            </div>
          ),
        },
        style,
      };
    });
  }, [filteredNodes, selectedNodeId, graphMode, shortestPathResult, selectedSyndicateId, selectedSyndicate, isConnectedToSyndicate, globalFilters.district]);

  // Convert to ReactFlow Edges
  const reactFlowEdges = React.useMemo(() => {
    return filteredEdges.map((edge) => {
      const isPathEdge = graphMode === 'shortest_path' && (shortestPathResult?.pathEdgeIds?.includes(edge.id) || false);
      const isActivePath = graphMode === 'shortest_path' && !!shortestPathResult?.pathEdgeIds?.length;

      // Syndicate member check
      const isCartelSource = selectedSyndicate?.keyNodes.includes(edge.source) || false;
      const isCartelTarget = selectedSyndicate?.keyNodes.includes(edge.target) || false;
      const isRelatedEdge = selectedSyndicateId ? (isCartelSource || isCartelTarget) : true;

      let strokeColor = '#475569';
      let animated = edge.type === 'called';

      if (isActivePath) {
        strokeColor = isPathEdge ? '#10B981' : '#1e293b';
        animated = isPathEdge;
      } else {
        if (edge.type === 'owns') strokeColor = '#64748B';
        else if (edge.type === 'called') strokeColor = '#818CF8';
        else if (edge.type === 'involved_in') strokeColor = '#F43F5E';
        else if (edge.type === 'located_at') strokeColor = '#3B82F6';
        else if (edge.type === 'associated_with') strokeColor = '#F59E0B';
        else if (edge.type === 'investigated_by') strokeColor = '#A855F7';
        else if (edge.type === 'under_jurisdiction') strokeColor = '#EC4899';
      }

      let opacity = 0.75;
      if (isActivePath) {
        opacity = isPathEdge ? 1.0 : 0.05;
      } else if (selectedSyndicateId) {
        opacity = isRelatedEdge ? 0.95 : 0.15;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated,
        labelStyle: { fill: '#94A3B8', fontSize: 7, fontWeight: 700, pointerEvents: 'none' as const },
        style: {
          stroke: strokeColor,
          strokeWidth: isPathEdge ? 4 : Math.min(5, 1 + edge.weight * 0.75),
          opacity,
          transition: 'all 0.3s ease'
        },
      };
    });
  }, [filteredEdges, shortestPathResult, selectedSyndicateId, selectedSyndicate, graphMode]);

  // Grouped entities list for shortest path tools
  const entitiesList = React.useMemo(() => {
    if (!data?.nodes) return {};
    const groups: Record<string, { id: string; label: string }[]> = {};
    data.nodes.forEach((n) => {
      // If infrastructure toggle is off, do not show police stations
      if (n.type === 'police_station' && !showPoliceStations) return;
      
      const typeLabel = n.type === 'suspect' ? 'Suspects'
                      : n.type === 'crime' ? 'Crimes'
                      : n.type === 'location' ? 'Districts'
                      : n.type === 'vehicle' ? 'Vehicles'
                      : n.type === 'phone' ? 'CDR Burner Phones'
                      : 'Police Stations';
                      
      if (!groups[typeLabel]) {
        groups[typeLabel] = [];
      }
      groups[typeLabel].push({ id: n.id, label: n.label });
    });
    return groups;
  }, [data?.nodes, showPoliceStations]);

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);
    setActiveTab('dossier');

    // Auto-scroll logic: only if the intelligence section is somewhat near the viewport
    if (intelRef.current) {
      const rect = intelRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
      const distanceToViewportBottom = rect.top - window.innerHeight;
      
      // If it is partially visible, or within 300px below the viewport, scroll it into view smoothly
      if (isVisible || (distanceToViewportBottom > 0 && distanceToViewportBottom < 300)) {
        setTimeout(() => {
          intelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  };

  const handleFindShortestPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathSource || !pathTarget) return;
    setSelectedSyndicateId(null); // Clear syndicate selection
    setActivePathQuery({ sourceId: pathSource, targetId: pathTarget });
  };

  const handleResetWorkspace = () => {
    setSelectedSyndicateId(null);
    setActivePathQuery(null);
    setPathSource('');
    setPathTarget('');
    setHopCount('all');
    setRiskLevel('all');
    setMinConnections(0);
    setShowSuspects(true);
    setShowCrimes(true);
    setShowVehicles(true);
    setShowPhones(true);
    setShowLocations(true);
    setShowPoliceStations(false);
    setShowLeafNodes(true);
    setSearch('');
    setTimeout(() => {
      fitView({ duration: 800 });
    }, 100);
  };

  // Dynamic chronology builder for Timeline tab
  const chronologicalTimeline = React.useMemo(() => {
    if (!selectedNodeDetails) return [];
    
    const events: { date: string; category: 'crime' | 'vehicle' | 'phone' | 'movement' | 'police' | 'general'; event: string; details: string }[] = [];
    
    // 1. Add base timeline events from mock data
    if (selectedNodeDetails.timeline) {
      selectedNodeDetails.timeline.forEach(item => {
        let category: any = 'general';
        if (item.event.toLowerCase().includes('deposit') || item.event.toLowerCase().includes('bank')) category = 'general';
        else if (item.event.toLowerCase().includes('association') || item.event.toLowerCase().includes('gathering')) category = 'movement';
        
        events.push({
          date: item.date,
          category,
          event: item.event,
          details: item.details
        });
      });
    }
    
    // 2. Add Crimes (from involved_in edges)
    selectedNodeConnections.forEach(conn => {
      if (conn.type === 'involved_in') {
        events.push({
          date: "2026-06-05", // Mock occurrence date
          category: 'crime',
          event: `Crime Involvement: ${conn.targetLabel}`,
          details: `Flagged as primary suspect in active incident file. Category: Theft/Burglary syndicate operations.`
        });
      }
      
      // 3. Add Vehicle Sightings (owns -> vehicle)
      if (conn.type === 'owns' && conn.targetId.startsWith('veh-')) {
        events.push({
          date: "2026-06-04",
          category: 'vehicle',
          event: `Vehicle Sighting: ${conn.targetLabel}`,
          details: `ANPR camera log: Detected transit near regional boundary points.`
        });
      }
      
      // 4. Add Phone Activity (owns -> phone)
      if (conn.type === 'owns' && conn.targetId.startsWith('phone-')) {
        events.push({
          date: "2026-06-06",
          category: 'phone',
          event: `Phone CDR Activity: ${conn.targetLabel}`,
          details: `Call activity logged via mobile tower intercepts. Duration: 180s.`
        });
      }
      
      // 5. Add District Movements (located_at -> location)
      if (conn.type === 'located_at') {
        events.push({
          date: "2026-06-03",
          category: 'movement',
          event: `District Movement Check`,
          details: `Registered location boundaries in ${conn.targetLabel} Command Division.`
        });
      }
      
      // 6. Add Police Actions (under_jurisdiction -> ps)
      if (conn.type === 'under_jurisdiction') {
        events.push({
          date: "2026-06-07",
          category: 'police',
          event: `Police Action: Surveillance Assigned`,
          details: `Case files forwarded to ${conn.targetLabel} for patrol dispatch.`
        });
      }
    });
    
    // Sort chronologically descending (newest first)
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedNodeDetails, selectedNodeConnections]);

  return (
    <DashboardLayout title="Syndicate Network Analysis">
      <div className="space-y-4 max-w-7xl mx-auto pb-12 px-4 flex flex-col min-h-[90vh]">
        
        {/* ROW 1: COMPACT OPERATIONS TOOLBAR (Target Height: 64px-96px) */}
        <Card className="bg-card border border-border shadow-sm shrink-0">
          <CardContent className="p-2.5 flex flex-col gap-2">
            
            {/* Row 1.1: Title & Main Control Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Title Block */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1.5 bg-primary/10 rounded text-primary">
                  <Network className="h-4 w-4" />
                </div>
                <div>
                  <Typography variant="heading-sm" className="font-bold text-foreground leading-none">
                    Network Analysis
                  </Typography>
                  <Typography variant="caption" color="muted" className="hidden sm:inline text-[9px] leading-none">
                    Karnataka Crime Intelligence
                  </Typography>
                </div>
              </div>

              {/* Action Buttons & Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex items-center min-w-[140px] max-w-[180px]">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search entity..."
                    className="pl-8 h-8 text-[11px]"
                  />
                </div>

                {/* Syndicate Selector */}
                <select
                  value={selectedSyndicateId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSyndicateId(val === '' ? null : val);
                    setActivePathQuery(null);
                    setHopCount('all');
                  }}
                  className="h-8 px-2 rounded-md border border-border bg-background text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px] font-sans font-medium"
                >
                  <option value="">All Syndicates</option>
                  {syndicates.map((syn) => (
                    <option key={syn.id} value={syn.id}>
                      {syn.name}
                    </option>
                  ))}
                </select>

                {/* Graph Mode Selector */}
                <select
                  value={graphMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'network' | 'community' | 'shortest_path';
                    setGraphMode(mode);
                    if (mode !== 'shortest_path') {
                      setActivePathQuery(null);
                    }
                  }}
                  className="h-8 px-2 rounded-md border border-border bg-background text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[130px] font-sans font-medium"
                >
                  <option value="network">Network View</option>
                  <option value="community">Community View</option>
                  <option value="shortest_path">Shortest Path View</option>
                </select>

                {/* Hop Controls Button Group */}
                <div className="flex bg-muted/20 p-0.5 rounded-md border border-border/40 text-[9px] h-8 items-center">
                  <button
                    disabled={!selectedSyndicateId}
                    onClick={() => setHopCount('1')}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-semibold transition-all cursor-pointer h-full text-center flex items-center justify-center",
                      !selectedSyndicateId ? "opacity-30 cursor-not-allowed text-muted-foreground" :
                      hopCount === '1' ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    1 Hop
                  </button>
                  <button
                    disabled={!selectedSyndicateId}
                    onClick={() => setHopCount('2')}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-semibold transition-all cursor-pointer h-full text-center flex items-center justify-center",
                      !selectedSyndicateId ? "opacity-30 cursor-not-allowed text-muted-foreground" :
                      hopCount === '2' ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    2 Hops
                  </button>
                  <button
                    disabled={!selectedSyndicateId}
                    onClick={() => setHopCount('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-semibold transition-all cursor-pointer h-full text-center flex items-center justify-center",
                      !selectedSyndicateId ? "opacity-30 cursor-not-allowed text-muted-foreground" :
                      hopCount === 'all' ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Expand
                  </button>
                </div>

                {/* Reset Workspace */}
                <Button
                  variant="outline"
                  onClick={handleResetWorkspace}
                  className="h-8 text-[11px] px-2.5 font-semibold"
                >
                  Reset
                </Button>
              </div>
            </div>

            <Separator className="bg-border/20 my-0.5" />

            {/* Row 1.2: Integrated Entity Filters Checklist */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="uppercase text-[9px] tracking-wider text-primary flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Filter Entities:
                </span>
                
                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showSuspects}
                    onChange={(e) => setShowSuspects(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Persons</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showCrimes}
                    onChange={(e) => setShowCrimes(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Crimes</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showVehicles}
                    onChange={(e) => setShowVehicles(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Vehicles</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showPhones}
                    onChange={(e) => setShowPhones(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Phones</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showLocations}
                    onChange={(e) => setShowLocations(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Districts</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showPoliceStations}
                    onChange={(e) => setShowPoliceStations(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Police Stations</span>
                </label>
              </div>

              {/* Auxiliary leaf options */}
              <div className="flex items-center gap-4 text-[10px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={showLeafNodes}
                    onChange={(e) => setShowLeafNodes(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary text-primary cursor-pointer"
                  />
                  <span>Show Phone/Vehicle Leaves</span>
                </label>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Shortest Path Alert Explanation overlay */}
        {graphMode === 'shortest_path' && shortestPathResult && shortestPathResult.pathNodeIds.length > 0 && (
          <div className="bg-success/15 border border-success/30 text-success p-3 rounded-lg text-xs space-y-1 animate-in slide-in-from-top duration-200">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-success animate-pulse" />
              <span>Connection Established (Neo4j ShortestPath query)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">{shortestPathResult.explanation}</p>
          </div>
        )}

        {/* ROW 2: DOMINANT GRAPH CANVAS WORKSPACE (100% width, min-h 80vh, target 82vh) */}
        <div className="w-full h-[82vh] border border-border rounded-lg overflow-hidden bg-slate-950/80 relative shrink-0">
          {isLoading ? (
            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center space-y-4 animate-pulse z-10">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <div className="text-muted-foreground text-sm font-medium">Computing graph connectivity...</div>
            </div>
          ) : reactFlowNodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 bg-slate-950/95">
              <Icon icon={AlertTriangle} size="lg" className="text-warning mb-2" />
              <Typography variant="body-md" className="font-semibold text-foreground">
                {error ? "Query Error Occurred" : "No Entities Matches"}
              </Typography>
              <Typography variant="caption" color="muted" className="max-w-xs mt-1">
                {error
                  ? String((error as any)?.message || (error as any)?.error || JSON.stringify(error))
                  : "Adjust filters. No network entities match the current selection criteria."}
              </Typography>
            </div>
          ) : (
            <ReactFlow
              nodes={reactFlowNodes}
              edges={reactFlowEdges}
              onNodeClick={handleNodeClick}
              fitView
              minZoom={0.1}
              maxZoom={2.5}
              className="z-0"
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1e293b" gap={24} size={1} />
              <Controls showInteractive={false} />
              <GraphController triggerRefit={`${selectedSyndicateId}-${hopCount}-${showLeafNodes}-${showPoliceStations}-${showSuspects}-${showCrimes}-${showVehicles}-${showPhones}-${showLocations}-${riskLevel}-${minConnections}-${search}-${graphMode}`} />
            </ReactFlow>
          )}

          {/* Shortest Path Finder Floating overlay (Requirement 3) */}
          {graphMode === 'shortest_path' && (
            <Card className="absolute bottom-4 left-4 z-10 p-3 bg-slate-950/90 backdrop-blur-md border border-border w-72 text-xs shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2.5">
                <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                  <GitCommit className="h-3.5 w-3.5 text-primary" />
                  Shortest Path Finder
                </span>
                {activePathQuery && (
                  <button
                    onClick={() => setActivePathQuery(null)}
                    className="text-[9px] text-danger hover:underline font-bold focus:outline-none cursor-pointer"
                  >
                    Clear Path
                  </button>
                )}
              </div>
              
              <form onSubmit={handleFindShortestPath} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Source Entity</label>
                  <select
                    value={pathSource}
                    onChange={(e) => setPathSource(e.target.value)}
                    className="h-7.5 w-full rounded border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  >
                    <option value="">Select Source Entity</option>
                    {Object.entries(entitiesList).map(([group, items]) => (
                      <optgroup key={group} label={group} className="text-[9px] bg-card text-foreground font-semibold">
                        {items.map((item) => (
                          <option key={item.id} value={item.id} className="text-xs bg-background text-foreground font-normal">
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Target Entity</label>
                  <select
                    value={pathTarget}
                    onChange={(e) => setPathTarget(e.target.value)}
                    className="h-7.5 w-full rounded border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  >
                    <option value="">Select Target Entity</option>
                    {Object.entries(entitiesList).map(([group, items]) => (
                      <optgroup key={group} label={group} className="text-[9px] bg-card text-foreground font-semibold">
                        {items.map((item) => (
                          <option key={item.id} value={item.id} disabled={item.id === pathSource} className="text-xs bg-background text-foreground font-normal">
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={!pathSource || !pathTarget}
                  className="h-7.5 text-[11px] font-semibold w-full"
                >
                  Find Connection Path
                </Button>
              </form>
            </Card>
          )}

          {/* Floating legend overlay */}
          <Card className="absolute top-4 right-4 z-10 p-2 bg-slate-950/85 backdrop-blur-md border border-border text-[9px] font-semibold flex flex-col gap-1 w-32 pointer-events-none select-none">
            <div className="flex items-center gap-1 border-b pb-0.5 mb-0.5 font-bold text-[9px] text-foreground">
              <Icon icon={Layers} size="xs" />
              <span>Legend</span>
            </div>
            <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-rose-500" /><span>Suspect (Person)</span></div>
            <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-amber-500" /><span>Crime case</span></div>
            <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-blue-500" /><span>District (Location)</span></div>
            <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-teal-500" /><span>Vehicle RTO</span></div>
            <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-indigo-500" /><span>Phone CDR</span></div>
            {showPoliceStations && (
              <div className="flex items-center gap-1.5"><div className="size-2 rounded bg-purple-500" /><span>Police Station</span></div>
            )}
          </Card>
        </div>

        {/* ROW 3: INTELLIGENCE WORKSPACE (Full Width) */}
        <div ref={intelRef} className="w-full flex flex-col min-h-0 mt-2 scroll-mt-4">
          
          {/* Visual Badge above the tabs if node is selected */}
          {selectedNodeDetails && (
            <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border border-b-0 border-border rounded-t-lg">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Selected: <strong className="text-foreground">{selectedNodeDetails.label}</strong> 
                <span className="text-[10px] text-muted-foreground font-normal">({selectedNodeDetails.type.replace('_', ' ')})</span>
              </span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-[10px] text-danger hover:underline font-bold cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Horizontal tab triggers */}
          <div className={cn(
            "flex border border-border bg-card shrink-0",
            selectedNodeDetails ? "border-t-0" : "rounded-t-lg"
          )}>
            {(
              [
                { key: 'dossier',  label: 'Dossier',  icon: FileSearch },
                { key: 'insights', label: 'AI Intel',  icon: Brain      },
                { key: 'timeline', label: 'Timeline',  icon: Clock      },
              ] as const
            ).map(({ key, label, icon: TabIcon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none flex-1 justify-center border-b-2',
                  activeTab === key
                    ? 'border-b-primary text-primary bg-primary/5'
                    : 'border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
                )}
              >
                <TabIcon className="size-3 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab panel container */}
          <div className="overflow-y-auto border border-t-0 border-border rounded-b-lg bg-card min-h-[350px] max-h-[500px]">
            
            {activeTab === 'dossier' && (
              <NetworkDetailsPanel
                entity={selectedNodeDetails}
                connections={selectedNodeConnections}
                onClose={() => setSelectedNodeId(null)}
                className="rounded-none border-0 shadow-none"
              />
            )}

            {activeTab === 'insights' && (
              <div className="p-4 space-y-5 text-xs">
                
                {/* Scenario 1: Specific Entity Node is selected (Requirement 5) */}
                {selectedNodeDetails ? (
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded p-2.5 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground block">{selectedNodeDetails.label}</span>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">{selectedNodeDetails.type.replace('_', ' ')} AI Intel</span>
                      </div>
                      <Badge 
                        variant={
                          selectedNodeDetails.riskScore >= 80 ? 'risk-critical' : 
                          selectedNodeDetails.riskScore >= 50 ? 'risk-high' : 
                          selectedNodeDetails.riskScore >= 25 ? 'risk-medium' : 
                          'risk-low'
                        }
                        size="sm"
                        className="capitalize scale-90"
                      >
                        {
                          selectedNodeDetails.riskScore >= 80 ? 'Critical' : 
                          selectedNodeDetails.riskScore >= 50 ? 'High' : 
                          selectedNodeDetails.riskScore >= 25 ? 'Medium' : 
                          'Low'
                        }
                      </Badge>
                    </div>

                    {/* Threat Details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-muted/20 p-2 rounded border border-border/30">
                        <span className="text-muted-foreground block mb-1">Risk Score</span>
                        <strong className="text-foreground text-sm font-data">{selectedNodeDetails.riskScore}%</strong>
                        <div className="w-full bg-muted h-1 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              selectedNodeDetails.riskScore >= 80 ? "bg-danger" : selectedNodeDetails.riskScore >= 50 ? "bg-warning" : "bg-primary"
                            )}
                            style={{ width: `${selectedNodeDetails.riskScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-muted/20 p-2 rounded border border-border/30">
                        <span className="text-muted-foreground block mb-1">Confidence Score</span>
                        <strong className="text-foreground text-sm font-data">
                          {Math.floor(75 + (parseInt(selectedNodeDetails.id.split('-')[1]) || 5) * 4.3) % 16 + 80}%
                        </strong>
                        <div className="w-full bg-muted h-1 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-success"
                            style={{ width: `${Math.floor(75 + (parseInt(selectedNodeDetails.id.split('-')[1]) || 5) * 4.3) % 16 + 80}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                        AI Threat Justification
                      </span>
                      <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-3.5 leading-relaxed">
                        {selectedNodeDetails.aiInsights?.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        )) || (
                          <li>No critical threats flagged. Continuous behavioral logs monitored.</li>
                        )}
                      </ul>
                    </div>

                    {/* Modularity & Centrality Context for Selected Node */}
                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Louvain Modularity & Degree Centrality
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-muted/10 p-2.5 rounded border border-border/30">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Community Result</span>
                          <span className="text-foreground mt-0.5 block">
                            Louvain Community Hub #{selectedNodeDetails.properties.communityId ?? 0} (clustered by connection density).
                          </span>
                        </div>
                        <div className="bg-muted/10 p-2.5 rounded border border-border/30">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Degree Centrality</span>
                          <span className="text-foreground mt-0.5 block">
                            Node has {selectedNodeDetails.connections ?? 0} direct relationship connections in the graph.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle button back to syndicate context */}
                    {selectedSyndicate && (
                      <button
                        onClick={() => setSelectedNodeId(null)}
                        className="w-full text-center mt-2 p-1.5 rounded border border-border bg-muted/10 hover:bg-muted/25 text-primary text-[10px] font-bold transition-all focus:outline-none cursor-pointer"
                      >
                        ← Switch to {selectedSyndicate.name.split(' ')[0]} Gang Intel
                      </button>
                    )}
                  </div>
                ) : selectedSyndicate ? (
                  /* Scenario 2: Syndicate Filter Active (Requirement 5) */
                  <div className="space-y-4">
                    
                    <div className="bg-primary/5 border border-primary/20 rounded p-2.5 text-[11px]">
                      <span className="font-bold text-foreground block mb-0.5">{selectedSyndicate.name}</span>
                      <p className="text-muted-foreground leading-normal">
                        Advanced Neo4j analytics running on the cartel cluster details.
                      </p>
                    </div>

                    {/* Shared burner lines list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <Phone className="h-3 w-3 text-primary" />
                        Shared CDR Burner Phones
                      </span>
                      {sharedPhones?.map((p, idx) => (
                        <div key={idx} className="border border-border/40 p-2 rounded bg-muted/15 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground font-data text-xs">{p.phone}</span>
                            <Badge 
                              variant={
                                p.threatLevel === 'Critical' ? 'risk-critical' : 
                                p.threatLevel === 'High' ? 'risk-high' : 
                                p.threatLevel === 'Medium' ? 'risk-medium' : 
                                'risk-low'
                              } 
                              size="sm" 
                              className="scale-75"
                            >
                              {p.threatLevel}
                            </Badge>
                          </div>
                          <div className="text-[9px] text-muted-foreground leading-relaxed">
                            Common Taps: <strong className="text-foreground">{p.suspects.join(', ')}</strong>
                          </div>
                          <div className="flex justify-between text-[8px] text-muted-foreground pt-1 border-t border-border/10">
                            <span>Risk Score: <strong className="text-foreground">{p.riskScore}%</strong></span>
                            <span>Confidence: <strong className="text-foreground">{p.confidenceScore}%</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Shared vehicles list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <Car className="h-3 w-3 text-primary" />
                        Shared Transport RTO Vehicles
                      </span>
                      {sharedVehicles?.map((v, idx) => (
                        <div key={idx} className="border border-border/40 p-2 rounded bg-muted/15 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground font-data text-xs">{v.vehicle}</span>
                            <Badge 
                              variant={
                                v.threatLevel === 'Critical' ? 'risk-critical' : 
                                v.threatLevel === 'High' ? 'risk-high' : 
                                v.threatLevel === 'Medium' ? 'risk-medium' : 
                                'risk-low'
                              } 
                              size="sm" 
                              className="scale-75"
                            >
                              {v.threatLevel}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-normal">
                            Model: <strong className="text-foreground">{v.model}</strong> · Shared by: <strong className="text-foreground">{v.suspects.join(', ')}</strong>
                          </p>
                          <div className="flex justify-between text-[8px] text-muted-foreground pt-1 border-t border-border/10">
                            <span>Risk Score: <strong className="text-foreground">{v.riskScore}%</strong></span>
                            <span>Confidence: <strong className="text-foreground">{v.confidenceScore}%</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Common associates list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        Common Outside Associates
                      </span>
                      {commonAssociates?.map((a, idx) => (
                        <div key={idx} className="border border-border/40 p-2 rounded bg-muted/15 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground text-xs">{a.associate}</span>
                            <Badge 
                              variant={
                                a.threatLevel === 'Critical' ? 'risk-critical' : 
                                a.threatLevel === 'High' ? 'risk-high' : 
                                a.threatLevel === 'Medium' ? 'risk-medium' : 
                                'risk-low'
                              } 
                              size="sm" 
                              className="scale-75 text-[8px]"
                            >
                              {a.threatLevel}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-normal">
                            Suspected Role: <strong className="text-foreground">{a.role}</strong>
                          </p>
                          <div className="flex justify-between text-[8px] text-muted-foreground pt-1 border-t border-border/10">
                            <span>Connects: <strong className="text-foreground">{a.suspectsCount} members</strong></span>
                            <span>Confidence: <strong className="text-foreground">{a.confidenceScore}%</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Related News Intelligence (OSINT) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <Brain className="h-3 w-3 text-warning animate-pulse" />
                        Related News Intelligence (OSINT)
                      </span>
                      {syndicateIntelStats ? (
                        <div className="space-y-2">
                          {/* Syndicate Intel Stats Summary */}
                          <div className="bg-muted/15 p-2 rounded border border-border/40 grid grid-cols-2 gap-2 text-[9px] text-muted-foreground">
                            <div>Articles Found: <strong className="text-foreground font-data">{syndicateIntelStats.count}</strong></div>
                            <div>Confidence: <strong className="text-foreground font-data">{syndicateIntelStats.confidenceScore}%</strong></div>
                            <div>Frequency: <strong className="text-foreground">{syndicateIntelStats.mentionFrequency}</strong></div>
                            <div>Last Reported: <strong className="text-foreground">{syndicateIntelStats.lastReportedDate}</strong></div>
                          </div>

                          {/* Articles Mention list */}
                          <div className="space-y-2">
                            {syndicateArticles.map((art) => (
                              <NewsMentionCard
                                key={art.id}
                                article={art}
                                compact
                                className="border border-border/30 p-2 rounded bg-background/30 hover:bg-background/60 transition-colors"
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-[10px] border border-dashed border-border/50 rounded bg-muted/5">
                          No related news intelligence recorded for {selectedSyndicate.name}.
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  /* Scenario 3: Default General Graph Insights & Centrality Hubs */
                  <div className="space-y-4">
                    {/* Centrality Rankings (Requirement 6) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Most Connected Entities (Centrality)
                      </span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Suspects */}
                        <div className="space-y-1 bg-muted/10 p-2 rounded border border-border/30">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/20 pb-0.5">Suspects Centrality</span>
                          {degreeCentrality.suspects.map((n) => (
                            <div key={n.id} className="flex justify-between items-center text-[10px] mt-1">
                              <span className="font-semibold text-foreground truncate max-w-[130px]">{n.label}</span>
                              <Badge variant="outline" size="sm" className="font-data scale-85 py-0 px-1">{n.connections} links</Badge>
                            </div>
                          ))}
                        </div>

                        {/* Phones */}
                        <div className="space-y-1 bg-muted/10 p-2 rounded border border-border/30">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/20 pb-0.5">Phones Centrality</span>
                          {degreeCentrality.phones.map((n) => (
                            <div key={n.id} className="flex justify-between items-center text-[10px] mt-1">
                              <span className="text-muted-foreground truncate max-w-[130px] font-data">{n.label}</span>
                              <Badge variant="outline" size="sm" className="font-data scale-85 py-0 px-1">{n.connections} links</Badge>
                            </div>
                          ))}
                        </div>

                        {/* Vehicles */}
                        <div className="space-y-1 bg-muted/10 p-2 rounded border border-border/30">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/20 pb-0.5">Vehicles Centrality</span>
                          {degreeCentrality.vehicles.map((n) => (
                            <div key={n.id} className="flex justify-between items-center text-[10px] mt-1">
                              <span className="text-muted-foreground truncate max-w-[130px] font-data font-sans">{n.label}</span>
                              <Badge variant="outline" size="sm" className="font-data scale-85 py-0 px-1">{n.connections} links</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider">
                          <Brain className="h-4 w-4" />
                          <span>Graph Centrality Vectors</span>
                        </div>
                        <Typography variant="caption" color="muted" className="leading-relaxed text-[10px]">
                          Centrality measures degree connection distributions. Suspects like Sunil Gowda act as communication brokers based on CDR call logs.
                        </Typography>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider">
                          <Info className="h-4 w-4" />
                          <span>Louvain Modularity Communities</span>
                        </div>
                        <Typography variant="caption" color="muted" className="leading-relaxed text-[10px]">
                          Community detection clusters nodes based on connection densities, grouping the network into 5 key geographical cartels inside Karnataka.
                        </Typography>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="p-4 text-xs">
                {selectedNodeDetails ? (
                  chronologicalTimeline.length > 0 ? (
                    <div className="relative border-l border-border pl-3.5 space-y-4">
                      {chronologicalTimeline.map((item, idx) => {
                        let colorClass = "bg-primary";
                        if (item.category === 'crime') colorClass = "bg-danger";
                        else if (item.category === 'vehicle') colorClass = "bg-teal-500";
                        else if (item.category === 'phone') colorClass = "bg-indigo-500";
                        else if (item.category === 'movement') colorClass = "bg-warning";
                        else if (item.category === 'police') colorClass = "bg-purple-500";

                        return (
                          <div key={idx} className="relative space-y-0.5">
                            <div className="absolute -left-[20.5px] top-1 size-2 rounded-full border border-border bg-card flex items-center justify-center">
                              <div className={cn("size-1 rounded-full", colorClass)} />
                            </div>
                            <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-2">
                              <span>{item.date}</span>
                              <Badge variant="outline" size="sm" className="scale-75 py-0 px-1 capitalize">{item.category}</Badge>
                            </div>
                            <div className="font-bold text-foreground capitalize">{item.event}</div>
                            <p className="text-[10px] text-muted-foreground leading-normal">{item.details}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                      <Clock className="h-8 w-8 opacity-45 mb-2" />
                      <span>No timeline logs found for this node.</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                    <Clock className="h-8 w-8 opacity-45 mb-2" />
                    <span>Select a node to review incident timelines.</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export function NetworkPage() {
  return (
    <ReactFlowProvider>
      <NetworkPageContent />
    </ReactFlowProvider>
  );
}

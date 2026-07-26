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
import { GlobalNetworkGraph } from './GlobalNetworkGraph';
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
        <Card className="bg-card border border-border shadow-sm shrink-0">
          <CardContent className="p-4">
            <GlobalNetworkGraph
              title="Global Network Analysis"
              description="Explore the global network graph with the same React Flow experience and officer-scoped filters used elsewhere in the app."
              showTrail
            />
          </CardContent>
        </Card>

     

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

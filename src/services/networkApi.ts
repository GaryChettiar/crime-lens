import { baseApi } from './baseApi';
import { generateMockNetworkData, type DetailedNode, type NetworkEdge, type NetworkNode } from '@/features/network/data/mockNetworkData';
export type { NetworkNode, NetworkEdge } from '@/features/network/data/mockNetworkData';

export interface ShortestPathResponse {
  pathNodeIds: string[];
  pathEdgeIds: string[];
  explanation: string;
}

export interface SharedPhone {
  phone: string;
  suspects: string[];
  riskScore: number;
  confidenceScore: number;
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface SharedVehicle {
  vehicle: string;
  suspects: string[];
  model: string;
  riskScore: number;
  confidenceScore: number;
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface CommonAssociate {
  associate: string;
  suspectsCount: number;
  role: string;
  riskScore: number;
  confidenceScore: number;
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface CommunityDetail {
  communityId: number;
  name: string;
  memberCount: number;
  primaryCrime: string;
  riskScore: number;
}

export interface EntityOption {
  id: string;
  label: string;
}

export interface EntityOptionsResponse {
  data: {
    criminals: EntityOption[];
    vehicles: EntityOption[];
    evidences: EntityOption[];
  };
}

/**
 * Network API — Criminal network analysis and graph data endpoints.
 * Interoperates with mock graphs and prepares schemas for future Neo4j queries.
 */
export const networkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNetworkGraph: builder.query<NetworkGraph, NetworkFilters | void>({
      queryFn: (filters) => {
        const { nodes, edges } = generateMockNetworkData();
        
        let filteredNodes = nodes;

        // Apply entity search query
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          filteredNodes = filteredNodes.filter(
            (n) =>
              n.label.toLowerCase().includes(searchLower) ||
              n.id.toLowerCase().includes(searchLower) ||
              (n.properties?.alias && String(n.properties.alias).toLowerCase().includes(searchLower))
          );
        }

        // Apply type filtering
        if (filters?.nodeType && filters.nodeType !== 'all') {
          filteredNodes = filteredNodes.filter((n) => n.type === filters.nodeType);
        }

        // Apply risk filter
        if (filters?.riskLevel && filters.riskLevel !== 'all') {
          filteredNodes = filteredNodes.filter((n) => {
            if (filters.riskLevel === 'critical') return n.riskScore >= 80;
            if (filters.riskLevel === 'high') return n.riskScore >= 50 && n.riskScore < 80;
            if (filters.riskLevel === 'medium') return n.riskScore >= 25 && n.riskScore < 50;
            return n.riskScore < 25;
          });
        }

        // Apply connection filter
        if (filters?.minConnections) {
          filteredNodes = filteredNodes.filter((n) => n.connections >= (filters.minConnections || 0));
        }

        // Filter edges to only link nodes present in our filtered subset
        const nodeIds = new Set(filteredNodes.map((n) => n.id));
        const filteredEdges = edges.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );

        return {
          data: {
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: {
              totalNodes: filteredNodes.length,
              totalEdges: filteredEdges.length,
              clusters: 5,
            },
          },
        };
      },
      providesTags: ['Network'],
    }),

    getNetworkNode: builder.query<DetailedNode, string>({
      queryFn: (nodeId) => {
        const { nodes } = generateMockNetworkData();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          return { error: { status: 404, data: 'Node not found' } };
        }
        return { data: node };
      },
      providesTags: (_result, _error, id) => [{ type: 'Network', id }],
    }),

    getNetworkClusters: builder.query<NetworkCluster[], void>({
      queryFn: () => {
        const clusters: NetworkCluster[] = [
          { id: 'syn-1', name: 'Bengaluru Cyber Fraud Network', nodeCount: 35, riskLevel: 'critical', keyNodes: ['susp-1', 'susp-6', 'susp-11', 'susp-16'] },
          { id: 'syn-2', name: 'Mysuru Vehicle Theft Ring', nodeCount: 28, riskLevel: 'high', keyNodes: ['susp-2', 'susp-7', 'susp-12', 'susp-17'] },
          { id: 'syn-3', name: 'Belagavi Smuggling Network', nodeCount: 22, riskLevel: 'medium', keyNodes: ['susp-3', 'susp-8', 'susp-13', 'susp-18'] },
          { id: 'syn-4', name: 'North Karnataka Drug Distribution Group', nodeCount: 18, riskLevel: 'high', keyNodes: ['susp-4', 'susp-9', 'susp-14', 'susp-19'] },
          { id: 'syn-5', name: 'Coastal Narcotics Syndicate', nodeCount: 12, riskLevel: 'low', keyNodes: ['susp-5', 'susp-10', 'susp-15', 'susp-20'] }
        ];
        return { data: clusters };
      },
      providesTags: ['Network'],
    }),

    getGlobalNetworkGraph: builder.query<GlobalNetworkGraphResponse, GlobalNetworkGraphParams | void>({
      query: (params) => ({
        url: '/network-analysis/global',
        params: {
          ...(params?.level ? { level: params.level } : {}),
          ...(params?.nodeId ? { nodeId: params.nodeId } : {}),
          ...(params?.districtId ? { districtId: params.districtId } : {}),
          ...(params?.stationId ? { stationId: params.stationId } : {}),
        },
      }),
      providesTags: ['Network'],
    }),

    getEntityOptions: builder.query<EntityOptionsResponse, void>({
      query: () => ({
        url: '/network-analysis/entity-options',
      }),
      providesTags: ['Network'],
    }),

    /**
     * NEO4J SHORTES PATH INVESTIGATION
     * Cypher Query:
     * MATCH p=shortestPath((source:Node {id: $sourceId})-[:OWNS|CALLED|INVOLVED_IN|LOCATED_AT*..5]-(target:Node {id: $targetId}))
     * RETURN p
     */
    getShortestPath: builder.query<ShortestPathResponse, { sourceId: string; targetId: string }>({
      queryFn: ({ sourceId, targetId }) => {
        const { nodes, edges } = generateMockNetworkData();
        
        // Execute real BFS pathfinder on local mock graph to find actual shortest path
        const queue: { id: string; path: string[]; edgePath: string[] }[] = [
          { id: sourceId, path: [sourceId], edgePath: [] }
        ];
        const visited = new Set<string>([sourceId]);
        let foundPath: { path: string[]; edgePath: string[] } | null = null;
        
        while (queue.length > 0) {
          const curr = queue.shift()!;
          if (curr.id === targetId) {
            foundPath = curr;
            break;
          }
          
          for (const edge of edges) {
            let neighborId: string | null = null;
            if (edge.source === curr.id) {
              neighborId = edge.target;
            } else if (edge.target === curr.id) {
              neighborId = edge.source;
            }
            
            if (neighborId && !visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push({
                id: neighborId,
                path: [...curr.path, neighborId],
                edgePath: [...curr.edgePath, edge.id]
              });
            }
          }
        }

        if (foundPath) {
          const pathSteps: string[] = [];
          foundPath.path.forEach((nodeId) => {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              pathSteps.push(`[${node.label} (${node.type.toUpperCase()})]`);
            }
          });
          const explanation = `Shortest connection established through ${foundPath.path.length - 1} hops: ` + pathSteps.join(" ➔ ");
          
          return {
            data: {
              pathNodeIds: foundPath.path,
              pathEdgeIds: foundPath.edgePath,
              explanation
            }
          };
        }

        return {
          data: {
            pathNodeIds: [],
            pathEdgeIds: [],
            explanation: `No connectivity path discovered between ${sourceId} and ${targetId} within maximum analysis depth (5 hops).`
          }
        };
      }
    }),

    /**
     * NEO4J SHARED PHONES OPERATION
     * Cypher Query:
     * MATCH (s1:Suspect {syndicate: $syndicateName})-[:OWNS]->(p:Phone)<-[:OWNS]-(s2:Suspect)
     * RETURN p.number AS phone, collect(s1.name) + collect(s2.name) AS suspects
     */
    getSharedPhones: builder.query<SharedPhone[], { syndicateId: string }>({
      queryFn: ({ syndicateId: _syndicateId }) => {
        const data: SharedPhone[] = [
          { phone: "+91 98450 10012", suspects: ["Sunil Gowda", "Guru Hegde"], riskScore: 88, confidenceScore: 94, threatLevel: "High" },
          { phone: "+91 98450 10034", suspects: ["Vijay Patil", "Anil Shetty"], riskScore: 92, confidenceScore: 88, threatLevel: "Critical" },
          { phone: "+91 98450 10056", suspects: ["Sandeep Kumar", "Deepak Swamy"], riskScore: 68, confidenceScore: 72, threatLevel: "Medium" }
        ];
        return { data };
      }
    }),

    /**
     * NEO4J SHARED VEHICLES OPERATION
     * Cypher Query:
     * MATCH (s1:Suspect {syndicate: $syndicateName})-[:OWNS]->(v:Vehicle)<-[:OWNS]-(s2:Suspect)
     * RETURN v.plate AS vehicle, collect(s1.name) + collect(s2.name) AS suspects
     */
    getSharedVehicles: builder.query<SharedVehicle[], { syndicateId: string }>({
      queryFn: ({ syndicateId: _syndicateId }) => {
        const data: SharedVehicle[] = [
          { vehicle: "KA-01-ME-1002", suspects: ["Sunil Gowda", "Vijay Patil"], model: "Toyota Fortuner", riskScore: 84, confidenceScore: 92, threatLevel: "High" },
          { vehicle: "KA-03-ME-1008", suspects: ["Guru Hegde", "Manoj Naik"], model: "Mahindra Bolero", riskScore: 78, confidenceScore: 85, threatLevel: "High" },
          { vehicle: "KA-02-ME-1015", suspects: ["Sandeep Kumar", "Anil Shetty"], model: "Maruti Swift", riskScore: 42, confidenceScore: 60, threatLevel: "Low" }
        ];
        return { data };
      }
    }),

    /**
     * NEO4J COMMON ASSOCIATES OPERATION
     * Cypher Query:
     * MATCH (s1:Suspect {syndicate: $syndicateName})-[:ASSOCIATED_WITH]-(a:Suspect)-[:ASSOCIATED_WITH]-(s2:Suspect)
     * WHERE NOT a.syndicate = $syndicateName
     * RETURN a.name AS associate, count(a) AS connectionsCount, collect(s1.name) AS suspects
     */
    getCommonAssociates: builder.query<CommonAssociate[], { syndicateId: string }>({
      queryFn: ({ syndicateId: _syndicateId }) => {
        const data: CommonAssociate[] = [
          { associate: "Ravindra Gowtham", suspectsCount: 3, role: "Logistics Broker", riskScore: 75, confidenceScore: 80, threatLevel: "High" },
          { associate: "Srinivas Manjunath", suspectsCount: 2, role: "Financial Facilitator", riskScore: 89, confidenceScore: 95, threatLevel: "Critical" },
          { associate: "Deepak Swamy", suspectsCount: 2, role: "Transit Liaison", riskScore: 54, confidenceScore: 70, threatLevel: "Medium" }
        ];
        return { data };
      }
    }),

    /**
     * NEO4J LOUVAIN COMMUNITY DETECTION
     * Cypher Query:
     * CALL gds.louvain.stream('criminalGraph')
     * YIELD nodeId, communityId
     * RETURN communityId, collect(gds.util.asNode(nodeId).name) AS members
     */
    detectCriminalCommunities: builder.query<CommunityDetail[], void>({
      queryFn: () => {
        const data: CommunityDetail[] = [
          { communityId: 0, name: "Bengaluru Cyber Core", memberCount: 78, primaryCrime: "Cybercrime/Extortion", riskScore: 82 },
          { communityId: 1, name: "Mysuru-Hassan Transit Node", memberCount: 65, primaryCrime: "Vehicle Theft/Smuggling", riskScore: 76 },
          { communityId: 2, name: "Belagavi border Smugglers", memberCount: 52, primaryCrime: "Narcotics/Smuggling", riskScore: 90 },
          { communityId: 3, name: "North Range Distribution Hub", memberCount: 45, primaryCrime: "Narcotics Trafficking", riskScore: 68 },
          { communityId: 4, name: "Coastal Narcotics Corridor", memberCount: 38, primaryCrime: "Coastal Smuggling", riskScore: 84 }
        ];
        return { data };
      }
    }),

    /**
     * POST /network-analysis
     * Build a network graph starting from a given root entity (e.g. an incident).
     */
    buildNetworkGraph: builder.mutation<CrimeNetworkGraphResponse, CrimeNetworkGraphRequest>({
      query: (body) => ({
        url: '/network-analysis',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetNetworkGraphQuery,
  useGetGlobalNetworkGraphQuery,
  useGetNetworkNodeQuery,
  useGetNetworkClustersQuery,
  useGetShortestPathQuery,
  useLazyGetShortestPathQuery,
  useGetSharedPhonesQuery,
  useGetSharedVehiclesQuery,
  useGetCommonAssociatesQuery,
  useDetectCriminalCommunitiesQuery,
  useBuildNetworkGraphMutation,
  useGetEntityOptionsQuery,
} = networkApi;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    clusters: number;
  };
}

export interface NetworkCluster {
  id: string;
  name: string;
  nodeCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyNodes: string[];
}

export interface NetworkFilters {
  search?: string;
  nodeType?: string;
  minConnections?: number;
  riskLevel?: string;
  clusterId?: string;
}

// ---------------------------------------------------------------------------
// Crime Network Analysis Types
// ---------------------------------------------------------------------------

export interface CrimeNetworkNode {
  id: string;
  type: 'incident' | 'criminal' | 'evidence' | 'vehicle' | 'alias' | 'biometric' | 'district' | 'policeStation';
  label: string;
  subtitle?: string;
  properties?: Record<string, unknown>;
}

export interface CrimeNetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface CrimeNetworkSummary {
  criminals: number;
  incidents: number;
  vehicles: number;
  aliases: number;
  evidence: number;
  districts: number;
  policeStations: number;
}

export interface CrimeNetworkGraphData {
  nodes: CrimeNetworkNode[];
  edges: CrimeNetworkEdge[];
  summary: CrimeNetworkSummary;
}

export interface CrimeNetworkGraphResponse {
  status: string;
  data: CrimeNetworkGraphData;
}

export interface GlobalNetworkGraphParams {
  level?: string;
  nodeId?: string;
  districtId?: string;
  stationId?: string;
}

export interface GlobalNetworkNode {
  id: string;
  label: string;
  type: 'STATE' | 'DISTRICT' | 'STATION' | 'policeStation' | 'incident' | 'criminal' | 'vehicle' | 'alias' | 'evidence';
  rawId?: string;
  subtitle?: string;
  properties?: Record<string, unknown>;
  canDrillDown: boolean;
  drillDown?: {
    level: string;
    nodeId: string;
  } | null;
}

export interface GlobalNetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationship?: string;
}

export interface GlobalNetworkGraphResponse {
  data: {
    nodes: GlobalNetworkNode[];
    edges: GlobalNetworkEdge[];
  };
}

export interface CrimeNetworkGraphRequest {
  root: { type: string; id: string };
  filters?: Record<string, boolean>;
}

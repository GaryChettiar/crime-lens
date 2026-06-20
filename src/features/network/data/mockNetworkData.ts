export interface NetworkNode {
  id: string;
  label: string;
  type: 'suspect' | 'crime' | 'location' | 'vehicle' | 'phone' | 'police_station';
  properties: Record<string, unknown> & { communityId?: number };
  riskScore: number;
  connections: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, unknown>;
}

const SUSPECT_NAMES = [
  "Sunil Gowda", "Vijay Patil", "Sandeep Kumar", "Guru Hegde", "Manoj Naik", 
  "Anil Shetty", "Santosh Prasad", "Deepak Swamy", "Ravindra Gowtham", "Srinivas Manjunath",
  "Karthik Venkatesh", "Abhishek Harish", "Pramod Anand", "Chethan Ramesh", "Deepak Suresh",
  "Rajesh Shiva", "Arun Jagadish", "Sanjay Raghu", "Ravindra Murthy", "Srinivas Chetan",
  "Raghavendra Hemanth", "Deepak Prakash", "Sunil Kiran", "Vijay Naveen", "Sandeep Bharath",
  "Guru Raju", "Manoj Lokesh", "Anil Madhu", "Santosh Vinay", "Abhishek Puneeth",
  "Karthik Darshan", "Sunil Yash", "Vijay Sudeep", "Sandeep Shivaraj", "Manoj Chandru",
  "Anil Mohan", "Santosh Gangadhar", "Pramod Nagesh", "Chethan Satish", "Deepak Bhaskar",
  "Rajesh Ranganath", "Arun Somesh", "Sanjay Devaraj", "Raghavendra Ashok", "Deepak Shankar",
  "Sunil Umesh", "Vijay Mahesh", "Sandeep Gururaj", "Guru Krishna", "Manoj Ramachandra"
];

const KARNATAKA_DISTRICTS = [
  "Bangalore Urban", "Mysore", "Belgaum", "Gulbarga", "Dakshina Kannada", "Dharwad", "Bellary",
  "Bidar", "Bijapur", "Chikmagalur", "Chitradurga", "Davanagere", "Hassan", "Kolar",
  "Mandya", "Shimoga", "Tumkur", "Udupi", "Uttara Kannada", "Bagalkot", "Chamarajanagar",
  "Chikkaballapura", "Gadag", "Haveri", "Kodagu", "Koppal", "Raichur", "Ramanagara",
  "Yadgir", "Vijayanagara", "Kolar Gold Fields"
];

const POLICE_STATIONS = [
  "Indiranagar PS", "Koramangala PS", "M.G. Road PS", "Whitefield PS", 
  "Mysore Central PS", "Belgaum North PS", "Hubli Town PS", "Gulbarga Station PS",
  "Mangalore Port PS", "Bellary Cantonment PS", "Shimoga Town PS", "Bidar Central PS"
];

export interface DetailedNode extends NetworkNode {
  propertiesList: { label: string; value: string }[];
  timeline: { date: string; event: string; details: string }[];
  aiInsights: string[];
}

export function generateMockNetworkData() {
  // 1. Districts (Locations) - 31 items
  const locations: DetailedNode[] = KARNATAKA_DISTRICTS.map((dist, i) => {
    const id = `loc-${i + 1}`;
    const anomalyIndex = i % 3 === 0 ? "Elevated" : "Normal";
    const zone = i % 4 === 0 ? "Central Division" : i % 4 === 1 ? "South Range" : i % 4 === 2 ? "North Range" : "Coastal Range";
    const communityId = i % 5;
    
    return {
      id,
      label: dist,
      type: 'location' as const,
      riskScore: i % 3 === 0 ? 80 : i % 3 === 1 ? 50 : 20,
      connections: 0,
      properties: {
        district: dist,
        zone,
        anomalyIndex,
        communityId,
      },
      propertiesList: [
        { label: "District Name", value: dist },
        { label: "Region Zone", value: zone },
        { label: "Command Office", value: `${dist} Police Commissionerate` },
        { label: "Anomaly Index", value: anomalyIndex },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: "2026-06-05", event: "Increased Anomaly Activity", details: `District reported elevated communications volume and vehicle crossings.` }
      ],
      aiInsights: [
        `District serves as a logistical node for cross-state smuggling routes.`,
        `Significant correlations registered between cell tower spikes and local crime reports.`
      ]
    };
  });

  // 2. Suspects (50 items)
  const suspects: DetailedNode[] = SUSPECT_NAMES.map((name, i) => {
    const id = `susp-${i + 1}`;
    const riskScore = Math.floor(40 + (i * 1.7) % 56); // 40 to 95
    const district = KARNATAKA_DISTRICTS[i % KARNATAKA_DISTRICTS.length];
    const crimesList = ["narcotics", "burglary", "extortion", "homicide", "smuggling"];
    const primaryCrime = crimesList[i % crimesList.length];
    
    // Karnataka Focused Syndicate Names
    const syndicateList = [
      "Bengaluru Cyber Fraud Network",
      "Mysuru Vehicle Theft Ring",
      "Belagavi Smuggling Network",
      "North Karnataka Drug Distribution Group",
      "Coastal Narcotics Syndicate"
    ];
    const syndicate = syndicateList[i % 5];
    const communityId = i % 5;
    const status = riskScore > 80 ? "Warrant Issued" : "Under Active Surveillance";
    const alias = `${name.split(' ')[1]} Bhai`;
    
    return {
      id,
      label: name,
      type: 'suspect' as const,
      riskScore,
      connections: 0,
      properties: {
        alias,
        activeArea: district,
        primaryCrime,
        syndicate,
        status,
        communityId,
      },
      propertiesList: [
        { label: "Alias / Street Name", value: alias },
        { label: "Active Area", value: `${district}, Karnataka` },
        { label: "Primary Crime Type", value: primaryCrime },
        { label: "Associated Syndicate", value: syndicate },
        { label: "Surveillance Status", value: status },
        { label: "Last Sighted", value: `2026-06-${String(1 + (i % 7)).padStart(2, '0')}` },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: `2026-06-0${1 + (i % 5)}`, event: "Cladestine Association", details: `Visual contact reported in joint gathering at ${district}.` },
        { date: `2026-05-${20 + (i % 8)}`, event: "Suspicious Deposit", details: `Alert raised on cash transaction exceeding limits by shell LLC.` }
      ],
      aiInsights: [
        `Primary operational broker for ${primaryCrime} activities within the ${district} border corridor.`,
        `Direct cell tower pings match known burner line profiles associated with key money laundering conduits.`,
        `Recommendation: Issue search warrant authorization and mobile location interception.`
      ]
    };
  });

  // 3. Crimes (100 items)
  const crimes: DetailedNode[] = Array.from({ length: 100 }).map((_, i) => {
    const id = `crime-${i + 1}`;
    const idx = i + 1;
    const district = KARNATAKA_DISTRICTS[i % KARNATAKA_DISTRICTS.length];
    const types = ["narcotics", "burglary", "assault", "theft", "cyber", "homicide", "extortion", "smuggling"];
    const type = types[i % types.length];
    const severity = i % 4 === 0 ? 'critical' : i % 4 === 1 ? 'high' : i % 4 === 2 ? 'medium' : 'low';
    const status = i % 3 === 0 ? "open" : i % 3 === 1 ? "investigating" : "resolved";
    const caseNumber = `KA-2026-C${String(100 + idx).slice(1)}`;
    const communityId = i % 5;
    
    return {
      id,
      label: caseNumber,
      type: 'crime' as const,
      riskScore: severity === 'critical' ? 95 : severity === 'high' ? 75 : severity === 'medium' ? 50 : 25,
      connections: 0,
      properties: {
        caseNumber,
        type,
        location: district,
        severity,
        status,
        communityId,
      },
      propertiesList: [
        { label: "Case File Number", value: caseNumber },
        { label: "Crime Category", value: type },
        { label: "Location Zone", value: `${district} Police Jurisdiction` },
        { label: "Occurrence Date", value: `2026-06-${String(1 + (i % 6)).padStart(2, '0')} ${String(10 + (i % 12)).padStart(2, '0')}:30` },
        { label: "Severity Grading", value: severity.toUpperCase() },
        { label: "Investigative State", value: status.toUpperCase() },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: `2026-06-0${1 + (i % 4)}`, event: "Incident Report Filed", details: "Emergency dispatch registered and scene secured." },
        { date: `2026-06-0${2 + (i % 4)}`, event: "Forensic Collection", details: "Acquired forensic details, mobile call records, and regional CCTV logs." }
      ],
      aiInsights: [
        `Tactical signature shows strong matches with organized ${type} syndicates.`,
        `Occurred in an identified transit corridor often used for smuggling route bypasses.`
      ]
    };
  });

  // 4. Vehicles (80 items)
  const vehicles: DetailedNode[] = Array.from({ length: 80 }).map((_, i) => {
    const id = `veh-${i + 1}`;
    const idx = i + 1;
    const plate = `KA-0${1 + (i % 9)}-ME-${String(1000 + idx).slice(1)}`;
    const models = ["Toyota Fortuner", "Mahindra Bolero", "Maruti Swift", "Tata Nexon", "Hyundai Creta"];
    const model = models[i % models.length];
    const color = ["White", "Black", "Dark Grey", "Silver", "Red"][i % 5];
    const flagStatus = i % 5 === 0 ? "Flagged: Cartel Transport" : "Clean";
    const communityId = i % 5;
    
    return {
      id,
      label: plate,
      type: 'vehicle' as const,
      riskScore: i % 5 === 0 ? 85 : i % 5 === 2 ? 60 : 30,
      connections: 0,
      properties: {
        plate,
        model,
        color,
        flagStatus,
        communityId,
      },
      propertiesList: [
        { label: "License Plate", value: plate },
        { label: "Vehicle Model", value: model },
        { label: "Exterior Color", value: color },
        { label: "Registry Division", value: "Karnataka RTO" },
        { label: "Alert Flags", value: flagStatus },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: "2026-06-05", event: "Automated ANPR Log", details: `Detected passing National Highway toll gate.` },
        { date: "2026-06-02", event: "Visual Patrol Sighting", details: `Parked near suspected safehouse location.` }
      ],
      aiInsights: [
        `Vehicle logs match transport schedules of high-priority narcotics distribution networks.`,
        `Commonly associated with secondary suspect transit nodes.`
      ]
    };
  });

  // 5. Phones (120 items)
  const phones: DetailedNode[] = Array.from({ length: 120 }).map((_, i) => {
    const id = `phone-${i + 1}`;
    const idx = i + 1;
    const number = `+91 98450 ${String(10000 + idx).slice(1)}`;
    const carriers = ["Airtel", "Jio", "BSNL", "Vodafone-Idea"];
    const carrier = carriers[i % carriers.length];
    const status = i % 4 === 0 ? "Under Intercept" : "Passive Surveillance";
    const communityId = i % 5;
    
    return {
      id,
      label: number,
      type: 'phone' as const,
      riskScore: i % 4 === 0 ? 90 : i % 4 === 2 ? 65 : 20,
      connections: 0,
      properties: {
        number,
        carrier,
        status,
        communityId,
      },
      propertiesList: [
        { label: "Phone Number", value: number },
        { label: "IMEI Number", value: `35894109${200000 + idx}8` },
        { label: "Carrier Network", value: carrier },
        { label: "CDR Tap Status", value: status },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: "2026-06-06", event: "Intercept Logged", details: `Call record captured between key suspect burner and anonymous receiver.` },
        { date: "2026-06-04", event: "Cell Tower Ping", details: `Registered connection near border range area.` }
      ],
      aiInsights: [
        `Burner phone profile verified: short lifespan, single cell-tower registrations, and zero personal logins.`,
        `Frequent communications logged immediately before critical incident timestamps.`
      ]
    };
  });

  // 6. Police Stations (15 items)
  const policeStations: DetailedNode[] = Array.from({ length: 15 }).map((_, i) => {
    const id = `ps-${i + 1}`;
    const name = POLICE_STATIONS[i % POLICE_STATIONS.length];
    const district = KARNATAKA_DISTRICTS[i % KARNATAKA_DISTRICTS.length];
    const communityId = i % 5;
    
    return {
      id,
      label: name,
      type: 'police_station' as const,
      riskScore: Math.floor(25 + (i * 4) % 35),
      connections: 0,
      properties: {
        name,
        district,
        communityId,
        officersCount: 20 + (i * 2) % 30,
      },
      propertiesList: [
        { label: "Station Name", value: name },
        { label: "District Jurisdiction", value: district },
        { label: "Command Division", value: `${district} Division` },
        { label: "Active Officers", value: String(20 + (i * 2) % 30) },
        { label: "Louvain Community ID", value: String(communityId) }
      ],
      timeline: [
        { date: "2026-06-05", event: "Patrol Dispatched", details: `Increased mobile coverage across suspected local warehouses.` }
      ],
      aiInsights: [
        `Local station serves as the primary command center for Sector ${i + 1} incidents.`,
        `Coordinates real-time response feeds and CCTV surveillance links.`
      ]
    };
  });

  // Generate Edges deterministic relationships
  const edges: NetworkEdge[] = [];
  
  // Connect Suspects to Phone, Vehicle, Locations, and Police Stations
  suspects.forEach((s, i) => {
    // Each suspect owns a primary phone
    const phoneId = `phone-${i + 1}`;
    edges.push({
      id: `edge-owns-ph-${s.id}`,
      source: s.id,
      target: phoneId,
      type: "owns",
      weight: 1,
      properties: {}
    });

    // 40 suspects own a vehicle
    if (i < 40) {
      const vehId = `veh-${i + 1}`;
      edges.push({
        id: `edge-owns-vh-${s.id}`,
        source: s.id,
        target: vehId,
        type: "owns",
        weight: 1,
        properties: {}
      });
      
      // Locate vehicle at their district location
      const locId = `loc-${(i % 31) + 1}`;
      edges.push({
        id: `edge-loc-vh-${vehId}`,
        source: vehId,
        target: locId,
        type: "located_at",
        weight: 1,
        properties: {}
      });
    }

    // Located At district
    const locId = `loc-${(i % 31) + 1}`;
    edges.push({
      id: `edge-loc-susp-${s.id}`,
      source: s.id,
      target: locId,
      type: "located_at",
      weight: 2,
      properties: {}
    });

    // Associated with accomplice suspects
    const accompliceIdx = (i + 1) % suspects.length;
    edges.push({
      id: `edge-assoc-susp-${s.id}-${suspects[accompliceIdx].id}`,
      source: s.id,
      target: suspects[accompliceIdx].id,
      type: "associated_with",
      weight: Math.floor(2 + (i % 4)), // weight 2-5 represents association strength
      properties: {}
    });

    // Link suspect to local police station
    const psId = `ps-${(i % 15) + 1}`;
    edges.push({
      id: `edge-ps-susp-${s.id}`,
      source: s.id,
      target: psId,
      type: "under_jurisdiction",
      weight: 1,
      properties: {}
    });
  });

  // Connect Crimes to Locations, Suspects, and Police Stations
  crimes.forEach((c, i) => {
    // Crime located at location
    const locId = `loc-${(i % 31) + 1}`;
    edges.push({
      id: `edge-loc-crime-${c.id}`,
      source: c.id,
      target: locId,
      type: "located_at",
      weight: 1,
      properties: {}
    });

    // Crime has a primary suspect
    const suspId = `susp-${(i % 50) + 1}`;
    edges.push({
      id: `edge-inv-crime-1-${c.id}`,
      source: suspId,
      target: c.id,
      type: "involved_in",
      weight: 3,
      properties: {}
    });

    // 30 crimes involve a second suspect
    if (i < 30) {
      const secondSuspId = `susp-${((i + 7) % 50) + 1}`;
      edges.push({
        id: `edge-inv-crime-2-${c.id}`,
        source: secondSuspId,
        target: c.id,
        type: "involved_in",
        weight: 3,
        properties: {}
      });
    }

    // Link crime to local police station
    const psId = `ps-${(i % 15) + 1}`;
    edges.push({
      id: `edge-ps-crime-${c.id}`,
      source: c.id,
      target: psId,
      type: "investigated_by",
      weight: 2,
      properties: {}
    });
  });

  // Connect Phone call connections
  for (let i = 0; i < 40; i++) {
    const sourcePhone = `phone-${i + 1}`;
    const targetPhone = `phone-${((i + 13) % 120) + 1}`;
    edges.push({
      id: `edge-call-ph-${sourcePhone}-${targetPhone}`,
      source: sourcePhone,
      target: targetPhone,
      type: "called",
      weight: Math.floor(1 + (i % 8)),
      properties: { callCount: 5 + i }
    });
  }

  // Calculate connections count per node
  const connectionsCount: Record<string, number> = {};
  edges.forEach((e) => {
    connectionsCount[e.source] = (connectionsCount[e.source] || 0) + 1;
    connectionsCount[e.target] = (connectionsCount[e.target] || 0) + 1;
  });

  const nodes = [...suspects, ...crimes, ...vehicles, ...phones, ...locations, ...policeStations].map((node) => ({
    ...node,
    connections: connectionsCount[node.id] || 0
  }));

  return { nodes, edges };
}

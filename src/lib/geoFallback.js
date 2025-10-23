// GeoDNS fallback logic - find nearest agent for location

// Distance/priority map between locations (lower = closer)
const LOCATION_DISTANCES = {
  // Continents
  europe: {
    europe: 0,
    "north-america": 2,
    "south-america": 3,
    africa: 1,
    asia: 2,
    oceania: 4,
  },
  "north-america": {
    "north-america": 0,
    europe: 2,
    "south-america": 1,
    africa: 3,
    asia: 3,
    oceania: 4,
  },
  "south-america": {
    "south-america": 0,
    "north-america": 1,
    europe: 3,
    africa: 2,
    asia: 4,
    oceania: 4,
  },
  africa: {
    africa: 0,
    europe: 1,
    asia: 2,
    "north-america": 3,
    "south-america": 2,
    oceania: 4,
  },
  asia: {
    asia: 0,
    oceania: 1,
    europe: 2,
    africa: 2,
    "north-america": 3,
    "south-america": 4,
  },
  oceania: {
    oceania: 0,
    asia: 1,
    "south-america": 4,
    "north-america": 4,
    europe: 4,
    africa: 4,
  },

  // Countries -> Continents
  // North America
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  
  // Europe
  RU: "europe",
  TR: "europe",
  FR: "europe",  // France
  DE: "europe",  // Germany
  GB: "europe",  // United Kingdom
  IT: "europe",  // Italy
  ES: "europe",  // Spain
  PL: "europe",  // Poland
  UA: "europe",  // Ukraine
  NL: "europe",  // Netherlands
  BE: "europe",  // Belgium
  SE: "europe",  // Sweden
  NO: "europe",  // Norway
  FI: "europe",  // Finland
  DK: "europe",  // Denmark
  CH: "europe",  // Switzerland
  AT: "europe",  // Austria
  CZ: "europe",  // Czech Republic
  PT: "europe",  // Portugal
  GR: "europe",  // Greece
  RO: "europe",  // Romania
  HU: "europe",  // Hungary
  IE: "europe",  // Ireland
  
  // Asia
  CN: "asia",
  JP: "asia",
  KZ: "asia",
  IR: "asia",
  AE: "asia",
  IN: "asia",
  KR: "asia",
  SG: "asia",
  
  // Oceania
  AU: "oceania",
  NZ: "oceania",
  
  // South America
  BR: "south-america",
  AR: "south-america",
  
  // Africa
  ZA: "africa",
  EG: "africa",
};

// Get continent for a country code
function getContinentForCountry(countryCode) {
  return LOCATION_DISTANCES[countryCode] || null;
}

// Get distance between two locations
function getDistance(from, to) {
  const fromContinent = typeof LOCATION_DISTANCES[from] === "string" 
    ? LOCATION_DISTANCES[from] 
    : from;
  const toContinent = typeof LOCATION_DISTANCES[to] === "string" 
    ? LOCATION_DISTANCES[to] 
    : to;

  // Same location = 0
  if (from === to) return 0;
  
  // Same continent for countries
  if (fromContinent === toContinent && fromContinent !== from) return 0.5;

  // Get distance from map
  if (LOCATION_DISTANCES[fromContinent] && LOCATION_DISTANCES[fromContinent][toContinent] !== undefined) {
    return LOCATION_DISTANCES[fromContinent][toContinent];
  }

  return 999; // Unknown = very far
}

/**
 * Find best ACTIVE agent for a location based on IP geolocation distance
 * NO assignment required - just picks nearest active agent dynamically
 * @param {string} locationCode - Location code (us, europe, etc.)
 * @param {Array} allAgents - All available agents with IP addresses and ipInfo
 * @returns {Object|null} - { agentId, agentIp, locationCode, distance }
 */
export function findBestAgentForLocation(locationCode, allAgents) {
  // Filter only ACTIVE agents with IP addresses
  const activeAgents = allAgents.filter(a => a.isActive && a.ipAddress);
  
  if (activeAgents.length === 0) {
    return null; // No active agents available
  }

  // Find agents with matching location (exact match by IP geolocation)
  const matchingAgents = activeAgents.filter(agent => {
    if (!agent.ipInfo || !agent.ipInfo.countryCode) return false;
    
    const agentCountryCode = agent.ipInfo.countryCode.toUpperCase();
    
    // Check if agent's location matches requested location
    // For country codes (us, ru, etc.)
    if (locationCode.length === 2) {
      return agentCountryCode === locationCode.toUpperCase();
    }
    
    // For continent codes (europe, asia, etc.)
    const agentContinent = LOCATION_DISTANCES[agentCountryCode];
    if (typeof agentContinent === 'string') {
      return agentContinent === locationCode;
    }
    
    return false;
  });

  // If we have exact match - use first one
  if (matchingAgents.length > 0) {
    const agent = matchingAgents[0];
    return {
      agentId: agent.agentId,
      agentIp: agent.ipAddress,
      agentName: agent.name,
      locationCode: locationCode,
      distance: 0,
      isDirect: true,
    };
  }

  // No exact match - find nearest agent by distance
  const agentsWithDistance = activeAgents
    .map(agent => {
      if (!agent.ipInfo || !agent.ipInfo.countryCode) {
        return { agent, distance: 999 }; // Unknown location - very far
      }
      
      const agentCountryCode = agent.ipInfo.countryCode.toUpperCase();
      const agentLocation = LOCATION_DISTANCES[agentCountryCode];
      const agentLocationCode = typeof agentLocation === 'string' ? agentLocation : agentCountryCode.toLowerCase();
      
      const distance = getDistance(locationCode, agentLocationCode);
      return { agent, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  if (agentsWithDistance.length > 0) {
    const nearest = agentsWithDistance[0];
    return {
      agentId: nearest.agent.agentId,
      agentIp: nearest.agent.ipAddress,
      agentName: nearest.agent.name,
      locationCode: locationCode,
      distance: nearest.distance,
      isDirect: false,
    };
  }

  return null;
}

/**
 * Build anycast DNS records for all locations
 * @param {Object} domain - Domain object with geoDnsConfig
 * @param {Array} allAgents - All available agents
 * @returns {Array} - DNS records for anycast subdomains
 */
export function buildAnycastRecords(domain, allAgents) {
  const records = [];
  
  console.log(`[Build Anycast] Domain: ${domain.domain}`);
  console.log(`  GeoDNS locations: ${domain.geoDnsConfig?.length || 0}`);
  console.log(`  Available agents: ${allAgents.length}`);
  
  for (const location of domain.geoDnsConfig || []) {
    const result = findBestAgentForLocation(location.code, allAgents);

    if (result) {
      records.push({
        name: location.code,  // "europe", "us", etc.
        type: "A",
        value: result.agentIp,
        ttl: 60, // Low TTL for dynamic updates
        agentId: result.agentId,
        agentName: result.agentName,
        locationCode: location.code,
        distance: result.distance,
        isDirect: result.isDirect,
        description: result.isDirect 
          ? `Direct: ${result.agentName}`
          : `Nearest: ${result.agentName} (distance: ${result.distance})`,
      });
      console.log(`  ✓ ${location.code} → ${result.agentIp} (${result.agentName}) ${result.isDirect ? 'DIRECT' : `fallback:${result.distance}`}`);
    } else {
      // No agent available for this location - could add warning
      records.push({
        name: `${location.code}`,
        type: "A",
        value: null, // No agent available
        ttl: 60,
        error: "No agent available for this location",
        locationCode: location.code,
      });
      console.log(`  ✗ ${location.code} → NO AGENT`);
    }
  }
  
  console.log(`[Build Anycast] Generated ${records.filter(r => r.value).length}/${records.length} anycast records`);

  return records;
}

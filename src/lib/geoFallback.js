// GeoDNS fallback logic - find nearest agent for location

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Central coordinates for countries (lat, lon)
// Geographic center of each country for distance calculations
const LOCATION_COORDINATES = {
  // North America
  us: { lat: 39.8283, lon: -98.5795 }, // United States
  ca: { lat: 56.1304, lon: -106.3468 }, // Canada
  mx: { lat: 23.6345, lon: -102.5528 }, // Mexico

  // South America
  br: { lat: -14.235, lon: -51.9253 }, // Brazil
  ar: { lat: -38.4161, lon: -63.6167 }, // Argentina
  cl: { lat: -35.6751, lon: -71.543 }, // Chile
  co: { lat: 4.5709, lon: -74.2973 }, // Colombia
  pe: { lat: -9.19, lon: -75.0152 }, // Peru

  // Europe
  ru: { lat: 61.524, lon: 105.3188 }, // Russia
  gb: { lat: 55.3781, lon: -3.436 }, // United Kingdom
  de: { lat: 51.1657, lon: 10.4515 }, // Germany
  fr: { lat: 46.2276, lon: 2.2137 }, // France
  it: { lat: 41.8719, lon: 12.5674 }, // Italy
  es: { lat: 40.4637, lon: -3.7492 }, // Spain
  pl: { lat: 51.9194, lon: 19.1451 }, // Poland
  ua: { lat: 48.3794, lon: 31.1656 }, // Ukraine
  nl: { lat: 52.1326, lon: 5.2913 }, // Netherlands
  se: { lat: 60.1282, lon: 18.6435 }, // Sweden
  no: { lat: 60.472, lon: 8.4689 }, // Norway
  fi: { lat: 61.9241, lon: 25.7482 }, // Finland
  dk: { lat: 56.2639, lon: 9.5018 }, // Denmark
  ch: { lat: 46.8182, lon: 8.2275 }, // Switzerland
  at: { lat: 47.5162, lon: 14.5501 }, // Austria
  be: { lat: 50.5039, lon: 4.4699 }, // Belgium
  cz: { lat: 49.8175, lon: 15.473 }, // Czech Republic
  pt: { lat: 39.3999, lon: -8.2245 }, // Portugal
  gr: { lat: 39.0742, lon: 21.8243 }, // Greece
  ro: { lat: 45.9432, lon: 24.9668 }, // Romania
  hu: { lat: 47.1625, lon: 19.5033 }, // Hungary
  ie: { lat: 53.4129, lon: -8.2439 }, // Ireland
  tr: { lat: 38.9637, lon: 35.2433 }, // Turkey

  // Asia
  cn: { lat: 35.8617, lon: 104.1954 }, // China
  jp: { lat: 36.2048, lon: 138.2529 }, // Japan
  in: { lat: 20.5937, lon: 78.9629 }, // India
  kr: { lat: 35.9078, lon: 127.7669 }, // South Korea
  kz: { lat: 48.0196, lon: 66.9237 }, // Kazakhstan
  ir: { lat: 32.4279, lon: 53.688 }, // Iran
  ae: { lat: 23.4241, lon: 53.8478 }, // UAE
  sg: { lat: 1.3521, lon: 103.8198 }, // Singapore
  id: { lat: -0.7893, lon: 113.9213 }, // Indonesia
  th: { lat: 15.87, lon: 100.9925 }, // Thailand
  my: { lat: 4.2105, lon: 101.9758 }, // Malaysia
  vn: { lat: 14.0583, lon: 108.2772 }, // Vietnam
  ph: { lat: 12.8797, lon: 121.774 }, // Philippines
  pk: { lat: 30.3753, lon: 69.3451 }, // Pakistan
  bd: { lat: 23.685, lon: 90.3563 }, // Bangladesh
  il: { lat: 31.0461, lon: 34.8516 }, // Israel
  sa: { lat: 23.8859, lon: 45.0792 }, // Saudi Arabia
  iq: { lat: 33.2232, lon: 43.6793 }, // Iraq

  // Africa
  za: { lat: -30.5595, lon: 22.9375 }, // South Africa
  eg: { lat: 26.8206, lon: 30.8025 }, // Egypt
  ng: { lat: 9.082, lon: 8.6753 }, // Nigeria
  ke: { lat: -0.0236, lon: 37.9062 }, // Kenya
  ma: { lat: 31.7917, lon: -7.0926 }, // Morocco
  tz: { lat: -6.369, lon: 34.8888 }, // Tanzania
  gh: { lat: 7.9465, lon: -1.0232 }, // Ghana
  dz: { lat: 28.0339, lon: 1.6596 }, // Algeria

  // Oceania
  au: { lat: -25.2744, lon: 133.7751 }, // Australia
  nz: { lat: -40.9006, lon: 174.886 }, // New Zealand
};

// Distance/priority map between locations (lower = closer)
// Used as FALLBACK when coordinates are not available
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
  FR: "europe", // France
  DE: "europe", // Germany
  GB: "europe", // United Kingdom
  IT: "europe", // Italy
  ES: "europe", // Spain
  PL: "europe", // Poland
  UA: "europe", // Ukraine
  NL: "europe", // Netherlands
  BE: "europe", // Belgium
  SE: "europe", // Sweden
  NO: "europe", // Norway
  FI: "europe", // Finland
  DK: "europe", // Denmark
  CH: "europe", // Switzerland
  AT: "europe", // Austria
  CZ: "europe", // Czech Republic
  PT: "europe", // Portugal
  GR: "europe", // Greece
  RO: "europe", // Romania
  HU: "europe", // Hungary
  IE: "europe", // Ireland

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
function _getContinentForCountry(countryCode) {
  return LOCATION_DISTANCES[countryCode] || null;
}

// Get distance between two locations
function getDistance(from, to) {
  const fromContinent =
    typeof LOCATION_DISTANCES[from] === "string"
      ? LOCATION_DISTANCES[from]
      : from;
  const toContinent =
    typeof LOCATION_DISTANCES[to] === "string" ? LOCATION_DISTANCES[to] : to;

  // Same location = 0
  if (from === to) return 0;

  // Same continent for countries
  if (fromContinent === toContinent && fromContinent !== from) return 0.5;

  // Get distance from map
  if (
    LOCATION_DISTANCES[fromContinent] &&
    LOCATION_DISTANCES[fromContinent][toContinent] !== undefined
  ) {
    return LOCATION_DISTANCES[fromContinent][toContinent];
  }

  return 999; // Unknown = very far
}

/**
 * Find ALL ACTIVE agents for a location (for DNS load balancing)
 * Returns array of agents sorted by load score (best first)
 * @param {string} locationCode - Location code (us, europe, etc.)
 * @param {Array} allAgents - All available agents with IP addresses, ipInfo, and loadScore
 * @returns {Array} - Array of { agentId, agentIp, agentName, loadScore, weight }
 */
export function findAllAgentsForLocation(locationCode, allAgents) {
  // Filter only ACTIVE agents with IP addresses
  const activeAgents = allAgents.filter((a) => a.isActive && a.ipAddress);

  if (activeAgents.length === 0) {
    return []; // No active agents available
  }

  // Find agents with matching location (exact match by manual location OR IP geolocation)
  const matchingAgents = activeAgents.filter((agent) => {
    // Priority 1: Check manual location override first
    if (agent.manualLocation && agent.manualLocation.country) {
      const manualCountryCode = agent.manualLocation.country.toUpperCase();
      return manualCountryCode === locationCode.toUpperCase();
    }

    // Priority 2: Fall back to IP geolocation
    if (!agent.ipInfo || !agent.ipInfo.countryCode) return false;

    const agentCountryCode = agent.ipInfo.countryCode.toUpperCase();

    // Check if agent's location matches requested location (country codes only)
    return agentCountryCode === locationCode.toUpperCase();
  });

  if (matchingAgents.length === 0) {
    return []; // No matching agents for this location
  }

  // Calculate weight for each agent based on load score
  // Lower load = higher weight (more traffic)
  // Weight formula: 100 - loadScore (so 20% load = 80 weight, 80% load = 20 weight)
  const agentsWithWeights = matchingAgents.map((agent) => {
    const loadScore = agent.loadScore || 0;
    const weight = Math.max(1, 100 - loadScore); // Minimum weight of 1

    return {
      agentId: agent.agentId,
      agentIp: agent.ipAddress,
      agentName: agent.name,
      loadScore: loadScore,
      weight: weight,
      isOverloaded: loadScore > 80,
    };
  });

  // Sort by load score (best agents first)
  agentsWithWeights.sort((a, b) => a.loadScore - b.loadScore);

  return agentsWithWeights;
}

/**
 * Find best ACTIVE agent for a location based on real geographic distance and load balancing
 * Uses Haversine formula with lat/lon coordinates
 * Implements load-based selection: prefers agents with lower loadScore
 * @param {string} locationCode - Location code (us, europe, etc.)
 * @param {Array} allAgents - All available agents with IP addresses, ipInfo, and loadScore
 * @returns {Object|null} - { agentId, agentIp, locationCode, distance, distanceKm, loadScore, poolSize }
 */
export function findBestAgentForLocation(locationCode, allAgents) {
  // Filter only ACTIVE agents with IP addresses
  const activeAgents = allAgents.filter((a) => a.isActive && a.ipAddress);

  if (activeAgents.length === 0) {
    return []; // No active agents available
  }

  // Find agents with matching location (exact match by manual location OR IP geolocation)
  const matchingAgents = activeAgents.filter((agent) => {
    // Priority 1: Check manual location override first
    if (agent.manualLocation && agent.manualLocation.country) {
      const manualCountryCode = agent.manualLocation.country.toUpperCase();
      return manualCountryCode === locationCode.toUpperCase();
    }

    // Priority 2: Fall back to IP geolocation
    if (!agent.ipInfo || !agent.ipInfo.countryCode) return false;

    const agentCountryCode = agent.ipInfo.countryCode.toUpperCase();

    // Check if agent's location matches requested location (country codes only)
    return agentCountryCode === locationCode.toUpperCase();
  });

  if (matchingAgents.length === 0) {
    return []; // No matching agents for this location
  }

  // Calculate weight for each agent based on load score
  // Lower load = higher weight (more traffic)
  // Weight formula: 100 - loadScore (so 20% load = 80 weight, 80% load = 20 weight)
  const agentsWithWeights = matchingAgents.map((agent) => {
    const loadScore = agent.loadScore || 0;
    const weight = Math.max(1, 100 - loadScore); // Minimum weight of 1

    return {
      agentId: agent.agentId,
      agentIp: agent.ipAddress,
      agentName: agent.name,
      loadScore: loadScore,
      weight: weight,
      isOverloaded: loadScore > 80,
    };
  });

  // Sort by load score (best agents first)
  agentsWithWeights.sort((a, b) => a.loadScore - b.loadScore);

  return agentsWithWeights;
}

/**
 * Build anycast DNS records for all locations
 * @param {Object} domain - Domain object with geoDnsConfig
 * @param {Array} allAgents - All available agents
 * @returns {Array} - DNS records for anycast subdomains
 */
export function buildAnycastRecords(domain, allAgents) {
  const records = [];
  const processedLocations = new Set();

  // Only log detailed info occasionally to reduce spam
  const shouldLogDetails = Math.random() < 0.02; // 2% chance to log details

  if (shouldLogDetails) {
    console.log(`[Build Anycast] Domain: ${domain.domain}`);
    console.log(`  GeoDNS locations: ${domain.geoDnsConfig?.length || 0}`);
    console.log(`  Available agents: ${allAgents.length}`);
  }

  // Step 1: Process configured locations from geoDnsConfig
  for (const location of domain.geoDnsConfig || []) {
    processedLocations.add(location.code.toLowerCase());

    // Get ALL agents for this location (for load balancing)
    const locationAgents = findAllAgentsForLocation(location.code, allAgents);

    if (locationAgents.length > 0) {
      // Create record with array of agents for DNS load balancing
      records.push({
        name: location.code, // "europe", "us", etc.
        type: "A",
        agents: locationAgents, // Array of agents with weights
        ttl: 60, // Low TTL for dynamic updates
        locationCode: location.code,
        isDirect: true,
        description: `${locationAgents.length} agent(s) available`,
      });

      if (shouldLogDetails) {
        console.log(`  ✓ ${location.code} → ${locationAgents.length} agents:`);
        locationAgents.forEach((a) => {
          console.log(
            `    - ${a.agentName} (${a.agentIp}): load=${a.loadScore}%, weight=${a.weight}`,
          );
        });
      }
    } else {
      // No agent available for this location
      records.push({
        name: `${location.code}`,
        type: "A",
        agents: [], // No agents available
        ttl: 60,
        error: "No agent available for this location",
        locationCode: location.code,
      });
      console.log(`  ✗ ${location.code} → NO AGENT`);
    }
  }

  // Only log auto-discovery details occasionally to reduce spam
  const shouldLogAutoDiscovery = Math.random() < 0.05; // 5% chance to log auto-discovery

  // Removed excessive auto-discovery logging
  // Only log when there are actual changes or errors

  const activeAgents = allAgents.filter((a) => a.isActive && a.ipAddress);

  // Group agents by country code for auto-discovery
  const agentsByLocation = new Map();

  for (const agent of activeAgents) {
    // Get agent's country code (manual location takes priority)
    let countryCode = null;

    if (agent.manualLocation && agent.manualLocation.country) {
      countryCode = agent.manualLocation.country.toUpperCase();
    } else if (agent.ipInfo && agent.ipInfo.countryCode) {
      countryCode = agent.ipInfo.countryCode.toUpperCase();
    }

    if (!countryCode) {
      continue; // Skip agents without location
    }

    const countryCodeLower = countryCode.toLowerCase();

    // Skip if this location is already processed
    if (processedLocations.has(countryCodeLower)) {
      continue;
    }

    // Add agent to location group
    if (!agentsByLocation.has(countryCodeLower)) {
      agentsByLocation.set(countryCodeLower, []);
    }

    const loadScore = agent.loadScore || 0;
    const weight = Math.max(1, 100 - loadScore);

    agentsByLocation.get(countryCodeLower).push({
      agentId: agent.agentId,
      agentIp: agent.ipAddress,
      agentName: agent.name,
      loadScore: loadScore,
      weight: weight,
      isOverloaded: loadScore > 80,
      locationName:
        agent.manualLocation?.country || agent.ipInfo?.country || countryCode,
    });
  }

  // Add auto-discovered locations to records
  for (const [locationCode, locationAgents] of agentsByLocation.entries()) {
    processedLocations.add(locationCode);

    // Sort by load score (best first)
    locationAgents.sort((a, b) => a.loadScore - b.loadScore);

    records.push({
      name: locationCode,
      type: "A",
      agents: locationAgents,
      ttl: 60,
      locationCode: locationCode,
      isDirect: true,
      isAutoDiscovered: true,
      description: `Auto: ${locationAgents.length} agent(s) (${locationAgents[0].locationName})`,
    });

    if (shouldLogAutoDiscovery) {
      console.log(
        `  [Auto] ${locationCode} → ${locationAgents.length} agents:`,
      );
      locationAgents.forEach((a) => {
        console.log(
          `    - ${a.agentName} (${a.agentIp}): load=${a.loadScore}%, weight=${a.weight}`,
        );
      });
    }
  }

  // Only log summary occasionally to reduce spam
  const autoDiscoveredCount = records.filter((r) => r.isAutoDiscovered).length;
  const generatedCount = records.filter((r) => r.agents && r.agents.length > 0)
    .length;
  const totalAgents = records.reduce(
    (sum, r) => sum + (r.agents ? r.agents.length : 0),
    0,
  );

  // Only log if there are new auto-discoveries (not every poll)
  if (autoDiscoveredCount > 0 && shouldLogDetails) {
    console.log(
      `[Build Anycast] Generated ${generatedCount}/${records.length} location records with ${totalAgents} total agents (${autoDiscoveredCount} auto-discovered)`,
    );
  }

  return records;
}

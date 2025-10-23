// Auto-assign agents to GeoDNS locations based on their IP geolocation

// Country code → our location code mapping
const COUNTRY_TO_LOCATION = {
  // Europe
  RU: "ru",
  TR: "tr",
  DE: "europe",
  FR: "europe",
  GB: "europe",
  IT: "europe",
  ES: "europe",
  PL: "europe",
  UA: "europe",
  NL: "europe",
  SE: "europe",
  NO: "europe",
  FI: "europe",
  DK: "europe",
  BE: "europe",
  CH: "europe",
  AT: "europe",
  CZ: "europe",
  GR: "europe",
  PT: "europe",
  RO: "europe",
  HU: "europe",
  SK: "europe",
  BG: "europe",
  HR: "europe",
  RS: "europe",
  SI: "europe",
  LT: "europe",
  LV: "europe",
  EE: "europe",
  IE: "europe",
  
  // North America
  US: "us",
  CA: "ca",
  MX: "north-america",
  
  // South America
  BR: "south-america",
  AR: "south-america",
  CL: "south-america",
  CO: "south-america",
  PE: "south-america",
  VE: "south-america",
  EC: "south-america",
  
  // Asia
  CN: "cn",
  JP: "jp",
  KZ: "kz",
  IR: "ir",
  AE: "ae",
  IN: "asia",
  KR: "asia",
  TH: "asia",
  VN: "asia",
  SG: "asia",
  MY: "asia",
  ID: "asia",
  PH: "asia",
  PK: "asia",
  BD: "asia",
  IQ: "asia",
  SA: "asia",
  IL: "asia",
  
  // Oceania
  AU: "au",
  NZ: "oceania",
  
  // Africa
  ZA: "africa",
  EG: "africa",
  NG: "africa",
  KE: "africa",
  MA: "africa",
  TN: "africa",
  DZ: "africa",
  GH: "africa",
  UG: "africa",
  ET: "africa",
  TZ: "africa",
};

// Location code → continent mapping
const LOCATION_TO_CONTINENT = {
  ru: "europe",
  tr: "europe",
  us: "north-america",
  ca: "north-america",
  cn: "asia",
  jp: "asia",
  kz: "asia",
  ir: "asia",
  ae: "asia",
  au: "oceania",
  europe: "europe",
  "north-america": "north-america",
  "south-america": "south-america",
  africa: "africa",
  asia: "asia",
  oceania: "oceania",
};

/**
 * Determine location codes for an agent based on IP info
 * @param {Object} ipInfo - IP information from ip-api.com
 * @returns {Array<string>} - Array of location codes to assign
 */
export function getAgentLocations(ipInfo) {
  if (!ipInfo || !ipInfo.countryCode) {
    return [];
  }

  const countryCode = ipInfo.countryCode.toUpperCase();
  
  // Special handling for localhost/unknown IPs (for testing)
  if (countryCode === "XX" || ipInfo.country === "Unknown" || ipInfo.city === "Localhost") {
    console.log(`    ⚠️  Localhost/Unknown IP detected - using TEST location (europe)`);
    // For testing: assign to a default location (europe)
    // In production, agents should have real IPs
    return ["europe"];
  }

  const locations = [];

  // 1. Try to find specific country/location mapping
  const specificLocation = COUNTRY_TO_LOCATION[countryCode];
  
  if (specificLocation) {
    locations.push(specificLocation);
    
    // 2. Also add continent if not already a continent
    const continent = LOCATION_TO_CONTINENT[specificLocation];
    if (continent && continent !== specificLocation && !locations.includes(continent)) {
      locations.push(continent);
    }
  } else {
    // 3. Fallback: try to determine continent from region
    const continent = guessContinent(ipInfo);
    if (continent) {
      locations.push(continent);
    }
  }

  return locations;
}

/**
 * Guess continent from IP info if no specific mapping exists
 */
function guessContinent(ipInfo) {
  if (!ipInfo) return null;

  // Use continent field if available (some IP APIs provide this)
  if (ipInfo.continent) {
    const cont = ipInfo.continent.toLowerCase();
    if (cont.includes("europe")) return "europe";
    if (cont.includes("america") && !cont.includes("south")) return "north-america";
    if (cont.includes("south")) return "south-america";
    if (cont.includes("asia")) return "asia";
    if (cont.includes("africa")) return "africa";
    if (cont.includes("oceania") || cont.includes("australia")) return "oceania";
  }

  // Fallback to country name patterns
  const country = (ipInfo.country || "").toLowerCase();
  if (country.includes("europe") || country.includes("european")) return "europe";
  if (country.includes("america") && !country.includes("south")) return "north-america";
  if (country.includes("africa") || country.includes("african")) return "africa";
  if (country.includes("asia") || country.includes("asian")) return "asia";
  if (country.includes("oceania") || country.includes("australia")) return "oceania";

  return null;
}

/**
 * Auto-assign agent to GeoDNS locations across all domains
 * @param {string} agentId - Agent ID
 * @param {Object} ipInfo - IP information
 * @param {string} userId - User ID
 * @param {Object} Domain - Domain model
 * @returns {Promise<Object>} - { assignedCount, locations }
 */
export async function autoAssignAgentToLocations(agentId, ipInfo, userId, Domain) {
  console.log(`    [autoAssignAgent] Starting for agent ${agentId.substring(0, 20)}...`);
  console.log(`    IP Info:`, JSON.stringify({ country: ipInfo.country, countryCode: ipInfo.countryCode, city: ipInfo.city }));
  
  const locations = getAgentLocations(ipInfo);
  console.log(`    Detected locations: ${locations.join(', ') || 'none'}`);
  
  if (locations.length === 0) {
    console.log(`    ⚠️  No locations detected for this IP!`);
    return { assignedCount: 0, locations: [] };
  }

  // Get all domains for this user
  const domains = await Domain.find({ userId, isActive: true });
  console.log(`    Found ${domains.length} active domains`);
  
  let assignedCount = 0;

  for (const domain of domains) {
    let updated = false;
    console.log(`    Checking domain: ${domain.domain}`);

    for (const location of locations) {
      // Find this location in geoDnsConfig
      const locationConfig = domain.geoDnsConfig?.find(loc => loc.code === location);
      
      if (locationConfig) {
        // Check if agent is already assigned
        if (!locationConfig.agentIds.includes(agentId)) {
          locationConfig.agentIds.push(agentId);
          updated = true;
          assignedCount++;
          console.log(`      ✓ Assigned to location: ${location}`);
        } else {
          console.log(`      - Already assigned to: ${location}`);
        }
      } else {
        console.log(`      ⚠️  Location "${location}" not found in geoDnsConfig`);
      }
    }

    if (updated) {
      await domain.save();
      console.log(`      💾 Domain saved`);
    }
  }

  const result = {
    assignedCount,
    locations,
    message: `Auto-assigned agent to ${locations.join(", ")} across ${domains.length} domain(s)`,
  };
  
  console.log(`    ✅ Auto-assign complete: ${assignedCount} assignments`);
  return result;
}

/**
 * Remove agent from all GeoDNS locations (when agent is deleted or IP changes significantly)
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {Object} Domain - Domain model
 * @returns {Promise<number>} - Number of assignments removed
 */
export async function removeAgentFromAllLocations(agentId, userId, Domain) {
  const domains = await Domain.find({ userId, isActive: true });
  
  let removedCount = 0;

  for (const domain of domains) {
    let updated = false;

    for (const locationConfig of domain.geoDnsConfig || []) {
      const index = locationConfig.agentIds.indexOf(agentId);
      if (index > -1) {
        locationConfig.agentIds.splice(index, 1);
        updated = true;
        removedCount++;
      }
    }

    if (updated) {
      await domain.save();
    }
  }

  return removedCount;
}

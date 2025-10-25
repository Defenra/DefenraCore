import Reader from "@maxmind/geoip2-node";
import path from "node:path";

let geoipReader = null;

async function getGeoIPReader() {
  if (geoipReader) {
    return geoipReader;
  }

  try {
    const dbPath = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
    geoipReader = await Reader.open(dbPath);
    console.log("✅ GeoIP database loaded successfully");
    return geoipReader;
  } catch (error) {
    console.error("❌ Failed to load GeoIP database:", error.message);
    console.error(
      "Please download GeoLite2-City.mmdb and place it in the data/ folder",
    );
    return null;
  }
}

export async function getIpInfo(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return {
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      city: "Localhost",
      timezone: "Unknown",
      isp: "Local",
      org: "Local",
      as: "Local",
      lat: 0,
      lon: 0,
    };
  }

  try {
    const reader = await getGeoIPReader();

    if (!reader) {
      throw new Error("GeoIP database not available");
    }

    const response = reader.city(ip);

    return {
      country: response.country?.names?.en || "Unknown",
      countryCode: response.country?.isoCode || "XX",
      region: response.subdivisions?.[0]?.names?.en || "Unknown",
      city: response.city?.names?.en || "Unknown",
      timezone: response.location?.timeZone || "Unknown",
      isp: response.traits?.isp || "Unknown",
      org: response.traits?.organization || "Unknown",
      as: response.traits?.autonomousSystemOrganization || "Unknown",
      lat: response.location?.latitude || 0,
      lon: response.location?.longitude || 0,
    };
  } catch (error) {
    console.error("Error fetching IP info:", error.message);
    return {
      country: "Unknown",
      countryCode: "XX",
      region: "Unknown",
      city: "Unknown",
      timezone: "Unknown",
      isp: "Unknown",
      org: "Unknown",
      as: "Unknown",
      lat: 0,
      lon: 0,
    };
  }
}

/**
 * Clean IP address - convert IPv4-mapped IPv6 to IPv4
 * ::ffff:51.91.242.9 → 51.91.242.9
 */
function cleanIpAddress(ip) {
  if (!ip) return ip;

  // Check for IPv4-mapped IPv6 address
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7); // Remove ::ffff: prefix
  }

  return ip;
}

export function extractIpFromRequest(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) return cleanIpAddress(cfConnectingIp);
  if (realIp) return cleanIpAddress(realIp);
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return cleanIpAddress(ips[0]);
  }

  return null;
}

export async function getIpInfo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Localhost',
      timezone: 'Unknown',
      isp: 'Local',
      org: 'Local',
      as: 'Local',
      lat: 0,
      lon: 0,
    };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,org,as,lat,lon`, {
      headers: {
        'User-Agent': 'Defenra/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IP info');
    }

    const data = await response.json();

    if (data.status === 'fail') {
      throw new Error(data.message || 'Failed to get IP info');
    }

    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      region: data.regionName || data.region || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'Unknown',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      as: data.as || 'Unknown',
      lat: data.lat || 0,
      lon: data.lon || 0,
    };
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'Unknown',
      isp: 'Unknown',
      org: 'Unknown',
      as: 'Unknown',
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
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7); // Remove ::ffff: prefix
  }
  
  return ip;
}

export function extractIpFromRequest(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cleanIpAddress(cfConnectingIp);
  if (realIp) return cleanIpAddress(realIp);
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return cleanIpAddress(ips[0]);
  }

  return null;
}

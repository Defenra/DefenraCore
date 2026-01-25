#!/usr/bin/env node

/**
 * Test GeoIP functionality
 */

import { getIpInfo } from './src/lib/ipInfo.js';

async function testGeoIP() {
  console.log('🧪 Testing GeoIP functionality...\n');

  const testIPs = [
    '8.8.8.8',        // Google DNS (US)
    '1.1.1.1',        // Cloudflare (US)
    '94.159.110.227', // Germany
    '45.82.252.82',   // Hong Kong
    '45.159.250.246', // Kazakhstan
  ];

  for (const ip of testIPs) {
    console.log(`Testing IP: ${ip}`);
    try {
      const info = await getIpInfo(ip);
      console.log(`  Country: ${info.country} (${info.countryCode})`);
      console.log(`  City: ${info.city}, ${info.region}`);
      console.log(`  ISP: ${info.isp}`);
      console.log(`  Coordinates: ${info.lat}, ${info.lon}`);
      console.log('  ✅ Success\n');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
}

testGeoIP().catch(console.error);
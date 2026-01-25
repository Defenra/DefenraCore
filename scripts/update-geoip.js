#!/usr/bin/env node

/**
 * Update GeoLite2-City.mmdb database
 * Downloads the latest version from jsdelivr CDN
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const GEOIP_URL = 'https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz';
const DATA_DIR = path.join(process.cwd(), 'data');
const GEOIP_PATH = path.join(DATA_DIR, 'GeoLite2-City.mmdb');

async function downloadAndExtract() {
  console.log('🌍 Downloading GeoLite2-City database...');
  
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Download the compressed file
    const response = await fetch(GEOIP_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Create streams for decompression
    const gzipStream = createGunzip();
    const writeStream = fs.createWriteStream(GEOIP_PATH);

    // Pipeline: fetch -> gunzip -> write to file
    await pipeline(
      Readable.fromWeb(response.body),
      gzipStream,
      writeStream
    );

    // Check file size
    const stats = fs.statSync(GEOIP_PATH);
    console.log(`✅ GeoLite2-City.mmdb updated successfully`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   Path: ${GEOIP_PATH}`);

  } catch (error) {
    console.error('❌ Failed to update GeoIP database:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAndExtract();
}

export { downloadAndExtract };
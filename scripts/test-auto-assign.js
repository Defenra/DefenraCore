// Test script to demonstrate auto-assignment

import { getAgentLocations } from '../src/lib/autoAssignAgent.js';

console.log('=== Auto-Assignment Test ===\n');

const testCases = [
  {
    name: 'Agent from Russia',
    ipInfo: { countryCode: 'RU', country: 'Russia', city: 'Moscow' },
  },
  {
    name: 'Agent from USA',
    ipInfo: { countryCode: 'US', country: 'United States', city: 'New York' },
  },
  {
    name: 'Agent from Germany',
    ipInfo: { countryCode: 'DE', country: 'Germany', city: 'Berlin' },
  },
  {
    name: 'Agent from Singapore',
    ipInfo: { countryCode: 'SG', country: 'Singapore', city: 'Singapore' },
  },
  {
    name: 'Agent from Australia',
    ipInfo: { countryCode: 'AU', country: 'Australia', city: 'Sydney' },
  },
  {
    name: 'Agent from Brazil',
    ipInfo: { countryCode: 'BR', country: 'Brazil', city: 'São Paulo' },
  },
  {
    name: 'Agent from South Africa',
    ipInfo: { countryCode: 'ZA', country: 'South Africa', city: 'Johannesburg' },
  },
  {
    name: 'Agent from Canada',
    ipInfo: { countryCode: 'CA', country: 'Canada', city: 'Toronto' },
  },
  {
    name: 'Agent from China',
    ipInfo: { countryCode: 'CN', country: 'China', city: 'Beijing' },
  },
  {
    name: 'Agent from Japan',
    ipInfo: { countryCode: 'JP', country: 'Japan', city: 'Tokyo' },
  },
];

for (const testCase of testCases) {
  const locations = getAgentLocations(testCase.ipInfo);
  console.log(`${testCase.name}:`);
  console.log(`  Country: ${testCase.ipInfo.country} (${testCase.ipInfo.countryCode})`);
  console.log(`  Auto-assigned to: ${locations.join(', ') || 'none'}`);
  console.log('');
}

console.log('✅ All tests completed!');

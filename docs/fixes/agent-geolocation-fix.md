# Agent Geolocation Fix

## Problem

When new agents were added with pre-configured IP addresses, their geolocation information (`ipInfo`) was not being populated. The agents would display "Unknown, Unknown" in the UI even though their IP addresses were known.

## Root Cause

The agent polling endpoint (`/api/agent/poll`) only fetched geolocation data when the IP address **changed**:

```javascript
if (currentIp && currentIp !== agent.ipAddress) {
  const ipInfo = await getIpInfo(currentIp);
  // ... update ipInfo
}
```

For newly added agents that already had an IP address set (but no `ipInfo`), this condition would never be true, so geolocation was never fetched.

## Solution

Modified the condition to also fetch geolocation when `ipInfo` is missing:

```javascript
// Update IP info if IP changed OR if ipInfo is missing
if (currentIp && (currentIp !== agent.ipAddress || !agent.ipInfo)) {
  const ipInfo = await getIpInfo(currentIp);
  
  // Only mark as changed if IP actually changed (not just missing ipInfo)
  if (currentIp !== agent.ipAddress) {
    ipChanged = true;
    // ... handle IP history
  }

  agent.ipAddress = currentIp;
  agent.ipInfo = ipInfo;
}
```

## Impact

- Newly added agents will have their geolocation populated on the first poll
- Existing agents with missing `ipInfo` will have it populated on their next poll
- No breaking changes to existing functionality
- IP change history tracking remains accurate

## Testing

To verify the fix:

1. Add a new agent with a known IP address
2. Wait for the agent to poll (or trigger a manual poll)
3. Check that the agent's location is correctly displayed in the UI
4. Verify that the `ipInfo` field is populated in the database

## Files Changed

- `DefenraCore/src/app/api/agent/poll/route.js` - Updated IP info fetching logic
- `AGENTS.md` - Added correction rule for agent geolocation

## Related Issues

- Agents showing "Unknown, Unknown" location despite having valid IP addresses
- Geolocation only updating when IP address changes

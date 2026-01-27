# Load-Based Agent Selection Implementation

**Date:** 2026-01-27  
**Status:** ✅ Implemented

## Problem

When multiple agents exist in the same geographic location (e.g., 3 agents in DE), the system was always selecting the **first agent** from the list. This caused all client traffic to be routed to a single agent, even when other agents in the same location were available and had lower load.

Example scenario:
- 3 agents in Germany (DE): agent-1, agent-2, agent-3
- All clients from Germany were routed to agent-1
- agent-2 and agent-3 were idle
- agent-1 was overloaded (high CPU, memory, load)

## Solution

Implemented **load-based agent selection** that distributes traffic across multiple agents in the same location based on their current load score.

### Algorithm

1. **Filter by location**: Find all agents matching the requested location (exact country code match)
2. **Filter by health**: Exclude overloaded agents (loadScore > 80%)
3. **Select best agent**: Choose agent with **lowest loadScore** from healthy pool
4. **Fallback**: If all agents overloaded, use all agents (better than distant fallback)

### Load Score Calculation

Load score (0-100%) is calculated from system metrics:
- CPU usage: 30%
- Memory usage: 25%
- Load average: 25%
- Disk I/O: 10%
- Network I/O: 10%

Agents with loadScore > 80% are considered overloaded.

## Implementation Details

### Files Changed

1. **src/lib/geoFallback.js**
   - Updated `findBestAgentForLocation()` function
   - Added load-based selection logic
   - Added health filtering (loadScore ≤ 80%)
   - Added logging for load balancing decisions

2. **src/app/api/agent/poll/route.js**
   - Added `loadScore` to agent query selection
   - Transform agents to include `loadScore` before passing to `buildAnycastRecords()`

3. **src/app/api/geodns/map/route.js**
   - Added `manualLocation` and `loadScore` to agent data
   - Ensures GeoDNS map API includes load information

## How It Works

### Before (Broken)

```javascript
// Always selected first agent
if (matchingAgents.length > 0) {
  const agent = matchingAgents[0];  // ❌ ALWAYS FIRST!
  return { agentId: agent.agentId, ... };
}
```

Result: All traffic → agent-1 (overloaded), agent-2 and agent-3 idle

### After (Fixed)

```javascript
// Select agent with lowest load
if (matchingAgents.length > 0) {
  // Filter healthy agents (load ≤ 80%)
  const healthyAgents = matchingAgents.filter(
    (agent) => !agent.loadScore || agent.loadScore <= 80
  );
  
  const candidatePool = healthyAgents.length > 0 
    ? healthyAgents 
    : matchingAgents;
  
  // Select agent with minimum load
  const selectedAgent = candidatePool.reduce((best, current) => {
    const bestLoad = best.loadScore || 0;
    const currentLoad = current.loadScore || 0;
    return currentLoad < bestLoad ? current : best;
  });
  
  return { 
    agentId: selectedAgent.agentId,
    loadScore: selectedAgent.loadScore,
    poolSize: candidatePool.length,
    ...
  };
}
```

Result: Traffic distributed based on load:
- agent-1: loadScore=20% → gets traffic
- agent-2: loadScore=45% → gets traffic
- agent-3: loadScore=85% → excluded (overloaded)

## Example Scenarios

### Scenario 1: Healthy Agents

Location: DE  
Agents:
- agent-1: loadScore=15% ✓ **SELECTED** (lowest load)
- agent-2: loadScore=30% ✓
- agent-3: loadScore=50% ✓

Result: agent-1 selected (best performance)

### Scenario 2: Mixed Load

Location: DE  
Agents:
- agent-1: loadScore=85% ⚠️ (overloaded, excluded)
- agent-2: loadScore=40% ✓ **SELECTED**
- agent-3: loadScore=60% ✓

Result: agent-2 selected (lowest among healthy)

### Scenario 3: All Overloaded

Location: DE  
Agents:
- agent-1: loadScore=85% ⚠️
- agent-2: loadScore=90% ⚠️
- agent-3: loadScore=82% ⚠️ **SELECTED** (least overloaded)

Result: agent-3 selected (better than distant fallback)

## Logging

Load balancing decisions are logged (5% sampling to reduce spam):

```
[Load Balance] Location de: 3 agents, 2 healthy
  - agent-1: load=15% ✓
  - agent-2: load=30% ✓
  - agent-3: load=85% ⚠️ OVERLOADED
[Load Balance] Selected: agent-1 (load=15%)
```

## Testing

To verify load balancing:

1. Create 3+ agents in same location (e.g., DE)
2. Set different load scores via system metrics
3. Make DNS queries from that location
4. Check logs to see which agent is selected
5. Verify traffic is distributed based on load

## Performance Impact

- **Minimal**: Selection happens during GeoDNS map building (every 60s poll)
- **No runtime overhead**: DNS queries use pre-built map
- **Scalable**: O(n) complexity where n = agents in location (typically < 10)

## Future Improvements

1. **Round-robin within same load**: If multiple agents have identical load, rotate selection
2. **Sticky sessions**: Option to keep client on same agent for session duration
3. **Weighted distribution**: Distribute traffic proportionally to available capacity
4. **Real-time updates**: Update GeoDNS map more frequently (e.g., every 30s)
5. **Agent capacity limits**: Respect maxTraffic configuration per agent

## Related Documentation

- [docs/Features/Feature-GeoDNS.md](docs/Features/Feature-GeoDNS.md) - GeoDNS routing
- [SYSTEM_METRICS_UI.md](SYSTEM_METRICS_UI.md) - System metrics collection

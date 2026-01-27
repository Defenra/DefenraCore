# DNS-Level Load Balancing Implementation

**Date:** 2026-01-27  
**Status:** ✅ Implemented

## Problem

Previous implementation selected only the "best" agent for each location and all clients received the same IP. When 100 clients from DE region queried DNS, all 100 received the same agent IP, causing:
- Single agent overload (all 100 clients → agent-1)
- Other agents idle (agent-2, agent-3 unused)
- No true load distribution

## Solution

Implemented **DNS-level weighted round-robin load balancing** where DNS server distributes clients across all available agents in a location based on their current load.

### How It Works

1. **Core builds agent pools**: For each location, Core sends array of ALL agents with weights
2. **DNS server selects**: Each DNS query selects agent using weighted round-robin
3. **Client IP hashing**: Same client always gets same agent (sticky sessions)
4. **Weight-based distribution**: Agents with lower load receive more traffic

### Example: 100 Clients, 3 DE Agents

**Agent Pool:**
- Agent-1: loadScore=20% → weight=80
- Agent-2: loadScore=40% → weight=60
- Agent-3: loadScore=60% → weight=40
- Total weight: 180

**Traffic Distribution:**
- Agent-1: 80/180 = 44% → ~44 clients
- Agent-2: 60/180 = 33% → ~33 clients
- Agent-3: 40/180 = 22% → ~23 clients

**Result:** All 100 clients distributed proportionally to agent capacity!

## Key Features

### 1. Weighted Distribution

Agents receive traffic proportional to their available capacity:
- Agent with 20% load → weight=80 → receives ~44% of traffic
- Agent with 80% load → weight=20 → receives ~11% of traffic

### 2. Sticky Sessions

Client IP hashing ensures same client always gets same agent:
- Client 1.2.3.4 → always Agent-1
- Client 5.6.7.8 → always Agent-2
- Prevents session disruption, improves caching

### 3. Dynamic Rebalancing

DNS TTL=60s allows automatic rebalancing:
- Agent load increases → weight decreases → less new traffic
- Agent load decreases → weight increases → more new traffic
- System self-balances every 60 seconds

### 4. Backward Compatibility

Old `geoDnsMap` still transmitted for fallback:
- If agent doesn't support pools → uses old map
- Gradual migration without breaking existing agents

## Traffic Distribution Examples

### Scenario 1: Balanced Load

3 agents, similar load:
- Agent-1: load=30% → weight=70 → 35% traffic
- Agent-2: load=35% → weight=65 → 33% traffic
- Agent-3: load=40% → weight=60 → 30% traffic

Result: Nearly equal distribution (35/33/30)

### Scenario 2: One Overloaded

3 agents, one overloaded:
- Agent-1: load=20% → weight=80 → 47% traffic
- Agent-2: load=30% → weight=70 → 41% traffic
- Agent-3: load=85% → weight=15 → 9% traffic

Result: Overloaded agent receives minimal traffic

### Scenario 3: All Overloaded

3 agents, all overloaded:
- Agent-1: load=85% → weight=15 → 33% traffic
- Agent-2: load=90% → weight=10 → 22% traffic
- Agent-3: load=95% → weight=5 → 11% traffic

Result: Least overloaded agent receives most traffic

## Testing

To verify DNS load balancing:

1. Create 3+ agents in same location (e.g., DE)
2. Set different load scores via system metrics
3. Make 100+ DNS queries from that location
4. Check DNS server logs to see agent selection
5. Verify traffic distribution matches weights

Example test:
```bash
# Query DNS 100 times
for i in {1..100}; do
  dig @agent-dns-server example.com A
done

# Check agent selection in logs
grep "GeoDNS Pool Response" agent.log | sort | uniq -c
```

Expected output:
```
44 [DNS] GeoDNS Pool Response: example.com → 1.2.3.4 (load: 20%, weight: 80, pool size: 3)
33 [DNS] GeoDNS Pool Response: example.com → 5.6.7.8 (load: 40%, weight: 60, pool size: 3)
23 [DNS] GeoDNS Pool Response: example.com → 9.10.11.12 (load: 60%, weight: 40, pool size: 3)
```

## Related Documentation

- [LOAD_BALANCING_IMPLEMENTATION.md](LOAD_BALANCING_IMPLEMENTATION.md) - Initial load-based selection
- [docs/Features/Feature-GeoDNS.md](docs/Features/Feature-GeoDNS.md) - GeoDNS routing

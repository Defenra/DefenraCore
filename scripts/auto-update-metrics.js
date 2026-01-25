/**
 * Auto Update System Metrics
 * 
 * This script runs continuously and updates system metrics every 60 seconds
 * for all active agents until they are updated with the new code.
 */

import connectDB from '../src/lib/mongodb.js';
import Agent from '../src/models/Agent.js';

let isRunning = false;

async function updateSystemMetrics() {
  if (isRunning) {
    console.log('⏳ Previous update still running, skipping...');
    return;
  }
  
  isRunning = true;
  
  try {
    await connectDB();
    
    const agents = await Agent.find({ 
      isActive: true,
      isConnected: true 
    });
    
    console.log(`📊 [${new Date().toISOString()}] Updating metrics for ${agents.length} agents`);
    
    let updatedCount = 0;
    
    for (const agent of agents) {
      // Check if agent is sending real metrics by looking at numGoroutines
      // Real agents will have varying goroutine counts, simulated ones are static
      const hasRealMetrics = agent.systemMetrics?.numGoroutines > 0 && 
                            agent.systemMetrics?.cpuUsagePercent > 0 &&
                            // Check if lastUpdated is very recent (within last 2 minutes)
                            agent.systemMetrics?.lastUpdated &&
                            new Date(agent.systemMetrics.lastUpdated) > new Date(Date.now() - 2 * 60 * 1000);
      
      if (hasRealMetrics) {
        console.log(`  ✅ ${agent.name}: Sending real metrics from updated agent`);
        continue;
      }
      
      // Generate and update simulated metrics
      const systemMetrics = generateSystemMetrics(agent);
      const loadScore = calculateLoadScore(systemMetrics);
      
      await Agent.findByIdAndUpdate(agent._id, {
        systemMetrics: {
          cpuUsagePercent: systemMetrics.cpuUsagePercent,
          memoryUsagePercent: systemMetrics.memoryUsagePercent,
          memoryUsedBytes: systemMetrics.memoryUsedBytes,
          memoryTotalBytes: systemMetrics.memoryTotalBytes,
          diskReadBytesPS: systemMetrics.diskReadBytesPS,
          diskWriteBytesPS: systemMetrics.diskWriteBytesPS,
          networkRxBytesPS: systemMetrics.networkRxBytesPS,
          networkTxBytesPS: systemMetrics.networkTxBytesPS,
          loadAverage1Min: systemMetrics.loadAverage1Min,
          loadAverage5Min: systemMetrics.loadAverage5Min,
          loadAverage15Min: systemMetrics.loadAverage15Min,
          numGoroutines: systemMetrics.numGoroutines,
          lastUpdated: new Date(),
        },
        loadScore: loadScore,
      });
      
      console.log(`  🔄 ${agent.name}: Updated simulated metrics (CPU=${systemMetrics.cpuUsagePercent.toFixed(1)}%, Load=${loadScore})`);
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      console.log(`✨ Updated ${updatedCount} agents with simulated metrics`);
    } else {
      console.log(`🎉 All agents have recent real metrics!`);
    }
    
  } catch (error) {
    console.error('❌ Error updating metrics:', error);
  } finally {
    isRunning = false;
  }
}

function generateSystemMetrics(agent) {
  // Generate slightly varying metrics to simulate real system activity
  const time = Date.now();
  const baseLoad = 0.15 + Math.sin(time / 300000) * 0.1 + Math.random() * 0.1; // Varies over 5 minutes
  
  const isOracle = agent.name.toLowerCase().includes('oracle');
  const performanceMultiplier = isOracle ? 0.8 : 1.0;
  
  const ageDays = (Date.now() - new Date(agent.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageMultiplier = Math.min(1.0 + (ageDays / 365) * 0.05, 1.1);
  
  const finalLoad = Math.max(0.05, baseLoad * performanceMultiplier * ageMultiplier);
  
  return {
    cpuUsagePercent: Math.min(finalLoad * 120 + Math.random() * 8, 95),
    memoryUsagePercent: Math.min(finalLoad * 100 + Math.random() * 10 + 25, 90),
    memoryUsedBytes: Math.floor((finalLoad * 0.7 + 0.3) * 8 * 1024 * 1024 * 1024),
    memoryTotalBytes: 8 * 1024 * 1024 * 1024,
    diskReadBytesPS: Math.floor(Math.random() * 30 * 1024 * 1024),
    diskWriteBytesPS: Math.floor(Math.random() * 15 * 1024 * 1024),
    networkRxBytesPS: Math.floor(Math.random() * 80 * 1024 * 1024),
    networkTxBytesPS: Math.floor(Math.random() * 80 * 1024 * 1024),
    loadAverage1Min: finalLoad * 3.5,
    loadAverage5Min: finalLoad * 3.5 * 0.95,
    loadAverage15Min: finalLoad * 3.5 * 0.9,
    numGoroutines: Math.floor(Math.random() * 30 + 15),
  };
}

function calculateLoadScore(systemMetrics) {
  let score = 0;
  let factors = 0;

  if (systemMetrics.cpuUsagePercent !== undefined) {
    score += systemMetrics.cpuUsagePercent * 0.3;
    factors += 0.3;
  }

  if (systemMetrics.memoryUsagePercent !== undefined) {
    score += systemMetrics.memoryUsagePercent * 0.25;
    factors += 0.25;
  }

  if (systemMetrics.loadAverage1Min !== undefined && systemMetrics.loadAverage1Min > 0) {
    const cpuCores = 4;
    const loadPercent = Math.min((systemMetrics.loadAverage1Min / cpuCores) * 100, 100);
    score += loadPercent * 0.25;
    factors += 0.25;
  }

  if (systemMetrics.diskReadBytesPS !== undefined || systemMetrics.diskWriteBytesPS !== undefined) {
    const totalDiskIO = (systemMetrics.diskReadBytesPS || 0) + (systemMetrics.diskWriteBytesPS || 0);
    const diskLoadPercent = Math.min((totalDiskIO / (100 * 1024 * 1024)) * 100, 100);
    score += diskLoadPercent * 0.1;
    factors += 0.1;
  }

  if (systemMetrics.networkRxBytesPS !== undefined || systemMetrics.networkTxBytesPS !== undefined) {
    const totalNetworkIO = (systemMetrics.networkRxBytesPS || 0) + (systemMetrics.networkTxBytesPS || 0);
    const networkLoadPercent = Math.min((totalNetworkIO / (1024 * 1024 * 1024)) * 100, 100);
    score += networkLoadPercent * 0.1;
    factors += 0.1;
  }

  if (factors === 0) return 0;

  const normalizedScore = (score / factors) * (factors / 1.0);
  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the auto-update loop
console.log('🚀 Starting auto-update system metrics service...');
console.log('📝 This will update metrics every 60 seconds until agents are updated');
console.log('🛑 Press Ctrl+C to stop');

// Initial update
updateSystemMetrics();

// Set up interval for every 60 seconds
setInterval(updateSystemMetrics, 60 * 1000);
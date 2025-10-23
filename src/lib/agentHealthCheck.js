// Agent health check and automatic status management

/**
 * Check and update activity status for all agents
 * @param {Object} Agent - Agent model
 * @returns {Promise<Object>} - { checkedCount, activeCount, inactiveCount, deactivated }
 */
export async function checkAgentHealth(Agent) {
  const now = new Date();
  const agents = await Agent.find({});
  
  let activeCount = 0;
  let inactiveCount = 0;
  let deactivated = [];

  for (const agent of agents) {
    if (!agent.lastSeen) {
      // Agent never polled
      if (agent.isActive) {
        agent.isActive = false;
        await agent.save();
        inactiveCount++;
        deactivated.push(agent.agentId);
      }
      continue;
    }

    const timeSinceLastSeen = now - new Date(agent.lastSeen);
    const thresholdMs = (agent.inactivityThreshold || 300) * 1000;

    if (timeSinceLastSeen > thresholdMs) {
      // Agent is inactive
      if (agent.isActive) {
        agent.isActive = false;
        await agent.save();
        deactivated.push(agent.agentId);
      }
      inactiveCount++;
    } else {
      // Agent is active
      activeCount++;
    }
  }

  return {
    checkedCount: agents.length,
    activeCount,
    inactiveCount,
    deactivated,
  };
}

/**
 * Mark agent as inactive (when connection is lost)
 * @param {string} agentId - Agent ID
 * @param {Object} Agent - Agent model
 * @returns {Promise<boolean>} - true if agent was deactivated
 */
export async function deactivateAgent(agentId, Agent) {
  const agent = await Agent.findOne({ agentId });
  
  if (!agent) {
    return false;
  }

  if (agent.isActive) {
    agent.isActive = false;
    await agent.save();
    return true;
  }

  return false;
}

/**
 * Mark agent as active (when it connects/polls)
 * @param {string} agentId - Agent ID
 * @param {Object} Agent - Agent model
 * @returns {Promise<boolean>} - true if agent was activated
 */
export async function activateAgent(agentId, Agent) {
  const agent = await Agent.findOne({ agentId });
  
  if (!agent) {
    return false;
  }

  const wasInactive = !agent.isActive;
  
  agent.isActive = true;
  agent.lastSeen = new Date();
  await agent.save();

  return wasInactive; // Return true if agent was just brought back online
}

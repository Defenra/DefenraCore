export function checkAgentActivity(agent) {
  if (!agent.isConnected || !agent.lastSeen) {
    return {
      isActive: false,
      status: agent.isConnected ? "inactive" : "pending",
      statusText: agent.isConnected ? "Неактивен" : "Ожидает подключения",
    };
  }

  const now = new Date();
  const lastSeenTime = new Date(agent.lastSeen);
  const inactivityThreshold = (agent.inactivityThreshold || 300) * 1000;
  const timeSinceLastSeen = now - lastSeenTime;

  const isActive = timeSinceLastSeen < inactivityThreshold;

  return {
    isActive,
    status: isActive ? "active" : "inactive",
    statusText: isActive ? "Активен" : "Неактивен",
    lastSeenMinutesAgo: Math.floor(timeSinceLastSeen / 60000),
  };
}

export function updateAgentActivity(agent) {
  const activityCheck = checkAgentActivity(agent);

  if (agent.isActive !== activityCheck.isActive) {
    agent.isActive = activityCheck.isActive;
  }

  return activityCheck;
}

export function getAgentStatusColor(status) {
  switch (status) {
    case "active":
      return "text-green-500";
    case "inactive":
      return "text-yellow-500";
    case "pending":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

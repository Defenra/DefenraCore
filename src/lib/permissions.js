/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles and their associated permissions
 */

export const ROLES = {
  admin: {
    name: "Administrator",
    description: "Full system access",
    permissions: ["*.*"],
  },
  "proxy-manager": {
    name: "Proxy Manager",
    description: "Manage proxy configurations only",
    permissions: ["proxies.read", "proxies.write"],
  },
  "domain-manager": {
    name: "Domain Manager",
    description: "Manage domains and DNS records",
    permissions: ["domains.read", "domains.write", "agents.read"],
  },
  operator: {
    name: "Operator",
    description: "Manage domains and proxies",
    permissions: [
      "domains.read",
      "domains.write",
      "proxies.read",
      "proxies.write",
      "agents.read",
      "bans.read",
      "bans.write",
      "settings.read",
    ],
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to all resources",
    permissions: [
      "domains.read",
      "proxies.read",
      "agents.read",
      "bans.read",
      "settings.read",
    ],
  },
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check (e.g., "domains.read")
 * @returns {boolean} - True if role has permission
 */
export function hasPermission(role, permission) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;

  // Admin has all permissions
  if (roleConfig.permissions.includes("*.*")) return true;

  // Check exact permission
  if (roleConfig.permissions.includes(permission)) return true;

  // Check wildcard (e.g., "domains.*" matches "domains.read")
  const [resource, _action] = permission.split(".");
  return roleConfig.permissions.includes(`${resource}.*`);
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permissions
 */
export function getPermissions(role) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return [];
  return roleConfig.permissions;
}

/**
 * Get role display information
 * @param {string} role - User role
 * @returns {object} - Role name and description
 */
export function getRoleInfo(role) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return { name: "Unknown", description: "" };
  return {
    name: roleConfig.name,
    description: roleConfig.description,
  };
}

/**
 * Get all available roles
 * @returns {object[]} - Array of role objects with key, name, description
 */
export function getAllRoles() {
  return Object.entries(ROLES).map(([key, config]) => ({
    key,
    name: config.name,
    description: config.description,
  }));
}

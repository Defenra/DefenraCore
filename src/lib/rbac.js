/**
 * RBAC Middleware for API Routes
 * Provides permission checking for Next.js API routes
 */

import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * Check if current user has required permission
 * @param {string} permission - Required permission (e.g., "domains.write")
 * @returns {Promise<object>} - Authorization result with user info or error
 */
export async function requirePermission(permission) {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized - Please log in",
    };
  }

  if (!hasPermission(session.user.role, permission)) {
    return {
      authorized: false,
      status: 403,
      message: `Forbidden - Requires permission: ${permission}`,
    };
  }

  return {
    authorized: true,
    user: session.user,
  };
}

/**
 * Check if current user is admin
 * @returns {Promise<object>} - Authorization result
 */
export async function requireAdmin() {
  return requirePermission("users.write");
}

/**
 * Get current user session with role info
 * @returns {Promise<object|null>} - User session or null
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

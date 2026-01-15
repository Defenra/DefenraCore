/**
 * React Hook for Permission Checking
 * Use in components to check user permissions
 */

"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { hasPermission as checkPermission } from "@/lib/permissions";

/**
 * Hook to check user permissions in React components
 * @returns {object} - Permission checking functions and user info
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check (e.g., "domains.write")
   * @returns {boolean} - True if user has permission
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!session?.user?.role) return false;
      return checkPermission(session.user.role, permission);
    },
    [session?.user?.role],
  );

  /**
   * Check if user can read a resource
   * @param {string} resource - Resource name (e.g., "domains")
   * @returns {boolean} - True if user can read
   */
  const canRead = useCallback(
    (resource) => hasPermission(`${resource}.read`),
    [hasPermission],
  );

  /**
   * Check if user can write a resource
   * @param {string} resource - Resource name (e.g., "domains")
   * @returns {boolean} - True if user can write
   */
  const canWrite = useCallback(
    (resource) => hasPermission(`${resource}.write`),
    [hasPermission],
  );

  return {
    hasPermission,
    canRead,
    canWrite,
    role: session?.user?.role,
    isAdmin: session?.user?.role === "admin",
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

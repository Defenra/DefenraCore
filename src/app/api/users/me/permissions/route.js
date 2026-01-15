/**
 * Current User Permissions API
 * GET /api/users/me/permissions - Get current user's permissions
 */

import { NextResponse } from "next/server";
import { getPermissions, getRoleInfo } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = getPermissions(user.role);
  const roleInfo = getRoleInfo(user.role);

  return NextResponse.json({
    role: user.role,
    roleName: roleInfo.name,
    roleDescription: roleInfo.description,
    permissions,
  });
}

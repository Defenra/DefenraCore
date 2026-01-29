import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import GlobalBan from "@/models/GlobalBan";
import { requirePermission } from "@/lib/rbac";

/**
 * DELETE /api/bans/[id]
 * Remove a specific ban (unban)
 */
export async function DELETE(_request, { params }) {
  try {
    const authCheck = await requirePermission("bans.write");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status },
      );
    }

    await connectDB();

    const { id } = await params;

    const ban = await GlobalBan.findByIdAndDelete(id);

    if (!ban) {
      return NextResponse.json({ error: "Ban not found" }, { status: 404 });
    }

    console.log(`[Bans API] Ban removed: ${ban.ip} by ${authCheck.user.email}`);

    return NextResponse.json({
      success: true,
      message: `Ban removed for ${ban.ip}`,
    });
  } catch (error) {
    console.error("[Bans API] Error removing ban:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import GlobalBan from "@/models/GlobalBan";
import { requirePermission } from "@/lib/permissions";

/**
 * DELETE /api/bans/[id]
 * Remove a specific ban (unban)
 */
export async function DELETE(_request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission(session, "bans.write");
    await connectDB();

    const { id } = await params;

    const ban = await GlobalBan.findByIdAndDelete(id);

    if (!ban) {
      return NextResponse.json({ error: "Ban not found" }, { status: 404 });
    }

    console.log(`[Bans API] Ban removed: ${ban.ip} by ${session.user.email}`);

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

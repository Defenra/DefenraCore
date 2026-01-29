import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import GlobalBan from "@/models/GlobalBan";

/**
 * POST /api/agent/ban-sync
 * Agent reports new bans and receives global bans from other agents
 * Called every 30 seconds for fast ban synchronization
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentKey = authHeader.substring(7);

    await connectDB();

    // Find agent by key
    const agent = await Agent.findOne({ key: agentKey });
    if (!agent) {
      return NextResponse.json({ error: "Invalid agent key" }, { status: 401 });
    }

    const body = await request.json();
    const { newBans = [], lastSyncTime } = body;

    // Quick cleanup: delete expired bans on every sync (lightweight operation)
    const now = new Date();
    const deleteResult = await GlobalBan.deleteMany({
      expiresAt: { $lt: now },
    });
    if (deleteResult.deletedCount > 0) {
      console.log(
        `[BanSync] Cleaned up ${deleteResult.deletedCount} expired bans`,
      );
    }

    // Process new bans from this agent
    if (newBans.length > 0) {
      const bansToInsert = newBans.map((ban) => ({
        ip: ban.ip,
        reason: ban.reason,
        bannedAt: new Date(ban.bannedAt),
        expiresAt: new Date(ban.expiresAt),
        sourceAgentId: agent._id.toString(),
        isPermanent: ban.isPermanent || false,
        isCIDR: ban.isCIDR || false,
      }));

      // Use insertMany with ordered:false to continue on duplicates
      try {
        await GlobalBan.insertMany(bansToInsert, { ordered: false });
        console.log(
          `[BanSync] Agent ${agent._id} reported ${newBans.length} new bans`,
        );
      } catch (error) {
        // Ignore duplicate key errors (E11000)
        if (error.code !== 11000) {
          console.error(`[BanSync] Error inserting bans:`, error);
        }
      }
    }

    // Get global bans for this agent
    // Only send bans that are:
    // 1. Still active (expiresAt > now)
    // 2. Created after agent's last sync time (incremental sync)
    const now = new Date();
    const syncTime = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

    const globalBans = await GlobalBan.find({
      expiresAt: { $gt: now },
      bannedAt: { $gt: syncTime },
      // Don't send back bans that this agent reported
      sourceAgentId: { $ne: agent._id.toString() },
    })
      .select("ip reason bannedAt expiresAt isPermanent isCIDR sourceAgentId")
      .sort({ bannedAt: 1 }) // Oldest first for consistent processing
      .limit(10000) // Safety limit to prevent huge responses
      .lean();

    // Update agent's last ban sync time
    agent.lastBanSyncTime = now;
    await agent.save();

    // Calculate statistics
    const totalActiveBans = await GlobalBan.countDocuments({
      expiresAt: { $gt: now },
    });

    console.log(
      `[BanSync] Agent ${agent._id}: received ${newBans.length} bans, sending ${globalBans.length} bans (total active: ${totalActiveBans})`,
    );

    return NextResponse.json({
      success: true,
      globalBans: globalBans.map((ban) => ({
        ip: ban.ip,
        reason: ban.reason,
        bannedAt: ban.bannedAt.toISOString(),
        expiresAt: ban.expiresAt.toISOString(),
        isPermanent: ban.isPermanent,
        isCIDR: ban.isCIDR,
      })),
      stats: {
        totalActiveBans,
        newBansReceived: newBans.length,
        bansSent: globalBans.length,
      },
    });
  } catch (error) {
    console.error("[BanSync] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

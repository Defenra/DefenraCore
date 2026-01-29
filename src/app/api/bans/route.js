import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import GlobalBan from "@/models/GlobalBan";
import Agent from "@/models/Agent";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/bans
 * List all global bans with filtering and pagination
 */
export async function GET(request) {
  try {
    const authCheck = await requirePermission("bans.read");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all, active, expired, permanent
    const sortBy = searchParams.get("sortBy") || "bannedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;
    const now = new Date();

    // Build query
    const query = {};

    // Filter by type
    if (type === "active") {
      query.expiresAt = { $gt: now };
    } else if (type === "expired") {
      query.expiresAt = { $lt: now };
    } else if (type === "permanent") {
      query.isPermanent = true;
    }

    // Search by IP
    if (search) {
      query.ip = { $regex: search, $options: "i" };
    }

    // Get total count
    const total = await GlobalBan.countDocuments(query);

    // Get bans
    const bans = await GlobalBan.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get agent names for source agents
    const agentIds = [...new Set(bans.map((ban) => ban.sourceAgentId))];
    const agents = await Agent.find({ _id: { $in: agentIds } })
      .select("_id name")
      .lean();

    const agentMap = Object.fromEntries(
      agents.map((agent) => [agent._id.toString(), agent.name]),
    );

    // Enrich bans with agent names and status
    const enrichedBans = bans.map((ban) => ({
      ...ban,
      _id: ban._id.toString(),
      sourceAgentName: agentMap[ban.sourceAgentId] || "Unknown",
      isActive: ban.expiresAt > now,
      remainingTime: ban.expiresAt > now ? ban.expiresAt - now : 0,
    }));

    // Statistics
    const stats = {
      total: await GlobalBan.countDocuments(),
      active: await GlobalBan.countDocuments({ expiresAt: { $gt: now } }),
      expired: await GlobalBan.countDocuments({ expiresAt: { $lt: now } }),
      permanent: await GlobalBan.countDocuments({ isPermanent: true }),
      cidr: await GlobalBan.countDocuments({ isCIDR: true }),
    };

    return NextResponse.json({
      bans: enrichedBans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("[Bans API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bans
 * Manually add a global ban
 */
export async function POST(request) {
  try {
    const authCheck = await requirePermission("bans.write");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status },
      );
    }

    await connectDB();

    const body = await request.json();
    const { ip, reason, duration, isPermanent, isCIDR } = body;

    // Validation
    if (!ip || !reason) {
      return NextResponse.json(
        { error: "IP and reason are required" },
        { status: 400 },
      );
    }

    // Calculate expiration
    const bannedAt = new Date();
    let expiresAt;

    if (isPermanent) {
      // 100 years for permanent bans
      expiresAt = new Date(
        bannedAt.getTime() + 100 * 365 * 24 * 60 * 60 * 1000,
      );
    } else {
      // Duration in seconds
      const durationMs = (duration || 3600) * 1000;
      expiresAt = new Date(bannedAt.getTime() + durationMs);
    }

    // Create ban
    const ban = await GlobalBan.create({
      ip,
      reason: `${reason} (manual)`,
      bannedAt,
      expiresAt,
      sourceAgentId: "manual",
      isPermanent: isPermanent || false,
      isCIDR: isCIDR || false,
    });

    console.log(
      `[Bans API] Manual ban created: ${ip} by ${authCheck.user.email}`,
    );

    return NextResponse.json({
      success: true,
      ban: {
        ...ban.toObject(),
        _id: ban._id.toString(),
      },
    });
  } catch (error) {
    console.error("[Bans API] Error creating ban:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bans
 * Delete expired bans (cleanup)
 */
export async function DELETE(_request) {
  try {
    const authCheck = await requirePermission("bans.write");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.message },
        { status: authCheck.status },
      );
    }

    await connectDB();

    const now = new Date();
    const result = await GlobalBan.deleteMany({
      expiresAt: { $lt: now },
    });

    console.log(
      `[Bans API] Cleanup: deleted ${result.deletedCount} expired bans by ${authCheck.user.email}`,
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[Bans API] Error during cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

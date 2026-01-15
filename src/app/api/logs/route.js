import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import AgentLog from "@/models/AgentLog";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const agentId = searchParams.get("agentId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query = {
      userId: session.user.id,
    };

    if (level && level !== "all") {
      query.level = level;
    }

    if (agentId && agentId !== "all") {
      const agent = await Agent.findOne({
        userId: session.user.id,
        agentId: agentId,
      });
      if (agent) {
        query.agentId = agent._id;
      }
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await AgentLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("agentId", "name agentId")
      .lean();

    const stats = await AgentLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
        },
      },
    ]);

    const levelStats = {
      info: 0,
      warning: 0,
      error: 0,
    };

    for (const stat of stats) {
      levelStats[stat._id] = stat.count;
    }

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        level: log.level,
        message: log.message,
        details: log.details || "",
        timestamp: log.timestamp,
        agent: {
          id: log.agentId?._id?.toString(),
          name: log.agentId?.name,
          agentId: log.agentId?.agentId,
        },
      })),
      stats: levelStats,
      total: logs.length,
    });
  } catch (error) {
    console.error("Logs error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении логов" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { agentId, level, message, details, metadata } = body;

    if (!agentId || !level || !message) {
      return NextResponse.json(
        { error: "agentId, level и message обязательны" },
        { status: 400 },
      );
    }

    if (!["info", "warning", "error"].includes(level)) {
      return NextResponse.json(
        { error: "level должен быть 'info', 'warning' или 'error'" },
        { status: 400 },
      );
    }

    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const log = await AgentLog.create({
      userId: agent.userId,
      agentId: agent._id,
      level,
      message,
      details: details || "",
      metadata: metadata || {},
      timestamp: new Date(),
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Log create error:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 },
    );
  }
}

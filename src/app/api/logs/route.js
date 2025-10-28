import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AgentLog from "@/models/AgentLog";
import Agent from "@/models/Agent";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Получаем query параметры
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const agentId = searchParams.get("agentId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search");

    // Строим запрос
    const query = { userId: session.user.id };

    if (level && level !== "all") {
      query.level = level;
    }

    if (agentId && agentId !== "all") {
      query.agentId = agentId;
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    // Получаем логи
    const logs = await AgentLog.find(query)
      .populate("agentId", "name agentId")
      .sort({ timestamp: -1 })
      .limit(limit);

    // Статистика по уровням
    const stats = await AgentLog.aggregate([
      { $match: { userId: session.user.id } },
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

    stats.forEach((stat) => {
      levelStats[stat._id] = stat.count;
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log._id,
        level: log.level,
        message: log.message,
        details: log.details,
        timestamp: log.timestamp,
        agent: log.agentId
          ? {
              id: log.agentId._id,
              name: log.agentId.name,
              agentId: log.agentId.agentId,
            }
          : null,
        metadata: log.metadata,
      })),
      stats: levelStats,
      total: logs.length,
    });
  } catch (error) {
    console.error("Logs list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении логов" },
      { status: 500 }
    );
  }
}

// POST для добавления лога (вызывается агентом)
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { agentId, level, message, details, metadata } = body;

    if (!agentId || !level || !message) {
      return NextResponse.json(
        { error: "agentId, level и message обязательны" },
        { status: 400 }
      );
    }

    // Проверяем уровень
    if (!["info", "warning", "error"].includes(level)) {
      return NextResponse.json(
        { error: "Неверный уровень лога" },
        { status: 400 }
      );
    }

    // Проверяем, что агент принадлежит пользователю
    const agent = await Agent.findOne({
      _id: agentId,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const log = await AgentLog.create({
      userId: session.user.id,
      agentId,
      level,
      message,
      details,
      metadata,
      timestamp: new Date(),
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Agent log create error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании лога" },
      { status: 500 }
    );
  }
}

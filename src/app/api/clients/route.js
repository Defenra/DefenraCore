import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import Client from "@/models/Client";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Получаем query параметры
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Строим запрос
    const query = { userId: session.user.id };
    if (agentId) {
      query.agentId = agentId;
    }

    // Получаем клиентов
    const clients = await Client.find(query)
      .populate("agentId", "name agentId")
      .sort({ lastSeen: -1 })
      .limit(limit);

    // Статистика
    const totalClients = await Client.countDocuments({
      userId: session.user.id,
    });
    const activeConnections = clients.reduce(
      (sum, c) => sum + c.connections,
      0,
    );
    const uniqueCountries = new Set(
      clients.map((c) => c.country).filter(Boolean),
    ).size;

    return NextResponse.json({
      clients: clients.map((client) => ({
        id: client._id,
        ip: client.ip,
        country: client.country,
        city: client.city,
        countryCode: client.countryCode,
        userAgent: client.userAgent,
        connections: client.connections,
        bytesSent: client.bytesSent || 0,
        bytesReceived: client.bytesReceived || 0,
        lastSeen: client.lastSeen,
        firstSeen: client.firstSeen,
        agent: client.agentId
          ? {
              id: client.agentId._id,
              name: client.agentId.name,
              agentId: client.agentId.agentId,
            }
          : null,
      })),
      stats: {
        totalClients,
        activeConnections,
        uniqueCountries,
      },
    });
  } catch (error) {
    console.error("Clients list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка клиентов" },
      { status: 500 },
    );
  }
}

// POST для добавления/обновления клиента (вызывается агентом)
export async function POST(request) {
  try {
    await connectDB();

    // Agent authentication: check Authorization header first
    const authHeader = request.headers.get("authorization");
    let agent = null;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      // Agent authentication via Bearer token
      const body = await request.json();
      const {
        ip,
        agentId,
        userAgent,
        country,
        city,
        countryCode,
        bytesSent,
        bytesReceived,
      } = body;

      if (!ip || !agentId) {
        return NextResponse.json(
          { error: "ip and agentId are required" },
          { status: 400 },
        );
      }

      agent = await Agent.findOne({ agentId });
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      userId = agent.userId;

      // Update or create client
      const updateData = {
        $set: {
          userAgent,
          country,
          city,
          countryCode,
          lastSeen: new Date(),
        },
        $inc: { connections: 1 },
        $setOnInsert: {
          firstSeen: new Date(),
        },
      };

      // Add traffic data if provided
      if (bytesSent !== undefined && bytesSent > 0) {
        updateData.$inc.bytesSent = bytesSent;
      }
      if (bytesReceived !== undefined && bytesReceived > 0) {
        updateData.$inc.bytesReceived = bytesReceived;
      }

      const client = await Client.findOneAndUpdate(
        { userId, ip, agentId: agent._id },
        updateData,
        { upsert: true, new: true },
      );

      return NextResponse.json({ client });
    }

    // User session authentication (for UI)
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ip, agentId, userAgent, country, city, countryCode } = body;

    if (!ip || !agentId) {
      return NextResponse.json(
        { error: "IP и agentId обязательны" },
        { status: 400 },
      );
    }

    // Проверяем, что агент принадлежит пользователю
    agent = await Agent.findOne({
      _id: agentId,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    // Обновляем или создаем клиента
    const client = await Client.findOneAndUpdate(
      { userId: session.user.id, ip, agentId: agent._id },
      {
        $set: {
          userAgent,
          country,
          city,
          countryCode,
          lastSeen: new Date(),
        },
        $inc: { connections: 1 },
        $setOnInsert: {
          firstSeen: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Client create/update error:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

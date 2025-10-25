import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Proxy from "@/models/Proxy";
import Agent from "@/models/Agent";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      type,
      sourcePort,
      destinationHost,
      destinationPort,
      agentId,
      description,
    } = body;

    if (!name || !type || !sourcePort || !destinationHost || !destinationPort) {
      return NextResponse.json(
        { error: "Все обязательные поля должны быть заполнены" },
        { status: 400 },
      );
    }

    if (!["tcp", "udp"].includes(type)) {
      return NextResponse.json(
        { error: "Тип должен быть tcp или udp" },
        { status: 400 },
      );
    }

    if (
      sourcePort < 1 ||
      sourcePort > 65535 ||
      destinationPort < 1 ||
      destinationPort > 65535
    ) {
      return NextResponse.json(
        { error: "Порт должен быть от 1 до 65535" },
        { status: 400 },
      );
    }

    if (agentId) {
      const agent = await Agent.findOne({ agentId, userId: session.user.id });
      if (!agent) {
        return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
      }
    }

    const existingProxy = await Proxy.findOne({
      userId: session.user.id,
      sourcePort,
      agentId: agentId || null,
    });

    if (existingProxy) {
      return NextResponse.json(
        {
          error: `Прокси на порту ${sourcePort} для ${agentId ? "этого агента" : "всех агентов"} уже существует`,
        },
        { status: 409 },
      );
    }

    const proxy = await Proxy.create({
      name,
      type,
      sourcePort,
      destinationHost,
      destinationPort,
      agentId: agentId || null,
      description,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "Прокси успешно создан",
      proxy: {
        id: proxy._id,
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        agentId: proxy.agentId,
        isActive: proxy.isActive,
        description: proxy.description,
      },
    });
  } catch (error) {
    console.error("Proxy creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании прокси" },
      { status: 500 },
    );
  }
}

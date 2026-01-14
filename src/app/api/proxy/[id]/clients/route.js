import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ProxyModel from "@/models/Proxy";
import Agent from "@/models/Agent";

export async function GET(_request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const proxy = await ProxyModel.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!proxy) {
      return NextResponse.json({ error: "Прокси не найден" }, { status: 404 });
    }

    // Получаем агентов для этого прокси
    const agents = await Agent.find({
      userId: session.user.id,
      isActive: true,
      $or: [{ _id: proxy.agentId }, ...(proxy.agentId === null ? [{}] : [])],
    }).select("agentId name ipAddress ipInfo");

    // Собираем клиентов со всех агентов
    const allClients = [];

    for (const agent of agents) {
      try {
        // Запрашиваем клиентов у агента через health endpoint
        const agentUrl = `http://${agent.ipAddress}:8080/clients?port=${proxy.sourcePort}`;
        const response = await fetch(agentUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          const clients = data.clients || [];

          // Добавляем информацию об агенте к каждому клиенту
          for (const client of clients) {
            allClients.push({
              ...client,
              agentId: agent.agentId,
              agentName: agent.name,
              agentIp: agent.ipAddress,
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to fetch clients from agent ${agent.name}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      proxy: {
        id: proxy._id,
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
      },
      clients: allClients,
      totalClients: allClients.length,
    });
  } catch (error) {
    console.error("Proxy clients fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении клиентов прокси" },
      { status: 500 },
    );
  }
}

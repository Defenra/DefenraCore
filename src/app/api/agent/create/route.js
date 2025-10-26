import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAgentId, generateAgentKey, generateToken } from "@/lib/crypto";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, pollingInterval } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название агента обязательно" },
        { status: 400 },
      );
    }

    const connectionToken = generateToken();
    const agentId = generateAgentId();
    const agentKey = generateAgentKey();

    const agent = await Agent.create({
      name,
      agentId,
      agentKey,
      connectionToken,
      pollingInterval: pollingInterval || 60,
      userId: session.user.id,
    });

    const host = request.headers.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const connectionUrl = `${protocol}://${host}/api/agent/connect/${connectionToken}`;

    return NextResponse.json({
      message: "Токен подключения создан",
      agent: {
        id: agent._id,
        name: agent.name,
        connectionUrl,
        expiresIn: "24 часа",
      },
    });
  } catch (error) {
    console.error("Agent creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании токена подключения" },
      { status: 500 },
    );
  }
}

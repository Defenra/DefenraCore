import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Proxy from "@/models/Proxy";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const proxies = await Proxy.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      proxies: proxies.map(proxy => ({
        id: proxy._id,
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        agentId: proxy.agentId,
        isActive: proxy.isActive,
        description: proxy.description,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Proxy list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка прокси" },
      { status: 500 }
    );
  }
}

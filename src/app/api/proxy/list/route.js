import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Proxy from "@/models/Proxy";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check if user can view all resources
    const user = await User.findById(session.user.id);
    const canViewAll = user?.canViewAllResources || false;

    const query = canViewAll ? {} : { userId: session.user.id };
    const proxies = await Proxy.find(query).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      proxies: proxies.map((proxy) => ({
        id: proxy._id,
        name: proxy.name,
        type: proxy.type,
        sourcePort: proxy.sourcePort,
        destinationHost: proxy.destinationHost,
        destinationPort: proxy.destinationPort,
        agentId: proxy.agentId,
        isActive: proxy.isActive,
        description: proxy.description,
        proxyProtocol: proxy.proxyProtocol || false,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Proxy list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка прокси" },
      { status: 500 },
    );
  }
}

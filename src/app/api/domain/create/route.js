import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { domain, description } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Домен обязателен" },
        { status: 400 }
      );
    }

    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Некорректный формат домена" },
        { status: 400 }
      );
    }

    const existingDomain = await Domain.findOne({ domain });
    if (existingDomain) {
      return NextResponse.json(
        { error: "Домен уже существует" },
        { status: 409 }
      );
    }

    // Default GeoDNS configuration
    const defaultGeoDnsConfig = [
      // Continents
      { code: "europe", name: "Европа", type: "continent", agentIds: [] },
      { code: "north-america", name: "Северная Америка", type: "continent", agentIds: [] },
      { code: "south-america", name: "Южная Америка", type: "continent", agentIds: [] },
      { code: "africa", name: "Африка", type: "continent", agentIds: [] },
      { code: "asia", name: "Азия", type: "continent", agentIds: [] },
      { code: "oceania", name: "Океания", type: "continent", agentIds: [] },
      
      // Popular countries
      { code: "us", name: "США", type: "country", agentIds: [] },
      { code: "ca", name: "Канада", type: "country", agentIds: [] },
      { code: "au", name: "Австралия", type: "country", agentIds: [] },
      { code: "jp", name: "Япония", type: "country", agentIds: [] },
      { code: "ir", name: "Иран", type: "country", agentIds: [] },
      { code: "ae", name: "ОАЭ", type: "country", agentIds: [] },
      { code: "tr", name: "Турция", type: "country", agentIds: [] },
      { code: "cn", name: "Китай", type: "country", agentIds: [] },
      { code: "kz", name: "Казахстан", type: "country", agentIds: [] },
      { code: "ru", name: "Россия", type: "country", agentIds: [] },
    ];

    const newDomain = await Domain.create({
      domain,
      description,
      userId: session.user.id,
      geoDnsConfig: defaultGeoDnsConfig,
    });

    return NextResponse.json({
      message: "Домен успешно создан",
      domain: {
        id: newDomain._id,
        domain: newDomain.domain,
        isActive: newDomain.isActive,
        description: newDomain.description,
      },
    });
  } catch (error) {
    console.error("Domain creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании домена" },
      { status: 500 }
    );
  }
}

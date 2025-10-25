import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { domain, description } = body;

    if (!domain) {
      return NextResponse.json({ error: "Домен обязателен" }, { status: 400 });
    }

    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Некорректный формат домена" },
        { status: 400 },
      );
    }

    const existingDomain = await Domain.findOne({ domain });
    if (existingDomain) {
      return NextResponse.json(
        { error: "Домен уже существует" },
        { status: 409 },
      );
    }

    // Default GeoDNS configuration - popular countries
    const defaultGeoDnsConfig = [
      // North America
      { code: "us", name: "США", type: "country", agentIds: [] },
      { code: "ca", name: "Канада", type: "country", agentIds: [] },
      { code: "mx", name: "Мексика", type: "country", agentIds: [] },

      // South America
      { code: "br", name: "Бразилия", type: "country", agentIds: [] },
      { code: "ar", name: "Аргентина", type: "country", agentIds: [] },
      { code: "cl", name: "Чили", type: "country", agentIds: [] },

      // Europe
      { code: "ru", name: "Россия", type: "country", agentIds: [] },
      { code: "gb", name: "Великобритания", type: "country", agentIds: [] },
      { code: "de", name: "Германия", type: "country", agentIds: [] },
      { code: "fr", name: "Франция", type: "country", agentIds: [] },
      { code: "it", name: "Италия", type: "country", agentIds: [] },
      { code: "es", name: "Испания", type: "country", agentIds: [] },
      { code: "pl", name: "Польша", type: "country", agentIds: [] },
      { code: "ua", name: "Украина", type: "country", agentIds: [] },
      { code: "nl", name: "Нидерланды", type: "country", agentIds: [] },
      { code: "tr", name: "Турция", type: "country", agentIds: [] },

      // Asia
      { code: "cn", name: "Китай", type: "country", agentIds: [] },
      { code: "jp", name: "Япония", type: "country", agentIds: [] },
      { code: "in", name: "Индия", type: "country", agentIds: [] },
      { code: "kr", name: "Южная Корея", type: "country", agentIds: [] },
      { code: "kz", name: "Казахстан", type: "country", agentIds: [] },
      { code: "ir", name: "Иран", type: "country", agentIds: [] },
      { code: "ae", name: "ОАЭ", type: "country", agentIds: [] },
      { code: "sg", name: "Сингапур", type: "country", agentIds: [] },
      { code: "id", name: "Индонезия", type: "country", agentIds: [] },
      { code: "th", name: "Таиланд", type: "country", agentIds: [] },

      // Africa
      { code: "za", name: "ЮАР", type: "country", agentIds: [] },
      { code: "eg", name: "Египет", type: "country", agentIds: [] },
      { code: "ng", name: "Нигерия", type: "country", agentIds: [] },

      // Oceania
      { code: "au", name: "Австралия", type: "country", agentIds: [] },
      { code: "nz", name: "Новая Зеландия", type: "country", agentIds: [] },
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
      { status: 500 },
    );
  }
}

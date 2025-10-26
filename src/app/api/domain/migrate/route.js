import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";

// Migration endpoint to add default GeoDNS locations to existing domains
export async function POST(_request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

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

    // Find all domains without geoDnsConfig or with empty array
    const domainsToMigrate = await Domain.find({
      userId: session.user.id,
      $or: [
        { geoDnsConfig: { $exists: false } },
        { geoDnsConfig: { $size: 0 } },
      ],
    });

    let migratedCount = 0;

    for (const domain of domainsToMigrate) {
      domain.geoDnsConfig = defaultGeoDnsConfig;
      await domain.save();
      migratedCount++;
    }

    return NextResponse.json({
      message: `Миграция завершена`,
      migratedCount,
      defaultLocationsAdded: defaultGeoDnsConfig.length,
    });
  } catch (error) {
    console.error("Domain migration error:", error);
    return NextResponse.json(
      { error: "Ошибка при миграции доменов" },
      { status: 500 },
    );
  }
}

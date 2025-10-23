import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

// Migration endpoint to add default GeoDNS locations to existing domains
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
      { status: 500 }
    );
  }
}

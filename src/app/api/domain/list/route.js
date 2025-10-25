import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const domains = await Domain.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      domains: domains.map((domain) => ({
        id: domain._id,
        domain: domain.domain,
        isActive: domain.isActive,
        httpProxy: domain.httpProxy,
        dnsRecords: domain.dnsRecords,
        description: domain.description,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Domain list error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка доменов" },
      { status: 500 },
    );
  }
}

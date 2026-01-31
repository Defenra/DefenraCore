import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
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
    const domains = await Domain.find(query).sort({
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

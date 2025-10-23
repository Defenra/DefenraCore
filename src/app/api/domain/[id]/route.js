import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const domain = await Domain.findOne({ 
      _id: id, 
      userId: session.user.id 
    });

    if (!domain) {
      return NextResponse.json(
        { error: "Домен не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      domain: {
        id: domain._id,
        domain: domain.domain,
        isActive: domain.isActive,
        httpProxy: domain.httpProxy,
        dnsRecords: domain.dnsRecords,
        geoDnsConfig: domain.geoDnsConfig,
        description: domain.description,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      },
    });
  } catch (error) {
    console.error("Domain get error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении домена" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const domain = await Domain.findOne({ 
      _id: id, 
      userId: session.user.id 
    });

    if (!domain) {
      return NextResponse.json(
        { error: "Домен не найден" },
        { status: 404 }
      );
    }

    if (body.isActive !== undefined) domain.isActive = body.isActive;
    if (body.description !== undefined) domain.description = body.description;
    if (body.httpProxy !== undefined) domain.httpProxy = body.httpProxy;
    if (body.dnsRecords !== undefined) domain.dnsRecords = body.dnsRecords;
    if (body.geoDnsConfig !== undefined) domain.geoDnsConfig = body.geoDnsConfig;

    await domain.save();

    return NextResponse.json({
      message: "Домен успешно обновлён",
      domain: {
        id: domain._id,
        domain: domain.domain,
        isActive: domain.isActive,
        httpProxy: domain.httpProxy,
        dnsRecords: domain.dnsRecords,
        geoDnsConfig: domain.geoDnsConfig,
        description: domain.description,
      },
    });
  } catch (error) {
    console.error("Domain update error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении домена" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const domain = await Domain.findOne({ 
      _id: id, 
      userId: session.user.id 
    });

    if (!domain) {
      return NextResponse.json(
        { error: "Домен не найден" },
        { status: 404 }
      );
    }

    await Domain.deleteOne({ _id: id });

    return NextResponse.json({
      message: "Домен успешно удалён",
    });
  } catch (error) {
    console.error("Domain deletion error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении домена" },
      { status: 500 }
    );
  }
}

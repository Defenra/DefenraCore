import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Proxy from "@/models/Proxy";
import { hasPermission } from "@/lib/permissions";

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, "proxies.write")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete proxies" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    const proxy = await Proxy.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!proxy) {
      return NextResponse.json({ error: "Прокси не найден" }, { status: 404 });
    }

    await Proxy.deleteOne({ _id: id });

    return NextResponse.json({
      message: "Прокси успешно удалён",
    });
  } catch (error) {
    console.error("Proxy deletion error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении прокси" },
      { status: 500 },
    );
  }
}

async function updateProxy(request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, "proxies.write")) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to update proxies" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { isActive, proxyProtocol } = body;

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive должен быть boolean" },
        { status: 400 },
      );
    }

    if (proxyProtocol !== undefined && typeof proxyProtocol !== "boolean") {
      return NextResponse.json(
        { error: "proxyProtocol должен быть boolean" },
        { status: 400 },
      );
    }

    const proxy = await Proxy.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!proxy) {
      return NextResponse.json({ error: "Прокси не найден" }, { status: 404 });
    }

    if (isActive !== undefined) {
      proxy.isActive = isActive;
    }
    if (proxyProtocol !== undefined) {
      proxy.proxyProtocol = proxyProtocol;
    }
    await proxy.save();

    return NextResponse.json({
      message: `Прокси ${isActive ? "активирован" : "деактивирован"}`,
      proxy: {
        id: proxy._id,
        isActive: proxy.isActive,
        proxyProtocol: proxy.proxyProtocol || false,
      },
    });
  } catch (error) {
    console.error("Proxy toggle error:", error);
    return NextResponse.json(
      { error: "Ошибка при изменении статуса прокси" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  return updateProxy(request, { params });
}

export async function PATCH(request, { params }) {
  return updateProxy(request, { params });
}

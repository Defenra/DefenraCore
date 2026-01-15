import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";

export async function GET(_request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const agent = await Agent.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Agent fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении агента" },
      { status: 500 },
    );
  }
}

export async function PATCH(_request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await _request.json();

    const agent = await Agent.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    // Update allowed fields
    const allowedFields = [
      "name",
      "tags",
      "label",
      "category",
      "provider",
      "price",
      "maxTraffic",
      "pollingInterval",
      "inactivityThreshold",
      "nextPaymentDate",
      "isPaid",
      "manualLocation",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        agent[field] = body[field];
      }
    });

    await agent.save();

    return NextResponse.json({
      message: "Агент успешно обновлён",
      agent,
    });
  } catch (error) {
    console.error("Agent update error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении агента" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const agent = await Agent.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    await Agent.deleteOne({ _id: id });

    return NextResponse.json({
      message: "Агент успешно удалён",
    });
  } catch (error) {
    console.error("Agent deletion error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении агента" },
      { status: 500 },
    );
  }
}

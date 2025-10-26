import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";

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

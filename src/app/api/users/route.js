/**
 * User Management API
 * GET /api/users - List all users
 * POST /api/users - Create new user
 */

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ROLES } from "@/lib/permissions";
import { requirePermission } from "@/lib/rbac";
import User from "@/models/User";

export async function GET() {
  const authCheck = await requirePermission("users.read");
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status },
    );
  }

  try {
    await connectDB();

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const authCheck = await requirePermission("users.write");
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status },
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, role, canViewAllResources } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate role
    if (!ROLES[role]) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      canViewAllResources: canViewAllResources || false,
    });

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      canViewAllResources: user.canViewAllResources,
      createdAt: user.createdAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}

/**
 * User Management API - Single User
 * GET /api/users/[id] - Get user by ID
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ROLES } from "@/lib/permissions";
import { requirePermission } from "@/lib/rbac";
import User from "@/models/User";

export async function GET(_request, { params }) {
  const authCheck = await requirePermission("users.read");
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status },
    );
  }

  try {
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const authCheck = await requirePermission("users.write");
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, canViewAllResources } = body;

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent user from changing their own role
    if (authCheck.user.id === id && role && role !== user.role) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 403 },
      );
    }

    // Validate role if provided
    if (role && !ROLES[role]) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    // Validate password strength if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Check if this is the last admin
    if (user.role === "admin" && role && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin user" },
          { status: 403 },
        );
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof canViewAllResources === "boolean") {
      user.canViewAllResources = canViewAllResources;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      canViewAllResources: user.canViewAllResources,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const authCheck = await requirePermission("users.write");
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.message },
      { status: authCheck.status },
    );
  }

  try {
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent user from deleting themselves
    if (authCheck.user.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 },
      );
    }

    // Check if this is the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin user" },
          { status: 403 },
        );
      }
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

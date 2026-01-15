"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { getAllRoles } from "@/lib/permissions";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission, isLoading: permLoading } = usePermissions();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = getAllRoles();
  const hasFetchedRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for session and permissions to load
    if (status === "loading" || permLoading) {
      return;
    }

    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Redirect if no permission to read users
    if (!hasPermission("users.read")) {
      router.push("/dashboard");
      return;
    }

    // Fetch users only once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUsers();
    }
  }, [status, permLoading, hasPermission, router, fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "viewer" });
    setFormError(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      hasFetchedRef.current = false; // Reset flag to allow refetch
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body = { ...formData };
      if (editingUser && !body.password) {
        delete body.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save user");
      }

      setShowModal(false);
      hasFetchedRef.current = false; // Reset flag to allow refetch
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      "proxy-manager": "bg-blue-100 text-blue-800",
      "domain-manager": "bg-green-100 text-green-800",
      operator: "bg-purple-100 text-purple-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleName = (role) => {
    const roleConfig = roles.find((r) => r.key === role);
    return roleConfig?.name || role;
  };

  if (status === "loading" || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!hasPermission("users.read")) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage users and their access permissions
          </p>
        </div>
        {hasPermission("users.write") && (
          <button
            type="button"
            onClick={handleAddUser}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            Add User
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {loading
        ? <div className="text-center py-12 text-gray-400">
            Loading users...
          </div>
        : <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    {hasPermission("users.write") && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-white">
                        {user.name}
                        {session?.user?.id === user._id && (
                          <span className="ml-2 text-xs text-gray-400">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 break-all">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                        >
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      {hasPermission("users.write") && (
                        <td className="px-4 py-3 text-sm text-right">
                          <button
                            type="button"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-400 hover:text-red-300"
                            disabled={session?.user?.id === user._id}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No users found
              </div>
            )}
          </div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingUser ? "Edit User" : "Add User"}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="user-name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="user-email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="user-password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required={!editingUser}
                  minLength={8}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="user-role"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Role
                </label>
                <select
                  id="user-role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

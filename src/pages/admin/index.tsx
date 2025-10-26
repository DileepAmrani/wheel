import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import { type User } from "firebase/auth";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  spinsCount: number;
  createdAt: string;
  isPublic: boolean;
}

interface AdminPageProps {
  user: User | null;
}

const AdminPage = ({ user }: AdminPageProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple admin check - you can enhance this with proper role-based access
  const isAdmin = user?.email === "raarnadottir@gmail.com";

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const userData = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserData[];
        setUsers(userData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const exportToCSV = () => {
    const headers = ["Email", "Display Name", "Spins Count", "Created At", "Is Public"];
    const csvContent = [
      headers.join(","),
      ...users.map((user) =>
        [
          user.email,
          user.displayName || "",
          user.spinsCount || 0,
          user.createdAt,
          user.isPublic ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg text-slate-600">Please log in to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-lg text-slate-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Manage and view all registered users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Users</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Spins</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {users.reduce((sum, user) => sum + (user.spinsCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Public Profiles</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {users.filter((user) => user.isPublic).length}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">User List</h2>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Spins Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((userData) => (
                <tr key={userData.uid} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{userData.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">
                      {userData.displayName || "No display name"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">
                      {userData.spinsCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">
                      {formatDate(userData.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.isPublic
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userData.isPublic ? "Public" : "Private"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

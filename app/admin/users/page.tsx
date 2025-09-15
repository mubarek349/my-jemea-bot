import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { 
      id: true, 
      firstName: true, 
      username: true, 
      isAdmin: true, 
      isActive: true, 
      createdAt: true 
    },
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const adminUsers = users.filter(u => u.isAdmin).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">
              Manage user accounts and monitor user activity across your bot.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
            <button className="btn btn-secondary">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{totalUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{activeUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Administrators</div>
              <div className="stat-value">{adminUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Users Table */}
      <div className="card-elevated">
        <div className="overflow-hidden">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-1/3">User</th>
                    <th className="w-1/4">Username</th>
                    <th className="w-1/6">Role</th>
                    <th className="w-1/6">Status</th>
                    <th className="w-1/6">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {(user.firstName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.firstName || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          @{user.username || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isAdmin ? (
                          <span className="badge badge-purple">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="badge badge-gray">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="badge badge-green">
                            <CheckCircleIcon className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="badge badge-red">
                            <XCircleIcon className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          {user.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <UsersIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No users found</h3>
              <p className="empty-state-description">
                No users have registered with your bot yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



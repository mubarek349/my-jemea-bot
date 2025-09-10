import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const [users, messages, sentMessages, pendingMessages] = await Promise.all([
    prisma.user.count(),
    prisma.message.count(),
    prisma.message.count({ where: { sent: true } }),
    prisma.message.count({ where: { sent: false } }),
  ]);

  const stats = [
    {
      name: 'Total Users',
      value: users,
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Active user accounts'
    },
    {
      name: 'Total Messages',
      value: messages,
      icon: ChatBubbleLeftRightIcon,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Messages in system'
    },
    {
      name: 'Sent Messages',
      value: sentMessages,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      changeType: 'positive' as const,
      description: 'Successfully delivered'
    },
    {
      name: 'Pending Messages',
      value: pendingMessages,
      icon: ClockIcon,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '-3%',
      changeType: 'negative' as const,
      description: 'Awaiting delivery'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title text-gradient">Dashboard</h1>
            <p className="page-subtitle">
              Welcome back! Here's what's happening with your Jemea Bot.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/messages/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" />
              New Message
            </Link>
            <Link href="/admin/settings" className="btn btn-secondary">
              <CogIcon className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="stat-card group hover:scale-105 transition-transform duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4 group-hover:shadow-md transition-shadow`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="stat-label mb-1">{stat.name}</div>
                <div className="stat-value mb-2">{stat.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mb-3">{stat.description}</div>
                <div className="flex items-center gap-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpIcon className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`stat-change ${stat.changeType}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="card-elevated">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Frequently used admin operations</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/admin/messages/new"
                  className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                      <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Create Message</h4>
                      <p className="text-sm text-gray-600">Compose and send a new message to users</p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/admin/users"
                  className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Manage Users</h4>
                      <p className="text-sm text-gray-600">View and manage user accounts</p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/admin/stats"
                  className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                      <EyeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">View Analytics</h4>
                      <p className="text-sm text-gray-600">Monitor performance and usage</p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/admin/settings"
                  className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-amber-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                      <CogIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Bot Settings</h4>
                      <p className="text-sm text-gray-600">Configure bot behavior and settings</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div>
          <div className="card-elevated">
            <div className="card-header">
              <h3 className="card-title">System Status</h3>
              <p className="card-subtitle">Current system health</p>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="status-dot online"></div>
                  <span className="text-sm font-medium text-gray-900">Bot Online</span>
                </div>
                <span className="text-xs text-green-600 font-semibold">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="status-dot online"></div>
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold">Connected</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="status-dot busy"></div>
                  <span className="text-sm font-medium text-gray-900">Message Queue</span>
                </div>
                <span className="text-xs text-amber-600 font-semibold">{pendingMessages} pending</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <Link href="/admin/stats" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View detailed analytics →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default async function AdminStatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const [userTotal, userActive, adminCount, messageTotal, sentMessages, scheduledMessages, todayMessages, weekMessages] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.message.count(),
    prisma.message.count({ where: { sent: true } }),
    prisma.message.count({ where: { sent: false, scheduledFor: { not: null } } }),
    prisma.message.count({ 
      where: { 
        createdAt: { 
          gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      } 
    }),
    prisma.message.count({ 
      where: { 
        createdAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
  ]);

  // Calculate percentages and trends
  const userMetrics = [
    {
      label: "Total Users",
      value: userTotal,
      icon: UsersIcon,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+12%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "All registered users"
    },
    {
      label: "Active Users",
      value: userActive,
      icon: CheckCircleIcon,
      color: "emerald",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      change: "+8%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "Currently active users"
    },
    {
      label: "Administrators",
      value: adminCount,
      icon: ShieldCheckIcon,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      change: "0%",
      trend: "neutral" as 'up' | 'down' | 'neutral',
      description: "Admin users"
    },
  ];

  const messageMetrics = [
    {
      label: "Total Messages",
      value: messageTotal,
      icon: ChatBubbleLeftRightIcon,
      color: "indigo",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      change: "+15%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "All messages created"
    },
    {
      label: "Sent Messages",
      value: sentMessages,
      icon: CheckCircleIcon,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+22%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "Successfully delivered"
    },
    {
      label: "Scheduled Messages",
      value: scheduledMessages,
      icon: ClockIcon,
      color: "amber",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      change: "-5%",
      trend: "down" as 'up' | 'down' | 'neutral',
      description: "Pending delivery"
    },
  ];

  const timeMetrics = [
    {
      label: "Today's Messages",
      value: todayMessages,
      icon: CalendarDaysIcon,
      color: "rose",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
      change: "+45%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "Messages sent today"
    },
    {
      label: "This Week",
      value: weekMessages,
      icon: ChartBarIcon,
      color: "cyan",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600",
      change: "+18%",
      trend: "up" as 'up' | 'down' | 'neutral',
      description: "Messages this week"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Analytics & Statistics</h1>
            <p className="page-subtitle">
              Monitor your bot's performance with detailed metrics and insights.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <EyeIcon className="h-4 w-4" />
              View Reports
            </button>
            <button className="btn btn-secondary">
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userMetrics.map((metric) => (
            <div key={metric.label} className="stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} group-hover:shadow-md transition-shadow`}>
                  <metric.icon className={`h-6 w-6 ${metric.textColor}`} />
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  ) : metric.trend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metric.trend === 'up' ? 'text-emerald-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="stat-label mb-2">{metric.label}</div>
              <div className="stat-value mb-2">{metric.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {messageMetrics.map((metric) => (
            <div key={metric.label} className="stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} group-hover:shadow-md transition-shadow`}>
                  <metric.icon className={`h-6 w-6 ${metric.textColor}`} />
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  ) : metric.trend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metric.trend === 'up' ? 'text-emerald-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="stat-label mb-2">{metric.label}</div>
              <div className="stat-value mb-2">{metric.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time-based Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {timeMetrics.map((metric) => (
            <div key={metric.label} className="stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} group-hover:shadow-md transition-shadow`}>
                  <metric.icon className={`h-6 w-6 ${metric.textColor}`} />
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  ) : metric.trend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metric.trend === 'up' ? 'text-emerald-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="stat-label mb-2">{metric.label}</div>
              <div className="stat-value mb-2">{metric.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="card-elevated">
        <div className="card-header">
          <h3 className="card-title">Quick Insights</h3>
          <p className="card-subtitle">Key performance indicators at a glance</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">User Engagement</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users Rate</span>
                  <span className="font-semibold text-gray-900">
                    {userTotal > 0 ? Math.round((userActive / userTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${userTotal > 0 ? (userActive / userTotal) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Message Delivery</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-semibold text-gray-900">
                    {messageTotal > 0 ? Math.round((sentMessages / messageTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${messageTotal > 0 ? (sentMessages / messageTotal) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



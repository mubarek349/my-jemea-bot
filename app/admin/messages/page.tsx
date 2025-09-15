import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { TimezoneStatus } from "@/components/TimezoneStatus";
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { firstName: true, username: true, isAdmin: true }
      }
    },
    take: 50
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Messages</h1>
            <p className="page-subtitle">
              Manage and monitor all bot messages. Create, edit, and track delivery status.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
            <Link href="/admin/messages/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" />
              Create Message
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Total Messages</div>
              <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
            </div>
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <TimezoneStatus className="h-full" />
        </div>
      </div>

      {/* Messages Table */}
      <div className="card-elevated">
        <div className="overflow-hidden">
          {messages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-1/4">Message Details</th>
                    <th className="w-1/3">Content Preview</th>
                    <th className="w-1/6">Sender</th>
                    <th className="w-1/8">Status</th>
                    <th className="w-1/8">Date</th>
                    <th className="w-1/12 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {message.title || "Untitled Message"}
                          </div>
                          {message.scheduledFor && !message.sent && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                              <CalendarDaysIcon className="h-3 w-3" />
                              {new Date(message.scheduledFor).toLocaleDateString()} at {new Date(message.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {message.content}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            {message.content.length} characters
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {((message.sender.firstName || "User").charAt(0) || "U").toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {message.sender.firstName || "Unknown"}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-500">
                                @{message.sender.username || "N/A"}
                              </div>
                              {message.sender.isAdmin && (
                                <span className="badge badge-indigo badge-sm">Admin</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {message.sent ? (
                          <span className="badge badge-green">
                            <CheckCircleIcon className="h-3 w-3" />
                            Sent
                          </span>
                        ) : message.scheduledFor ? (
                          <span className="badge badge-yellow">
                            <ClockIcon className="h-3 w-3" />
                            Scheduled
                          </span>
                        ) : (
                          <span className="badge badge-gray">
                            <XCircleIcon className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {message.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {message.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="action-menu opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/admin/messages/${message.id}`}
                            className="action-btn"
                            title="View message"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/admin/messages/${message.id}/edit`}
                            className="action-btn"
                            title="Edit message"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <ChatBubbleLeftRightIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No messages yet</h3>
              <p className="empty-state-description">
                Get started by creating your first message to send to users.
              </p>
              <Link href="/admin/messages/new" className="btn btn-primary">
                <PlusIcon className="h-4 w-4" />
                Create Your First Message
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
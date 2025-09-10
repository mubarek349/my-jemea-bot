import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ViewMessagePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    include: {
      sender: {
        select: { firstName: true, username: true, isAdmin: true }
      }
    }
  });

  if (!message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a 
            href="/admin/messages" 
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Messages
          </a>
        </div>
        <div className="text-center py-8">
          <h1 className="text-xl font-semibold text-gray-600">Message not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a 
            href="/admin/messages" 
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Messages
          </a>
          <h1 className="text-2xl font-semibold">Message Details</h1>
        </div>
        <Link 
          href={`/admin/messages/${message.id}/edit`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Edit Message
        </Link>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <div className="mt-1 text-lg">
                {message.title || "No title"}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Content</label>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {message.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Sender</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium">
                    {message.sender.firstName || "Unknown"}
                  </span>
                  {message.sender.isAdmin && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  @{message.sender.username || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <div className="mt-1 text-gray-900">
                  {message.createdAt.toLocaleString()}
                </div>
              </div>
            </div>

            {message.scheduledFor && (
              <div>
                <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                <div className="mt-1 text-gray-900">
                  {message.scheduledFor.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

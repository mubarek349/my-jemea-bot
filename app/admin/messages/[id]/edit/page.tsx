import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MessageForm } from "../../MessageForm";

export default async function EditMessagePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  const message = await prisma.message.findUnique({
    where: { id: params.id }
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
      <div className="flex items-center gap-4">
        <a 
          href="/admin/messages" 
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Messages
        </a>
        <h1 className="text-2xl font-semibold">Edit Message</h1>
      </div>

      <div className="max-w-2xl">
        <MessageForm message={message} />
      </div>
    </div>
  );
}

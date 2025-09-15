import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MessageForm } from "../MessageForm";

export default async function NewMessagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as any)?.isAdmin) redirect("/");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a 
          href="/admin/messages" 
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Messages
        </a>
        <h1 className="text-2xl font-semibold">Create New Message</h1>
      </div>

      <div className="max-w-2xl">
        <MessageForm />
      </div>
    </div>
  );
}

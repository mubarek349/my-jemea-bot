import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MessageService } from "@/services/messageService";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all failed messages
    const failedMessages = await MessageService.getFailedMessages();
    
    if (failedMessages.length === 0) {
      return NextResponse.json({ 
        message: "No failed messages to retry",
        retriedCount: 0 
      });
    }

    // Retry all failed messages
    let retriedCount = 0;
    for (const message of failedMessages) {
      await MessageService.retryFailedMessage(message.id);
      retriedCount++;
    }

    return NextResponse.json({ 
      message: `Successfully scheduled ${retriedCount} failed messages for retry`,
      retriedCount 
    });

  } catch (error) {
    console.error("Error retrying failed messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, scheduledFor } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Validate scheduled time if provided
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();
      
      if (scheduledDate <= now) {
        return NextResponse.json({ 
          error: "Scheduled time must be in the future" 
        }, { status: 400 });
      }
      
      // Check if it's too far in the future (max 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (scheduledDate > oneYearFromNow) {
        return NextResponse.json({ 
          error: "Scheduled time cannot be more than 1 year in the future" 
        }, { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        title: title || null,
        content: content.trim(),
        senderId: session.user.id,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { firstName: true, username: true, isAdmin: true }
        }
      },
      take: 100
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

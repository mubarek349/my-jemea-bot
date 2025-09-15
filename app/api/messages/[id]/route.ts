import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { firstName: true, username: true, isAdmin: true }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("PUT Request started for message update");
  
  try {
    const session = await auth();
    console.log("Session:", session?.user?.id ? "User authenticated" : "No session");
    
    if (!session?.user?.id) {
      console.log("Authorization failed: No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("Message ID:", id);
    
    const body = await request.json();
    console.log("PUT Request Body:", JSON.stringify(body, null, 2));
    const { title, content, scheduledFor } = body;

    if (!content || !content.trim()) {
      console.log("Validation Error: Content is required");
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Validate scheduled time if provided
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();
      
      console.log("Scheduled Date:", scheduledDate.toISOString());
      console.log("Current Date:", now.toISOString());
      console.log("Is valid date:", !isNaN(scheduledDate.getTime()));
      console.log("Is in future:", scheduledDate > now);
      
      if (isNaN(scheduledDate.getTime())) {
        console.log("Validation Error: Invalid date format");
        return NextResponse.json({ 
          error: "Invalid date format for scheduled time" 
        }, { status: 400 });
      }
      
      if (scheduledDate <= now) {
        console.log("Validation Error: Scheduled time must be in the future");
        return NextResponse.json({ 
          error: "Scheduled time must be in the future" 
        }, { status: 400 });
      }
      
      // Check if it's too far in the future (max 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (scheduledDate > oneYearFromNow) {
        console.log("Validation Error: Scheduled time cannot be more than 1 year in the future");
        return NextResponse.json({ 
          error: "Scheduled time cannot be more than 1 year in the future" 
        }, { status: 400 });
      }
    }

    console.log("Updating message in database...");
    const message = await prisma.message.update({
      where: { id },
      data: {
        title: title || null,
        content: content.trim(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    console.log("Message updated successfully:", message.id);
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

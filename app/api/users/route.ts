import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    console.log("Fetching users without authentication checks");
    
    // Fetch users without any authentication checks
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        phoneno: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("Users fetched successfully:", users.length);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

"use server"

import { signIn, signOut } from "@/auth"
import { auth } from "@/auth"
import { loginSchema } from "@/lib/zodSchema"
import { redirect } from "next/navigation"
import {prisma} from "@/lib/db";
import z from "zod"

// Types for consistent return values
type AuthResults = {
  success: boolean
  message: string
  error?: string
}

type UserData = {
  success: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  message: string
}

type AuthResult =
  | { ok: true; message: string; redirectTo?: string }
  | { ok: false; message: string; field?: "phoneno" | "passcode" | "form" };

function normalizePhone(phone: string) {
  // Example: strip spaces and non-digits; adapt to your locale rules.
  return phone.replace(/[^\d+]/g, "");
}

export async function authenticate(raw: z.infer<typeof loginSchema>): Promise<AuthResult> {
  // Validate on the server as well (never trust client)
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Invalid input.",
      field: (parsed.error.issues[0]?.path?.[0] as "phoneno" | "passcode") ?? "form",
    };
  }

  const data = parsed.data;
  const phoneno = normalizePhone(data.phoneno);

  try {
    // In NextAuth v5, signIn throws on failure. We keep redirect disabled and handle client-side navigation.
    await signIn("credentials", {
      phoneno,
      passcode: data.passcode,
      redirect: false,
    });

    // Optional: Hand back a canonical post-login path for the client to use.
    return {
      ok: true,
      message: "Login successful",
      redirectTo: "/admin",
    };
  } catch (err: unknown) {
    // Map common auth errors to clean, user-safe messages. Avoid returning raw error objects.
    const message = deriveAuthMessage(err);
    const field = deriveField(err);
    return { ok: false, message, field };
  }
}

function deriveAuthMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = typeof err === "object" && err !== null ? String((err as any).message ?? "") : String(err ?? "");
  // Common NextAuth credential error identifiers
  if (msg.includes("CredentialsSignin")) return "Invalid phone number or password.";
  if (msg.toLowerCase().includes("accessdenied")) return "You don’t have access to this resource.";
  // Fallback
  return "Unable to sign in. Please try again.";
}

function deriveField(err: unknown): "phoneno" | "passcode" | "form" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = typeof err === "object" && err !== null ? String((err as any).message ?? "") : String(err ?? "");
  if (msg.toLowerCase().includes("password")) return "passcode";
  if (msg.toLowerCase().includes("phone")) return "phoneno";
  return "form";
}

export async function logout(): Promise<AuthResults> {
  try {
    await signOut({ redirect: false })

    return {
      success: true,
      message: "Logout successful",
    }
  } catch (error) {
    console.error("Logout failed:", error)
    return {
      success: false,
      message: "Logout failed",
      error: "Unable to sign out properly",
    }
  }
}

export async function checkAuthentication(): Promise<boolean> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return false
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    return !!user
  } catch (error) {
    console.error("Authentication check failed:", error)
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return false
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    return !!user
  } catch (error) {
    console.error("Authentication verification failed:", error)
    return false
  }
}

export async function getCurrentUser(): Promise<UserData> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Not authenticated",
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        // Add other fields you want to return
        // email: true,
        // name: true,
        // role: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    return {
      success: true,
      data: user,
      message: "User data retrieved successfully",
    }
  } catch (error) {
    console.error("Failed to get user data:", error)
    return {
      success: false,
      message: "Failed to retrieve user data",
    }
  }
}

// Helper function for redirecting unauthenticated users
export async function requireAuthentication(redirectTo = "/login") {
  const isAuth = await checkAuthentication()

  if (!isAuth) {
    redirect(redirectTo)
  }
}

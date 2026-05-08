// src/app/api/auth/google/sync-token/route.ts
// Stores Google refresh token when user authenticates via Google OAuth

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { refreshToken, accessToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 400 }
      );
    }

    // Store refresh token in user record
    await db
      .update(users)
      .set({
        googleRefreshToken: refreshToken,
        googleAccessToken: accessToken,
        updatedAt: new Date(),
      })
      .where(eq(users.email, session.user.email!));

    return NextResponse.json({ success: true, message: "Token stored" });
  } catch (error) {
    console.error("Error storing Google token:", error);
    return NextResponse.json(
      { error: "Failed to store token" },
      { status: 500 }
    );
  }
}

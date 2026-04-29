// src/middleware.ts — place in src/ folder (not inside app/)
// Protects all routes except /login and /api/auth

import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isCron = req.nextUrl.pathname.startsWith("/api/cron");
  const isMigrate = req.nextUrl.pathname.startsWith("/api/migrate");

  // Allow auth routes, cron, and migration endpoints through
  if (isApiAuth || isCron || isMigrate) return NextResponse.next();

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect logged-in users away from login page
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
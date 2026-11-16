import { NextResponse } from "next/server";
import { getGoogleAuthorizationUrl } from "@/lib/google-auth";

export async function GET(request: Request) {
  try {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host =
      forwardedHost ||
      request.headers.get("host")?.replace(/:10000$/, "") ||
      undefined;
    const authUrl = getGoogleAuthorizationUrl(host);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Google OAuth start error:", error);
    const origin =
      request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
        : "https://epic-craft-tracker.onrender.com";
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent(error.message), origin)
    );
  }
}

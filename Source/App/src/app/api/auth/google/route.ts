import { NextResponse } from "next/server";
import { getGoogleAuthorizationUrl } from "@/lib/google-auth";

export async function GET(request: Request) {
  try {
    const host = request.headers.get("host") || undefined;
    const authUrl = getGoogleAuthorizationUrl(host);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Google OAuth start error:", error);
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent(error.message), request.url)
    );
  }
}

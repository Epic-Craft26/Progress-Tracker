import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { getGoogleOAuthConfig, exchangeGoogleCodeForUser } from "@/lib/google-auth";
import { Role } from "@/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");

  const loginRedirect = (msg: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, request.url));

  if (errorParam) {
    return loginRedirect("Google sign-in was cancelled or denied.");
  }

  if (!code) {
    return loginRedirect("Missing authorization code from Google.");
  }

  try {
    const config = getGoogleOAuthConfig();
    const host = request.headers.get("host") || "";
    let redirectUri = config.redirectUris[0] || "http://localhost:3001/api/auth/callback/google";
    const matched = config.redirectUris.find((uri) => host && uri.includes(host));
    if (matched) {
      redirectUri = matched;
    }

    const googleUser = await exchangeGoogleCodeForUser(code, redirectUri);

    // Find registered user in database
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: googleUser.email,
        },
      },
    });

    // Fallback: If CEO logs in with their personal Google email
    if (!user) {
      let ceo = await prisma.user.findFirst({ where: { role: "CEO" } });
      if (!ceo && (googleUser.email.toLowerCase().includes("karan") || googleUser.email.toLowerCase() === "karanraj2006rk@gmail.com")) {
        const hashedCeoPassword = await bcrypt.hash("2006", 10);
        ceo = await prisma.user.create({
          data: {
            name: googleUser.name || "Karan",
            email: googleUser.email,
            role: "CEO",
            passwordHash: hashedCeoPassword,
            mustChangePassword: false,
          },
        });
      }
      if (
        ceo &&
        (googleUser.email.toLowerCase().includes("karan") ||
          ceo.email.toLowerCase() === "karan" ||
          ceo.email.toLowerCase() === googleUser.email.toLowerCase())
      ) {
        user = ceo;
      }
    }

    if (!user) {
      return loginRedirect(
        `Access denied: Google account "${googleUser.email}" is not registered in Epic Craft. Please ask CEO Karan to add your email to the Team Directory.`
      );
    }

    if (!user.isActive) {
      return loginRedirect(
        `Account deactivated: Your profile (${user.name}) is currently inactive. Please contact CEO Karan.`
      );
    }

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      mustChangePassword: false, // Authenticated via Google
    });

    // Set HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false, // Localhost dev/prod support
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const destination = user.role === "CEO" ? "/ceo" : "/employee";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return loginRedirect(`Google login error: ${err.message || "Authentication failed"}`);
  }
}

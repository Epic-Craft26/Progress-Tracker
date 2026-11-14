import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "epic-craft-super-secret-jwt-key-2026-secure"
);
const COOKIE_NAME = "ec_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public assets, static media, and auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/logo") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const mustChangePassword = payload.mustChangePassword as boolean;

    // Force password change
    if (mustChangePassword && pathname !== "/reset-password" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }

    // Role-based protection: /ceo/* requires CEO role
    if (pathname.startsWith("/ceo") && userRole !== "CEO") {
      return NextResponse.redirect(new URL("/employee", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validations";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { UserSession } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const identifier = email.trim();
    const idLower = identifier.toLowerCase();
    const idTitle = identifier.charAt(0).toUpperCase() + identifier.slice(1).toLowerCase();

    // Support logging in via Email or Username (e.g. "karan")
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier } },
          { email: { equals: idLower } },
          { email: { startsWith: `${idLower}@` } },
          { name: { equals: identifier } },
          { name: { equals: idLower } },
          { name: { equals: idTitle } },
        ],
      },
    });

    // Fallback: Case-insensitive match against all active users
    if (!user) {
      const allActive = await prisma.user.findMany({ where: { isActive: true } });
      user =
        allActive.find(
          (u) =>
            u.email.toLowerCase() === idLower ||
            u.name.toLowerCase() === idLower ||
            u.email.split("@")[0].toLowerCase() === idLower
        ) || null;
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid username/email or account is inactive" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    const sessionPayload: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "CEO" | "EMPLOYEE",
      mustChangePassword: user.mustChangePassword,
    };

    const token = await createSessionToken(sessionPayload);

    const redirectUrl = user.mustChangePassword
      ? "/reset-password"
      : user.role === "CEO"
      ? "/ceo"
      : "/employee";

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl,
    });

    const isSecure =
      process.env.NODE_ENV === "production" &&
      !request.url.includes("localhost") &&
      !request.url.includes("127.0.0.1");

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred" },
      { status: 500 }
    );
  }
}

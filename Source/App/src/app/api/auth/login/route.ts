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

    const { employeeId, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid Employee ID or account is inactive" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password or PIN" },
        { status: 401 }
      );
    }

    const sessionPayload: UserSession = {
      id: user.id,
      employeeId: user.employeeId,
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

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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

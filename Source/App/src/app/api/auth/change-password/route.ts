import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { ChangePasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ChangePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(
      result.data.currentPassword,
      user.passwordHash
    );
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password does not match" },
        { status: 400 }
      );
    }

    const newHashedPassword = await bcrypt.hash(result.data.newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        passwordHash: newHashedPassword,
        mustChangePassword: false,
      },
    });

    const updatedSession = {
      ...session,
      mustChangePassword: false,
    };
    const newToken = await createSessionToken(updatedSession);

    const redirectUrl = updated.role === "CEO" ? "/ceo" : "/employee";
    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully",
      redirectUrl,
    });

    const isSecure =
      process.env.NODE_ENV === "production" &&
      !request.url.includes("localhost") &&
      !request.url.includes("127.0.0.1");

    response.cookies.set({
      name: COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/[a-zA-Z]/).regex(/\d/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Неверные данные", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // P2-4: Auto-verify email in development/demo mode
    // In production, implement proper email verification flow
    const isDevelopment = process.env.NODE_ENV !== "production";
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";

    const emailVerified =
      isDevelopment || skipEmailVerification ? new Date() : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified,
      },
    });

    // P2-4: Log warning if email verification is skipped
    if (!emailVerified) {
      console.warn(
        `[Auth] User ${email} registered without email verification. ` +
          "Implement email verification flow or set SKIP_EMAIL_VERIFICATION=true"
      );
    }

    return NextResponse.json(
      {
        message: emailVerified
          ? "Пользователь создан"
          : "Пользователь создан. Пожалуйста, подтвердите email перед входом.",
        userId: user.id,
        requiresVerification: !emailVerified,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

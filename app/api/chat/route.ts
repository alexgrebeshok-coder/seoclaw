import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/app/api/middleware/auth";
import { executeCommand } from "@/lib/command-handler";

/**
 * Chat API endpoint
 * Proxies user messages to CommandHandler and returns responses
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await authorizeRequest(request, {
    permission: "RUN_AI_ACTIONS",
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Execute command via CommandHandler
    const result = await executeCommand(message);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Произошла ошибка на сервере" },
      { status: 500 }
    );
  }
}

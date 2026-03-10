import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DASHBOARD_API_KEY || "dev-key-12345";

/**
 * Authentication middleware
 * Validates API key from Authorization header
 */
export function withAuth(
  req: NextRequest,
  res: NextResponse,
  next: () => void
) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (token !== API_KEY) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 403 }
    );
  }

  next();
}

import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Used by OpenClaw to test API connection
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}

import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { checkDueDates } from "@/lib/notify";
import { databaseUnavailable, serverError } from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

/**
 * POST /api/notifications/check-due-dates
 * Check for upcoming due dates and send notifications
 * 
 * This should be called by a cron job (e.g., every hour)
 * 
 * Example cron configuration:
 * 0 * * * * curl -X POST http://localhost:3000/api/notifications/check-due-dates
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authorizeRequest(request, {
      apiKey: process.env.CRON_SECRET,
      permission: "RUN_DUE_DATE_SCAN",
      requireApiKey: Boolean(process.env.CRON_SECRET),
      workspaceId: "executive",
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const runtime = getServerRuntimeState();

    if (runtime.usingMockData) {
      return NextResponse.json({
        success: true,
        notificationsCreated: 0,
        checkedTasks: 0,
        timestamp: new Date().toISOString(),
        mock: true,
      });
    }

    if (!runtime.databaseConfigured) {
      return databaseUnavailable(runtime.dataMode);
    }

    const result = await checkDueDates();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Check Due Dates API] Error:", error);
    return serverError(error, "Failed to check due dates");
  }
}

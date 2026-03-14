import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { prisma } from "@/lib/prisma";
import {
  badRequest,
  databaseUnavailable,
  serverError,
} from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

/**
 * GET /api/notifications
 * Get notifications for current user
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await authorizeRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }


  try {
    const runtime = getServerRuntimeState();

    if (runtime.usingMockData) {
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        total: 0,
      });
    }

    if (!runtime.databaseConfigured) {
      return databaseUnavailable(runtime.dataMode);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return serverError(error, "Failed to fetch notifications");
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await authorizeRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }


  try {
    const runtime = getServerRuntimeState();

    if (runtime.usingMockData) {
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    if (!runtime.databaseConfigured) {
      return databaseUnavailable(runtime.dataMode);
    }

    const body = await request.json();
    const { userId, type, title, message, entityType, entityId } = body;

    if (!userId || !type || !title || !message) {
      return badRequest("Missing required fields");
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        entityType,
        entityId,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return serverError(error, "Failed to create notification");
  }
}

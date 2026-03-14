import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, databaseUnavailable, notFound, serverError } from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";

/**
 * GET /api/time-entries — List time entries
 * POST /api/time-entries — Start timer (create time entry)
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
      return NextResponse.json([]);
    }

    if (!runtime.databaseConfigured) {
      return databaseUnavailable(runtime.dataMode);
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const memberId = searchParams.get("memberId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const entries = await prisma.timeEntry.findMany({
      where: {
        ...(taskId && { taskId }),
        ...(memberId && { memberId }),
        ...(startDate && {
          startTime: { gte: new Date(startDate) },
        }),
        ...(endDate && {
          startTime: { lte: new Date(endDate) },
        }),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        member: {
          select: { id: true, name: true, initials: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[Time Entries API] Error:", error);
    return serverError(error, "Failed to fetch time entries");
  }
}

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
    const { taskId, memberId, description, billable = true } = body;

    if (!taskId) {
      return badRequest("taskId is required");
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return notFound("Task not found");
    }

    // Check for active timer (entry without endTime)
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        taskId,
        memberId: memberId || null,
        endTime: null,
      },
    });

    if (activeEntry) {
      return badRequest("Timer already running for this task", "TIMER_ALREADY_RUNNING", {
        activeEntry,
      });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        memberId,
        startTime: new Date(),
        description,
        billable,
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
        member: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[Time Entries API] Error:", error);
    return serverError(error, "Failed to start timer");
  }
}

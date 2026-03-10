import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/time-entries — List time entries
 * POST /api/time-entries — Start timer (create time entry)
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json([]);
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
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const body = await request.json();
    const { taskId, memberId, description, billable = true } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "Timer already running for this task", activeEntry },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 }
    );
  }
}

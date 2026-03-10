import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizeTaskStatus, serverError, validationError } from "@/lib/server/api-utils";
import { createTaskSchema } from "@/lib/validators/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      const { getMockTasks } = await import("@/lib/mock-data");
      return NextResponse.json(getMockTasks());
    }

    const { searchParams } = new URL(request.url);
    const status = normalizeTaskStatus(searchParams.get("status"));
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");

    const tasks = await prisma.task.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(projectId && { projectId }),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        project: {
          select: { id: true, name: true, direction: true },
        },
        assignee: {
          select: { id: true, name: true, initials: true },
        },
      },
      orderBy: [{ order: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    // Fallback to mock data on any error
    const { getMockTasks } = await import("@/lib/mock-data");
    return NextResponse.json(getMockTasks());
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { assigneeId, description, dueDate, order, priority, projectId, status, title } = parsed.data;
    const normalizedStatus = normalizeTaskStatus(status) ?? "todo";

    const maxOrder = await prisma.task.aggregate({
      where: {
        projectId,
        status: normalizedStatus,
      },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId ?? undefined,
        dueDate: new Date(dueDate),
        status: normalizedStatus,
        priority: priority ?? "medium",
        order: order ?? (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        project: {
          select: { id: true, name: true, direction: true },
        },
        assignee: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create task.");
  }
}

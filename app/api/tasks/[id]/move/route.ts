import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/tasks/[id]/move — Move task to another column
 * 
 * Body: { columnId: string, order?: number }
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const { id } = await params;
    const body = await request.json();
    const { columnId, order } = body;

    if (!columnId) {
      return NextResponse.json(
        { error: "columnId is required" },
        { status: 400 }
      );
    }

    // Get current task
    const task = await prisma.task.findUnique({
      where: { id },
      select: { columnId: true, order: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If moving to same column, just update order
    // If moving to different column, update columnId and order

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        order: order ?? task.order,
        // Update status based on column
        status: await getColumnStatus(columnId),
      },
      include: {
        assignee: {
          select: { id: true, name: true, initials: true, avatar: true },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[Task Move API] Error:", error);
    return NextResponse.json(
      { error: "Failed to move task" },
      { status: 500 }
    );
  }
}

/**
 * Get task status based on column
 */
async function getColumnStatus(columnId: string): Promise<string> {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { title: true },
  });

  if (!column) return "todo";

  const title = column.title.toLowerCase();
  if (title.includes("done")) return "done";
  if (title.includes("progress")) return "in_progress";
  if (title.includes("review")) return "in_progress";
  return "todo";
}

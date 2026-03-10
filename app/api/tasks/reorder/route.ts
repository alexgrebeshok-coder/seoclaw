import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizeTaskStatus, serverError, validationError } from "@/lib/server/api-utils";
import { reorderTasksSchema } from "@/lib/validators/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ reordered: true, count: 0 });
    }

    const body = await request.json();
    const parsed = reorderTasksSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const updates = Object.entries(parsed.data.columns).flatMap(([statusKey, taskIds]) => {
      const status = normalizeTaskStatus(statusKey);
      if (!status || !Array.isArray(taskIds)) return [];

      return taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: {
            status,
            order: index,
            updatedAt: new Date(),
          },
        })
      );
    });

    await prisma.$transaction(updates);

    return NextResponse.json({
      reordered: true,
      count: updates.length,
    });
  } catch (error) {
    return serverError(error, "Failed to reorder tasks.");
  }
}

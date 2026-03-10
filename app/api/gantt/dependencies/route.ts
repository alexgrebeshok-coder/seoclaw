import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/gantt/dependencies — Dependencies for Gantt chart
 * 
 * Returns task dependencies with positions for rendering lines
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json([]);
    }

    const dependencies = await prisma.taskDependency.findMany({
      include: {
        task: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
          },
        },
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    // Format for Gantt rendering
    const links = dependencies.map((dep) => ({
      id: dep.id,
      type: dep.type,
      source: dep.dependsOnTaskId,
      target: dep.taskId,
      sourceTask: dep.dependsOnTask.title,
      targetTask: dep.task.title,
      sourceDate: dep.dependsOnTask.dueDate,
      targetDate: dep.task.dueDate,
    }));

    return NextResponse.json(links);
  } catch (error) {
    console.error("[Gantt Dependencies API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
      { status: 500 }
    );
  }
}

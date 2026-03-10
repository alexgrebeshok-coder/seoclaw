import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tasks/[id]/dependencies — Get task dependencies
 * POST /api/tasks/[id]/dependencies — Add dependency
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json({ dependencies: [], dependents: [] });
    }

    const { id } = await params;

    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId: id },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    const dependents = await prisma.taskDependency.findMany({
      where: { dependsOnTaskId: id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    return NextResponse.json({
      dependencies: dependencies.map((d) => ({
        id: d.id,
        type: d.type,
        task: d.dependsOnTask,
      })),
      dependents: dependents.map((d) => ({
        id: d.id,
        type: d.type,
        task: d.task,
      })),
    });
  } catch (error) {
    console.error("[Dependencies API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { dependsOnTaskId, type = "FINISH_TO_START" } = body;

    if (!dependsOnTaskId) {
      return NextResponse.json(
        { error: "dependsOnTaskId is required" },
        { status: 400 }
      );
    }

    // Check for circular dependency
    const hasCircular = await checkCircularDependency(id, dependsOnTaskId);
    if (hasCircular) {
      return NextResponse.json(
        { error: "Circular dependency detected" },
        { status: 400 }
      );
    }

    // Check if dependency already exists
    const existing = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId: id,
          dependsOnTaskId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 400 }
      );
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnTaskId,
        type,
      },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    console.error("[Dependencies API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create dependency" },
      { status: 500 }
    );
  }
}

/**
 * Check for circular dependency using DFS
 */
async function checkCircularDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<boolean> {
  // If A depends on B, check if B (directly or indirectly) depends on A
  const visited = new Set<string>();
  const stack = [dependsOnTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (current === taskId) {
      return true; // Circular dependency found
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get all tasks that current depends on
    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnTaskId: true },
    });

    stack.push(...deps.map((d) => d.dependsOnTaskId));
  }

  return false;
}

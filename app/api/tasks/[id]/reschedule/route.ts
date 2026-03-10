/**
 * POST /api/tasks/[id]/reschedule — Auto-reschedule dependent tasks
 * 
 * Called when a task's due date changes
 * Recursively updates all dependent tasks based on dependency type
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_RECURSION_DEPTH = 50;

interface RescheduleResult {
  taskId: string;
  taskTitle: string;
  oldDueDate: Date;
  newDueDate: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ rescheduledCount: 0, tasks: [] });
    }

    const { id } = await params;
    const body = await request.json();
    const { newDueDate } = body;

    if (!newDueDate) {
      return NextResponse.json(
        { error: "newDueDate is required" },
        { status: 400 }
      );
    }

    // Validate date
    const parsedDate = new Date(newDueDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, dueDate: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Use transaction for atomic updates
    const results = await prisma.$transaction(async (tx) => {
      const rescheduleResults: RescheduleResult[] = [];

      // Find all tasks that depend on this task
      const dependents = await tx.taskDependency.findMany({
        where: { dependsOnTaskId: id },
        include: {
          task: {
            select: { id: true, title: true, dueDate: true },
          },
        },
      });

      // Reschedule each dependent task
      for (const dep of dependents) {
        const dependentTask = dep.task;
        const oldDueDate = dependentTask.dueDate;

        // Calculate new due date based on dependency type
        let updatedDueDate: Date | null = null;

        switch (dep.type) {
          case "FINISH_TO_START":
            // Dependent task starts after this task finishes
            if (oldDueDate < parsedDate) {
              updatedDueDate = parsedDate;
            }
            break;

          case "START_TO_START":
            // Both tasks should start around the same time
            if (oldDueDate.getTime() !== parsedDate.getTime()) {
              updatedDueDate = parsedDate;
            }
            break;
        }

        if (updatedDueDate) {
          // Update task
          await tx.task.update({
            where: { id: dependentTask.id },
            data: { dueDate: updatedDueDate },
          });

          rescheduleResults.push({
            taskId: dependentTask.id,
            taskTitle: dependentTask.title,
            oldDueDate,
            newDueDate: updatedDueDate,
          });

          // Recursively reschedule with depth limit
          const recursiveResults = await rescheduleRecursive(
            tx,
            dependentTask.id,
            updatedDueDate,
            0 // Start depth at 0
          );
          rescheduleResults.push(...recursiveResults);
        }
      }

      return rescheduleResults;
    });

    return NextResponse.json({
      rescheduledCount: results.length,
      tasks: results,
    });
  } catch (error) {
    console.error("[Reschedule API] Error:", error);
    
    if (error instanceof Error && error.message === "Max recursion depth exceeded") {
      return NextResponse.json(
        { error: "Dependency chain too deep (possible circular dependency)" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to reschedule tasks" },
      { status: 500 }
    );
  }
}

/**
 * Recursively reschedule dependent tasks with depth limit
 */
async function rescheduleRecursive(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  taskId: string,
  newDueDate: Date,
  depth: number
): Promise<RescheduleResult[]> {
  // Check depth limit
  if (depth >= MAX_RECURSION_DEPTH) {
    throw new Error("Max recursion depth exceeded");
  }

  const results: RescheduleResult[] = [];

  const dependents = await tx.taskDependency.findMany({
    where: { dependsOnTaskId: taskId },
    include: {
      task: {
        select: { id: true, title: true, dueDate: true },
      },
    },
  });

  for (const dep of dependents) {
    const dependentTask = dep.task;
    const oldDueDate = dependentTask.dueDate;

    if (dep.type === "FINISH_TO_START" && oldDueDate < newDueDate) {
      await tx.task.update({
        where: { id: dependentTask.id },
        data: { dueDate: newDueDate },
      });

      results.push({
        taskId: dependentTask.id,
        taskTitle: dependentTask.title,
        oldDueDate,
        newDueDate,
      });

      // Continue recursion with incremented depth
      const recursiveResults = await rescheduleRecursive(
        tx,
        dependentTask.id,
        newDueDate,
        depth + 1
      );
      results.push(...recursiveResults);
    }
  }

  return results;
}

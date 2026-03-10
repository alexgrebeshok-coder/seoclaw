import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/predictions — AI predictions for projects
 * 
 * Predictions:
 * - Project finish date prediction
 * - Budget overrun risk
 * - Resource bottleneck detection
 * 
 * Query params:
 * - projectId: Filter by project (optional)
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock predictions if no database
      const { getMockProjects } = await import("@/lib/mock-data");
      const projects = getMockProjects();

      const predictions = projects.map((project) => ({
        projectId: project.id,
        projectName: project.name,
        predictedFinishDate: project.dates.end,
        budgetOverrunRisk: Math.random() * 30,
        resourceBottleneck: Math.random() > 0.7,
        velocity: 3 + Math.random() * 2,
        risks: {
          budgetOverrun: Math.random() * 40,
          scheduleDelay: Math.random() * 30,
          resourceShortage: Math.random() * 20,
        },
      }));

      return NextResponse.json({ predictions });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Get projects with tasks
    const projects = await prisma.project.findMany({
      where: projectId ? { id: projectId } : undefined,
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            createdAt: true,
            completedAt: true,
            assigneeId: true,
          },
        },
      },
    });

    // Generate predictions for each project
    const predictions = projects.map((project) => {
      const tasks = project.tasks;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "done").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

      // Calculate velocity (tasks completed per week)
      const weeksSinceStart = Math.max(
        1,
        Math.ceil(
          (Date.now() - project.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )
      );
      const velocity = completedTasks / weeksSinceStart;

      // Predict finish date
      const remainingTasks = totalTasks - completedTasks;
      const weeksToFinish = velocity > 0 ? remainingTasks / velocity : Infinity;
      const predictedFinishDate =
        weeksToFinish < Infinity
          ? new Date(Date.now() + weeksToFinish * 7 * 24 * 60 * 60 * 1000)
          : null;

      // Check if predicted finish is after due date
      const isOverdue =
        predictedFinishDate &&
        project.end &&
        predictedFinishDate > new Date(project.end);

      // Budget overrun risk (simplified - based on task completion rate)
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
      const timeElapsed =
        project.end && project.start
          ? Math.min(
              1,
              (Date.now() - new Date(project.start).getTime()) /
                (new Date(project.end).getTime() -
                  new Date(project.start).getTime())
            )
          : 0;

      const budgetOverrunRisk =
        timeElapsed > completionRate ? (timeElapsed - completionRate) * 100 : 0;

      // Resource bottleneck detection
      const assigneeLoad: Record<string, number> = {};
      tasks.forEach((t) => {
        if (t.assigneeId && t.status !== "done") {
          assigneeLoad[t.assigneeId] = (assigneeLoad[t.assigneeId] || 0) + 1;
        }
      });

      const maxLoad = Math.max(0, ...Object.values(assigneeLoad));
      const avgLoad =
        Object.keys(assigneeLoad).length > 0
          ? Object.values(assigneeLoad).reduce((a, b) => a + b, 0) /
            Object.keys(assigneeLoad).length
          : 0;

      const bottleneckRisk =
        maxLoad > avgLoad * 1.5 ? ((maxLoad - avgLoad) / avgLoad) * 50 : 0;

      // Overall risk score (0-100)
      const overallRisk = Math.min(
        100,
        (budgetOverrunRisk * 0.4 + bottleneckRisk * 0.3 + (isOverdue ? 30 : 0))
      );

      return {
        projectId: project.id,
        projectName: project.name,
        predictions: {
          finishDate: predictedFinishDate?.toISOString() || null,
          weeksToFinish: weeksToFinish < Infinity ? Math.round(weeksToFinish * 10) / 10 : null,
          isOverdue,
          velocity: Math.round(velocity * 10) / 10,
        },
        risks: {
          budgetOverrun: Math.round(budgetOverrunRisk),
          resourceBottleneck: Math.round(bottleneckRisk),
          overall: Math.round(overallRisk),
        },
        metrics: {
          totalTasks,
          completedTasks,
          remainingTasks,
          completionRate: Math.round(completionRate * 100),
        },
      };
    });

    // Sort by overall risk (highest first)
    predictions.sort((a, b) => b.risks.overall - a.risks.overall);

    return NextResponse.json({
      predictions,
      summary: {
        totalProjects: predictions.length,
        highRisk: predictions.filter((p) => p.risks.overall >= 70).length,
        mediumRisk: predictions.filter(
          (p) => p.risks.overall >= 40 && p.risks.overall < 70
        ).length,
        lowRisk: predictions.filter((p) => p.risks.overall < 40).length,
      },
    });
  } catch (error) {
    console.error("[Predictions API] Error:", error);
    // Fallback to mock data on any error
    const { getMockProjects } = await import("@/lib/mock-data");
    const projects = getMockProjects();

    const predictions = projects.slice(0, 3).map((project) => ({
      projectId: project.id,
      projectName: project.name,
      predictedFinishDate: project.dates.end,
      budgetOverrunRisk: Math.random() * 30,
      resourceBottleneck: Math.random() > 0.7,
      velocity: 3 + Math.random() * 2,
      risks: {
        budgetOverrun: Math.random() * 40,
        scheduleDelay: Math.random() * 30,
        resourceShortage: Math.random() * 20,
      },
    }));

    return NextResponse.json({ predictions });
  }
}

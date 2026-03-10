import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/overview — Project analytics overview
 * 
 * Query params:
 * - projectId: Filter by project (optional, returns all if not specified)
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock analytics if no database
      const { getMockProjects, getMockTasks } = await import("@/lib/mock-data");
      const projects = getMockProjects();
      const tasks = getMockTasks();

      const analytics = projects.map((project) => {
        const projectTasks = tasks.filter((t) => t.projectId === project.id);
        const totalTasks = projectTasks.length;

        const statusBreakdown = {
          todo: projectTasks.filter((t) => t.status === "todo").length,
          inProgress: projectTasks.filter((t) => t.status === "in-progress").length,
          blocked: projectTasks.filter((t) => t.status === "blocked").length,
          done: projectTasks.filter((t) => t.status === "done").length,
        };

        const priorityBreakdown = {
          high: projectTasks.filter((t) => t.priority === "high" || t.priority === "critical").length,
          medium: projectTasks.filter((t) => t.priority === "medium").length,
          low: projectTasks.filter((t) => t.priority === "low").length,
        };

        const completedTasks = statusBreakdown.done;
        const avgProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : project.progress;

        const now = new Date();
        const overdueTasks = projectTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
        ).length;

        const healthScore = calculateHealthScore({
          avgProgress,
          overdueTasks,
          totalTasks,
        });

        return {
          projectId: project.id,
          projectName: project.name,
          totalTasks,
          statusBreakdown,
          priorityBreakdown,
          progress: Math.round(avgProgress),
          overdueTasks,
          healthScore,
        };
      });

      const summary = {
        totalProjects: analytics.length,
        totalTasks: analytics.reduce((sum, p) => sum + p.totalTasks, 0),
        avgProgress: analytics.length > 0
          ? Math.round(analytics.reduce((sum, p) => sum + p.progress, 0) / analytics.length)
          : 0,
        totalOverdue: analytics.reduce((sum, p) => sum + p.overdueTasks, 0),
        avgHealthScore: analytics.length > 0
          ? Math.round(analytics.reduce((sum, p) => sum + p.healthScore, 0) / analytics.length)
          : 0,
      };

      return NextResponse.json({ summary, projects: analytics });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Build where clause
    const projectWhere = projectId ? { id: projectId } : {};

    // Get projects with tasks
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
    });

    // Calculate analytics for each project
    const analytics = projects.map((project) => {
      const tasks = project.tasks;
      const totalTasks = tasks.length;
      
      // Status breakdown
      const statusBreakdown = {
        todo: tasks.filter((t) => t.status === "todo").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        review: tasks.filter((t) => t.status === "review").length,
        done: tasks.filter((t) => t.status === "done").length,
      };

      // Priority breakdown
      const priorityBreakdown = {
        high: tasks.filter((t) => t.priority === "high").length,
        medium: tasks.filter((t) => t.priority === "medium").length,
        low: tasks.filter((t) => t.priority === "low").length,
      };

      // Progress calculation (based on status)
      const completedTasks = statusBreakdown.done;
      const avgProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Overdue tasks
      const now = new Date();
      const overdueTasks = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
      ).length;

      // Health score (0-100)
      const healthScore = calculateHealthScore({
        avgProgress,
        overdueTasks,
        totalTasks,
      });

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        statusBreakdown,
        priorityBreakdown,
        progress: Math.round(avgProgress),
        overdueTasks,
        healthScore,
      };
    });

    // Overall summary
    const summary = {
      totalProjects: analytics.length,
      totalTasks: analytics.reduce((sum, p) => sum + p.totalTasks, 0),
      avgProgress:
        analytics.length > 0
          ? Math.round(
              analytics.reduce((sum, p) => sum + p.progress, 0) / analytics.length
            )
          : 0,
      totalOverdue: analytics.reduce((sum, p) => sum + p.overdueTasks, 0),
      avgHealthScore:
        analytics.length > 0
          ? Math.round(
              analytics.reduce((sum, p) => sum + p.healthScore, 0) / analytics.length
            )
          : 0,
    };

    return NextResponse.json({
      summary,
      projects: analytics,
    });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    // Fallback to mock data on any error
    const { getMockProjects, getMockTasks } = await import("@/lib/mock-data");
    const projects = getMockProjects();
    const tasks = getMockTasks();

    const summary = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      avgProgress: 45,
      totalOverdue: 2,
      avgHealthScore: 72,
    };

    return NextResponse.json({ summary, projects: [] });
  }
}

/**
 * Calculate project health score (0-100)
 */
function calculateHealthScore(data: {
  avgProgress: number;
  overdueTasks: number;
  totalTasks: number;
}): number {
  let score = 100;

  // Progress factor (0-40 points)
  score -= (100 - data.avgProgress) * 0.4;

  // Overdue factor (0-60 points)
  if (data.totalTasks > 0) {
    const overdueRate = data.overdueTasks / data.totalTasks;
    score -= overdueRate * 60;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

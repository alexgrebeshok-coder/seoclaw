import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/events — Calendar events for tasks
 * 
 * Query params:
 * - startDate: Start of period
 * - endDate: End of period
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock calendar events if no database
      const { getMockTasks, getMockProjects } = await import("@/lib/mock-data");
      const tasks = getMockTasks();
      const projects = getMockProjects();

      const events = tasks
        .filter((t) => t.dueDate)
        .map((t) => {
          const project = projects.find((p) => p.id === t.projectId);
          return {
            id: t.id,
            title: t.title,
            start: t.dueDate,
            end: t.dueDate,
            allDay: true,
            color: getStatusColor(t.status),
            resource: {
              projectId: t.projectId,
              projectName: project?.name || "Unknown",
            },
          };
        });

      return NextResponse.json(events);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const tasks = await prisma.task.findMany({
      where: {
        ...where,
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        projectId: true,
        project: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const events = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      start: t.dueDate,
      end: t.dueDate,
      allDay: true,
      color: getStatusColor(t.status),
      resource: {
        projectId: t.projectId,
        projectName: t.project.name,
      },
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error("[Calendar API] Error:", error);
    // Fallback to mock data on any error
    const { getMockTasks, getMockProjects } = await import("@/lib/mock-data");
    const tasks = getMockTasks();
    const projects = getMockProjects();

    const events = tasks
      .filter((t) => t.dueDate)
      .map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          start: t.dueDate,
          end: t.dueDate,
          allDay: true,
          color: getStatusColor(t.status),
          resource: {
            projectId: t.projectId,
            projectName: project?.name || "Unknown",
          },
        };
      });

    return NextResponse.json(events);
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "done":
      return "#22c55e"; // green
    case "in_progress":
      return "#3b82f6"; // blue
    case "blocked":
      return "#f43f5e"; // red
    case "todo":
      return "#94a3b8"; // gray
    default:
      return "#f59e0b"; // orange
  }
}

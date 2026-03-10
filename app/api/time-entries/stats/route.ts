import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/time-entries/stats — Time tracking statistics
 * 
 * Query params:
 * - projectId: Filter by project
 * - memberId: Filter by team member
 * - startDate: Start of period
 * - endDate: End of period
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json({
        summary: {
          totalEntries: 0,
          totalHours: 0,
          totalSeconds: 0,
          billableHours: 0,
          billableSeconds: 0,
        },
        byProject: [],
        byMember: [],
        byTask: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const memberId = searchParams.get("memberId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};
    
    if (memberId) {
      where.memberId = memberId;
    }
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Get entries with task and project info
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: { select: { id: true, name: true } },
          },
        },
        member: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    // Filter by project if specified
    const filteredEntries = projectId
      ? entries.filter((e) => e.task.projectId === projectId)
      : entries;

    // Calculate statistics
    const totalSeconds = filteredEntries.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    );

    const billableSeconds = filteredEntries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    // Group by project
    const byProject = filteredEntries.reduce((acc, e) => {
      const projectId = e.task.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: e.task.project,
          totalSeconds: 0,
          entryCount: 0,
        };
      }
      acc[projectId].totalSeconds += e.duration || 0;
      acc[projectId].entryCount++;
      return acc;
    }, {} as Record<string, any>);

    // Group by member
    const byMember = filteredEntries.reduce((acc, e) => {
      const memberId = e.memberId || "unassigned";
      if (!acc[memberId]) {
        acc[memberId] = {
          member: e.member,
          totalSeconds: 0,
          entryCount: 0,
        };
      }
      acc[memberId].totalSeconds += e.duration || 0;
      acc[memberId].entryCount++;
      return acc;
    }, {} as Record<string, any>);

    // Group by task
    const byTask = filteredEntries.reduce((acc, e) => {
      const taskId = e.taskId;
      if (!acc[taskId]) {
        acc[taskId] = {
          task: { id: e.task.id, title: e.task.title },
          totalSeconds: 0,
          entryCount: 0,
        };
      }
      acc[taskId].totalSeconds += e.duration || 0;
      acc[taskId].entryCount++;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      summary: {
        totalEntries: filteredEntries.length,
        totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
        totalSeconds,
        billableHours: Math.round((billableSeconds / 3600) * 100) / 100,
        billableSeconds,
      },
      byProject: Object.values(byProject),
      byMember: Object.values(byMember),
      byTask: Object.values(byTask),
    });
  } catch (error) {
    console.error("[Time Stats API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch time statistics" },
      { status: 500 }
    );
  }
}

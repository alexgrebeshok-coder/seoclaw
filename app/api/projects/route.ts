import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/app/api/middleware/auth";

import { prisma } from "@/lib/prisma";
import {
  calculateProjectHealth,
  calculateProjectProgress,
  normalizeProjectStatus,
  serverError,
  serviceUnavailable,
  validationError,
} from "@/lib/server/api-utils";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { createProjectSchema } from "@/lib/validators/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Require authentication
  const authResult = await authorizeRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }


  try {
    const runtime = getServerRuntimeState();

    if (runtime.usingMockData) {
      const { getMockProjects } = await import("@/lib/mock-data");
      return NextResponse.json(getMockProjects());
    }

    if (!runtime.databaseConfigured) {
      return serviceUnavailable(
        "DATABASE_URL is not configured for live mode.",
        "DATABASE_UNAVAILABLE",
        { dataMode: runtime.dataMode }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = normalizeProjectStatus(searchParams.get("status"));
    const direction = searchParams.get("direction");

    // P2-1: Add pagination to prevent overfetching
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // P2-1: Add optional includes to reduce payload size
    const includeTasks = searchParams.get("includeTasks") === "true";
    const includeTeam = searchParams.get("includeTeam") === "true";
    const includeRisks = searchParams.get("includeRisks") === "true";
    const includeMilestones = searchParams.get("includeMilestones") === "true";
    const includeDocuments = searchParams.get("includeDocuments") === "true";

    // P2-1: Use select to narrow fields and conditional includes
    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status }),
        ...(direction && { direction }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        direction: true,
        priority: true,
        start: true,
        end: true,
        budgetPlan: true,
        budgetFact: true,
        progress: true,
        health: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        // Conditional includes - only fetch what's requested
        ...(includeTasks
          ? {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                  dueDate: true,
                  assigneeId: true,
                },
                orderBy: [{ order: "asc" }, { dueDate: "asc" }],
              },
            }
          : {}),
        ...(includeTeam
          ? {
              team: {
                select: { id: true, name: true, initials: true },
                orderBy: { name: "asc" },
              },
            }
          : {}),
        ...(includeRisks
          ? {
              risks: {
                where: { status: "open" },
                select: { id: true, title: true, severity: true, status: true },
                orderBy: { severity: "desc" },
              },
            }
          : {}),
        ...(includeMilestones
          ? {
              milestones: {
                select: { id: true, title: true, date: true, status: true },
                orderBy: { date: "asc" },
              },
            }
          : {}),
        ...(includeDocuments
          ? {
              documents: {
                select: { id: true, title: true, type: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
              },
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    // P2-1: Add pagination metadata
    const total = await prisma.project.count({
      where: {
        ...(status && { status }),
        ...(direction && { direction }),
      },
    });

    return NextResponse.json({
      projects: projects.map((project) => ({
        ...project,
        progress: calculateProjectProgress(project),
        health: calculateProjectHealth(project),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    return serverError(error, "Failed to fetch projects.");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Require authentication
  const authResult = await authorizeRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }


  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const {
      budgetFact,
      budgetPlan,
      description,
      direction,
      end,
      health,
      location,
      name,
      priority,
      progress,
      start,
      status,
      teamIds = [],
    } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: normalizeProjectStatus(status) ?? "planning",
        direction,
        priority: priority ?? "medium",
        start: new Date(start),
        end: new Date(end),
        budgetPlan,
        budgetFact: budgetFact ?? 0,
        progress: progress ?? 0,
        health: health ?? "good",
        location,
        ...(teamIds.length
          ? {
              team: {
                connect: teamIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, initials: true },
            },
          },
          orderBy: [{ order: "asc" }, { dueDate: "asc" }],
        },
        team: {
          orderBy: { name: "asc" },
        },
        risks: {
          where: { status: "open" },
          orderBy: { severity: "desc" },
        },
        milestones: {
          orderBy: { date: "asc" },
        },
        documents: {
          include: {
            owner: {
              select: { id: true, name: true, initials: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return NextResponse.json(
      {
        ...project,
        progress: calculateProjectProgress(project),
        health: calculateProjectHealth(project),
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error, "Failed to create project.");
  }
}

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  calculateProjectHealth,
  calculateProjectProgress,
  normalizeProjectStatus,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { createProjectSchema } from "@/lib/validators/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      const { getMockProjects } = await import("@/lib/mock-data");
      return NextResponse.json(getMockProjects());
    }

    const { searchParams } = new URL(request.url);
    const status = normalizeProjectStatus(searchParams.get("status"));
    const direction = searchParams.get("direction");

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status }),
        ...(direction && { direction }),
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
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      projects.map((project) => ({
        ...project,
        progress: calculateProjectProgress(project),
        health: calculateProjectHealth(project),
      }))
    );
  } catch (error) {
    // Fallback to mock data on any error
    const { getMockProjects } = await import("@/lib/mock-data");
    return NextResponse.json(getMockProjects());
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  calculateProjectHealth,
  calculateProjectProgress,
  isPrismaNotFoundError,
  normalizeProjectStatus,
  notFound,
  serverError,
  validationError,
} from "@/lib/server/api-utils";
import { updateProjectSchema } from "@/lib/validators/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json({});
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
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

    if (!project) {
      return notFound("Project not found");
    }

    return NextResponse.json({
      ...project,
      progress: calculateProjectProgress(project),
      health: calculateProjectHealth(project),
    });
  } catch (error) {
    return serverError(error, "Failed to load project.");
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

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
      teamIds,
    } = parsed.data;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(normalizeProjectStatus(status) && {
          status: normalizeProjectStatus(status),
        }),
        ...(direction !== undefined && { direction }),
        ...(priority !== undefined && { priority }),
        ...(health !== undefined && { health }),
        ...(progress !== undefined && {
          progress,
        }),
        ...(budgetPlan !== undefined && {
          budgetPlan,
        }),
        ...(budgetFact !== undefined && {
          budgetFact,
        }),
        ...(start !== undefined && { start: new Date(start) }),
        ...(end !== undefined && { end: new Date(end) }),
        ...(location !== undefined && { location }),
        ...(teamIds && {
          team: {
            set: teamIds.map((teamId) => ({ id: teamId })),
          },
        }),
        updatedAt: new Date(),
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

    return NextResponse.json({
      ...project,
      progress: calculateProjectProgress(project),
      health: calculateProjectHealth(project),
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Project not found");
    }

    return serverError(error, "Failed to update project.");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ deleted: true });
    }

    const { id } = await params;
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Project not found");
    }

    return serverError(error, "Failed to delete project.");
  }
}

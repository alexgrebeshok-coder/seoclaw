import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isPrismaNotFoundError, notFound, serverError } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json({});
    }

    const { id } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
        },
        projects: {
          orderBy: { updatedAt: "desc" },
        },
        risks: {
          orderBy: { severity: "desc" },
        },
        documents: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!member) {
      return notFound("Team member not found");
    }

    return NextResponse.json({
      ...member,
      activeTasks: member.tasks.filter((task) => !["done", "cancelled"].includes(task.status))
        .length,
      capacityUsed: Math.min(
        100,
        member.tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length * 20
      ),
    });
  } catch (error) {
    return serverError(error, "Failed to load team member.");
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(typeof body.name === "string" && { name: body.name }),
        ...(typeof body.role === "string" && { role: body.role }),
        ...(body.initials !== undefined && {
          initials: typeof body.initials === "string" ? body.initials : null,
        }),
        ...(body.email !== undefined && {
          email: typeof body.email === "string" ? body.email : null,
        }),
        ...(body.avatar !== undefined && {
          avatar: typeof body.avatar === "string" ? body.avatar : null,
        }),
        ...(typeof body.capacity === "number" && Number.isFinite(body.capacity) && {
          capacity: Math.round(body.capacity),
        }),
        updatedAt: new Date(),
      },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
        },
        projects: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      ...member,
      activeTasks: member.tasks.filter((task) => !["done", "cancelled"].includes(task.status))
        .length,
      capacityUsed: Math.min(
        100,
        member.tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length * 20
      ),
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Team member not found");
    }

    return serverError(error, "Failed to update team member.");
  }
}

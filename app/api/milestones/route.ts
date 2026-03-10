import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  badRequest,
  normalizeMilestoneStatus,
  parseDateInput,
  serverError,
} from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const milestones = await prisma.milestone.findMany({
      where: {
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    return serverError(error, "Failed to load milestones.");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const projectId =
      typeof body.projectId === "string" ? body.projectId.trim() : "";
    const date = parseDateInput(body.date);

    if (!title || !projectId || !date) {
      return badRequest("Missing required fields: title, projectId, date");
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description:
          typeof body.description === "string" ? body.description : undefined,
        projectId,
        date,
        status: normalizeMilestoneStatus(body.status) ?? "upcoming",
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create milestone.");
  }
}

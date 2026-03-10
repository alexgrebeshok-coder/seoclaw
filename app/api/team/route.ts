import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, serverError } from "@/lib/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      const { getMockTeam } = await import("@/lib/mock-data");
      return NextResponse.json(getMockTeam());
    }

    const team = await prisma.teamMember.findMany({
      include: {
        tasks: {
          where: {
            status: {
              notIn: ["done", "cancelled"],
            },
          },
          orderBy: { dueDate: "asc" },
        },
        projects: {
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const teamWithCapacity = team.map((member) => ({
      ...member,
      activeTasks: member.tasks.length,
      capacityUsed: Math.min(100, member.tasks.length * 20),
    }));

    return NextResponse.json(teamWithCapacity);
  } catch (error) {
    // Fallback to mock data on any error
    const { getMockTeam } = await import("@/lib/mock-data");
    return NextResponse.json(getMockTeam());
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";

    if (!name || !role) {
      return badRequest("Missing required fields: name, role");
    }

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        initials: typeof body.initials === "string" ? body.initials : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        avatar: typeof body.avatar === "string" ? body.avatar : undefined,
        capacity:
          typeof body.capacity === "number" && Number.isFinite(body.capacity)
            ? Math.round(body.capacity)
            : 100,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create team member.");
  }
}

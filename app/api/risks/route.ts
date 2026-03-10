import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serverError, validationError } from "@/lib/server/api-utils";
import { createRiskSchema } from "@/lib/validators/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const severityMap: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

function resolveSeverity(probability?: string, impact?: string): number {
  const probabilityScore = severityMap[probability ?? "medium"] ?? severityMap.medium;
  const impactScore = severityMap[impact ?? "medium"] ?? severityMap.medium;
  return Math.round((probabilityScore + impactScore) / 2);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock data if no database
      const { getMockRisks } = await import("@/lib/mock-data");
      return NextResponse.json(getMockRisks());
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const risks = await prisma.risk.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, name: true, initials: true },
        },
      },
      orderBy: { severity: "desc" },
    });

    return NextResponse.json(risks);
  } catch (error) {
    // Fallback to mock data on any error
    const { getMockRisks } = await import("@/lib/mock-data");
    return NextResponse.json(getMockRisks());
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = createRiskSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const {
      description,
      impact = "medium",
      ownerId,
      probability = "medium",
      projectId,
      status = "open",
      title,
    } = parsed.data;

    const risk = await prisma.risk.create({
      data: {
        title,
        description,
        projectId,
        ownerId: ownerId ?? undefined,
        probability,
        impact,
        severity: resolveSeverity(probability, impact),
        status,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create risk.");
  }
}

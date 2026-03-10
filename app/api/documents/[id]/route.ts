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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    if (!document) {
      return notFound("Document not found");
    }

    return NextResponse.json(document);
  } catch (error) {
    return serverError(error, "Failed to load document.");
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

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" && { title: body.title }),
        ...(body.description !== undefined && {
          description: typeof body.description === "string" ? body.description : null,
        }),
        ...(typeof body.filename === "string" && { filename: body.filename }),
        ...(typeof body.url === "string" && { url: body.url }),
        ...(typeof body.type === "string" && { type: body.type }),
        ...(body.size !== undefined &&
          typeof body.size === "number" &&
          Number.isFinite(body.size) && { size: Math.round(body.size) }),
        ...(body.ownerId !== undefined && {
          ownerId: typeof body.ownerId === "string" ? body.ownerId : null,
        }),
        updatedAt: new Date(),
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

    return NextResponse.json(document);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Document not found");
    }

    return serverError(error, "Failed to update document.");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ deleted: true });
    }

    const { id } = await params;
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Document not found");
    }

    return serverError(error, "Failed to delete document.");
  }
}

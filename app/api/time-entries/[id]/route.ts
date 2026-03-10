import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/time-entries/[id] — Stop timer (set endTime)
 * DELETE /api/time-entries/[id] — Delete time entry
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const { id } = await params;
    const body = await request.json();
    const { endTime, description } = body;

    const entry = await prisma.timeEntry.findUnique({
      where: { id },
      select: { id: true, startTime: true, endTime: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    if (entry.endTime) {
      return NextResponse.json(
        { error: "Timer already stopped" },
        { status: 400 }
      );
    }

    const now = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor(
      (now.getTime() - entry.startTime.getTime()) / 1000
    );

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: now,
        duration,
        description,
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
        member: {
          select: { id: true, name: true, initials: true },
        },
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("[Time Entry Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true });
    }

    const { id } = await params;

    await prisma.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Time Entry Delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}

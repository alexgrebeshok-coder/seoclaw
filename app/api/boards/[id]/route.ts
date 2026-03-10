import { NextRequest, NextResponse } from "next/server";
import { findMockBoardById } from "@/lib/mock-boards";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/boards/[id] — Get board with columns and tasks
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      const { id } = await params;
      const board = findMockBoardById(id);

      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }

      return NextResponse.json(board);
    }

    const { id } = await params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                assignee: {
                  select: { id: true, name: true, initials: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("[Board API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

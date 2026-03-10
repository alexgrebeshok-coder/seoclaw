import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/tasks/[id]/dependencies/[dependencyId] — Remove dependency
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dependencyId: string }> }
) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return success mock response
      return NextResponse.json({ success: true });
    }

    const { id, dependencyId } = await params;

    await prisma.taskDependency.delete({
      where: {
        id: dependencyId,
        taskId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dependency DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete dependency" },
      { status: 500 }
    );
  }
}

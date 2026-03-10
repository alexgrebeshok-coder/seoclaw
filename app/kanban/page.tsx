import { KanbanBoard } from "@/components/kanban/kanban-board";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering (requires DATABASE_URL at runtime, not build time)
export const dynamic = 'force-dynamic';

/**
 * Kanban page — /kanban
 *
 * Shows the first available board or prompts to create one
 */
export default async function KanbanPage() {
  // Get first board (or create default)
  let board = await prisma.board.findFirst({
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  // If no boards exist, create a default one with first project
  if (!board) {
    const project = await prisma.project.findFirst();
    if (project) {
      board = await prisma.board.create({
        data: {
          name: "Основная доска",
          projectId: project.id,
          columns: {
            create: [
              { title: "To Do", order: 0, color: "#6b7280" },
              { title: "In Progress", order: 1, color: "#3b82f6" },
              { title: "Review", order: 2, color: "#f59e0b" },
              { title: "Done", order: 3, color: "#10b981" },
            ],
          },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });
    }
  }

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold">Нет проектов</h1>
          <p className="text-[var(--ink-muted)]">
            Создайте проект, чтобы использовать Kanban доску
          </p>
        </div>
      </div>
    );
  }

  return <KanbanBoard boardId={board.id} />;
}

import { initialDashboardState } from "@/lib/mock-data";
import type { Board, Column, Task } from "@/lib/types";

const BOARD_COLUMNS = [
  { key: "todo", title: "To Do", color: "#6b7280" },
  { key: "in-progress", title: "In Progress", color: "#3b82f6" },
  { key: "review", title: "Review", color: "#f59e0b" },
  { key: "done", title: "Done", color: "#10b981" },
] as const;

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.dueDate.localeCompare(right.dueDate);
  });
}

function mapTaskToColumnKey(task: Task): (typeof BOARD_COLUMNS)[number]["key"] {
  if (task.status === "done") {
    return "done";
  }

  if (task.status === "in-progress" || task.status === "blocked") {
    return "in-progress";
  }

  return "todo";
}

export function buildMockBoards(): Board[] {
  return initialDashboardState.projects.map((project) => {
    const projectTasks = initialDashboardState.tasks.filter(
      (task) => task.projectId === project.id
    );

    const columns: Column[] = BOARD_COLUMNS.map((definition, index) => ({
      id: `${project.id}-${definition.key}`,
      title: definition.title,
      order: index,
      color: definition.color,
      boardId: `board-${project.id}`,
      tasks: sortTasks(
        projectTasks.filter((task) => mapTaskToColumnKey(task) === definition.key)
      ),
      createdAt: project.dates.start,
      updatedAt: project.dates.end,
    }));

    return {
      id: `board-${project.id}`,
      name: `${project.name} — Board`,
      projectId: project.id,
      project: {
        id: project.id,
        name: project.name,
      },
      columns,
      createdAt: project.dates.start,
      updatedAt: project.dates.end,
    };
  });
}

export function findMockBoardById(boardId: string): Board | null {
  return buildMockBoards().find((board) => board.id === boardId) ?? null;
}

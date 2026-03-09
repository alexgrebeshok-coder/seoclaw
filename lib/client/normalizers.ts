import { format } from "date-fns";

import type {
  DashboardState,
  Milestone,
  Project,
  ProjectStatus,
  ProjectDocument,
  Risk,
  RiskStatus,
  Task,
  TaskStatus,
  TeamMember,
} from "@/lib/types";

export type ApiTeamMember = {
  id: string;
  name: string;
  initials?: string | null;
  role: string;
  email?: string | null;
  avatar?: string | null;
  capacity: number;
  activeTasks?: number;
  capacityUsed?: number;
  projects?: Array<{ id: string; name: string }>;
};

export type ApiTask = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  order: number;
  dueDate: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assigneeId?: string | null;
  assignee?: ApiTeamMember | null;
};

export type ApiRisk = {
  id: string;
  title: string;
  description?: string | null;
  probability: string;
  impact: string;
  severity: number;
  status: string;
  projectId: string;
  ownerId?: string | null;
  owner?: ApiTeamMember | null;
};

export type ApiMilestone = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  status: string;
  projectId: string;
};

export type ApiDocument = {
  id: string;
  title: string;
  description?: string | null;
  filename: string;
  url: string;
  type: string;
  size?: number | null;
  projectId: string;
  ownerId?: string | null;
  updatedAt: string;
  owner?: ApiTeamMember | null;
};

export type ApiProject = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  direction: string;
  priority: string;
  health: string;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
  budgetPlan?: number | null;
  budgetFact?: number | null;
  progress: number;
  location?: string | null;
  tasks?: ApiTask[];
  team?: ApiTeamMember[];
  risks?: ApiRisk[];
  milestones?: ApiMilestone[];
  documents?: ApiDocument[];
};

const TASK_STATUS_DB_TO_UI: Record<string, TaskStatus> = {
  todo: "todo",
  in_progress: "in-progress",
  blocked: "blocked",
  done: "done",
};

const TASK_STATUS_UI_TO_DB: Record<TaskStatus, string> = {
  todo: "todo",
  "in-progress": "in_progress",
  blocked: "blocked",
  done: "done",
};

const PROJECT_STATUS_DB_TO_UI: Record<string, ProjectStatus> = {
  active: "active",
  planning: "planning",
  on_hold: "on-hold",
  completed: "completed",
  at_risk: "at-risk",
};

const PROJECT_STATUS_UI_TO_DB: Record<ProjectStatus, string> = {
  active: "active",
  planning: "planning",
  "on-hold": "on_hold",
  completed: "completed",
  "at-risk": "at_risk",
};

const RISK_STATUS_MAP: Record<string, RiskStatus> = {
  open: "open",
  mitigated: "mitigated",
  closed: "closed",
};

const RISK_SCALE: Record<string, number> = {
  low: 2,
  medium: 3,
  high: 5,
};

const HEALTH_TO_SCORE: Record<string, number> = {
  good: 86,
  warning: 63,
  critical: 42,
};

const MILESTONE_STATUS_TO_PROJECT_STATUS: Record<string, ProjectStatus> = {
  upcoming: "planning",
  in_progress: "active",
  completed: "completed",
  overdue: "at-risk",
};

function asDateOnly(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return format(new Date(), "yyyy-MM-dd");
  }

  return format(date, "yyyy-MM-dd");
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return "Unknown";
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildSyntheticHistory(
  start: string,
  progress: number,
  budgetPlan: number,
  budgetActual: number
): Project["history"] {
  return [
    {
      date: asDateOnly(start),
      progress: Math.max(progress - 14, 0),
      budgetPlanned: Math.round(budgetPlan * 0.14),
      budgetActual: Math.round(budgetActual * 0.08),
    },
    {
      date: asDateOnly(new Date()),
      progress,
      budgetPlanned: Math.round(budgetPlan * 0.38),
      budgetActual,
    },
  ];
}

function buildDefaultObjectives(project: ApiProject) {
  return [
    `Удержать delivery rhythm по направлению ${project.direction}.`,
    `Подтвердить ближайшие шаги по локации ${project.location ?? "проекта"}.`,
    "Подготовить управленческие решения по срокам, бюджету и рискам.",
  ];
}

function deriveMaterials(progress: number, riskCount: number) {
  return clamp(Math.round(38 + progress * 0.45 - riskCount * 4), 18, 96);
}

function deriveLaborProductivity(progress: number, teamSize: number) {
  return clamp(Math.round(44 + progress * 0.38 + teamSize * 2), 24, 98);
}

function deriveSafety(projectStatus: ProjectStatus, riskCount: number) {
  const riskModifier = projectStatus === "at-risk" ? 0.22 : projectStatus === "planning" ? 0.08 : 0.04;
  return {
    ltifr: Number((0.12 + riskModifier + riskCount * 0.03).toFixed(2)),
    trir: Number((0.36 + riskModifier * 2 + riskCount * 0.05).toFixed(2)),
  };
}

export function normalizeTaskStatus(status: string): TaskStatus {
  return TASK_STATUS_DB_TO_UI[status] ?? "todo";
}

export function denormalizeTaskStatus(status: TaskStatus): string {
  return TASK_STATUS_UI_TO_DB[status] ?? "todo";
}

export function normalizeProjectStatus(status: string): ProjectStatus {
  return PROJECT_STATUS_DB_TO_UI[status] ?? "planning";
}

export function denormalizeProjectStatus(status: ProjectStatus): string {
  return PROJECT_STATUS_UI_TO_DB[status] ?? "planning";
}

export function normalizeTask(task: ApiTask): Task {
  const status = normalizeTaskStatus(task.status);
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description ?? "",
    status,
    order: task.order ?? 0,
    assignee: task.assignee?.name ?? "Unassigned",
    dueDate: asDateOnly(task.dueDate),
    priority: (task.priority as Task["priority"]) ?? "medium",
    tags: [],
    createdAt: asDateOnly(task.createdAt),
    blockedReason: status === "blocked" ? "Blocked in API workflow." : undefined,
  };
}

export function normalizeTeamMember(member: ApiTeamMember): TeamMember {
  const allocated =
    member.capacityUsed ??
    Math.min(100, (member.activeTasks ?? 0) * 20);

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email ?? "",
    capacity: member.capacity ?? 100,
    allocated,
    projects: member.projects?.map((project) => project.name) ?? [],
    location: "Remote",
  };
}

export function normalizeRisk(risk: ApiRisk): Risk {
  return {
    id: risk.id,
    projectId: risk.projectId,
    title: risk.title,
    owner: risk.owner?.name ?? "Not assigned",
    probability: RISK_SCALE[risk.probability] ?? 3,
    impact: RISK_SCALE[risk.impact] ?? 3,
    status: RISK_STATUS_MAP[risk.status] ?? "open",
    mitigation:
      risk.description?.trim() || "Mitigation plan is being prepared in the API workflow.",
    category: "general",
  };
}

export function normalizeMilestone(milestone: ApiMilestone): Milestone {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    name: milestone.title,
    start: asDateOnly(milestone.date),
    end: asDateOnly(milestone.date),
    status: MILESTONE_STATUS_TO_PROJECT_STATUS[milestone.status] ?? "planning",
    progress:
      milestone.status === "completed"
        ? 100
        : milestone.status === "in_progress"
          ? 52
          : milestone.status === "overdue"
            ? 34
            : 12,
  };
}

export function normalizeDocument(document: ApiDocument): ProjectDocument {
  return {
    id: document.id,
    projectId: document.projectId,
    title: document.title,
    type: document.type.toUpperCase(),
    owner: document.owner?.name ?? "Unknown",
    updatedAt: asDateOnly(document.updatedAt),
    size: formatFileSize(document.size),
  };
}

export function normalizeProject(project: ApiProject): Project {
  const milestones = (project.milestones ?? []).map(normalizeMilestone);
  const nextMilestone = milestones
    .slice()
    .sort((left, right) => left.end.localeCompare(right.end))[0];
  const projectStatus = normalizeProjectStatus(project.status);
  const teamNames = project.team?.map((member) => member.name) ?? [];
  const riskCount = project.risks?.length ?? 0;
  const progress = typeof project.progress === "number" ? project.progress : 0;

  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    status: projectStatus,
    progress,
    direction: (project.direction as Project["direction"]) ?? "construction",
    budget: {
      planned: project.budgetPlan ?? 0,
      actual: project.budgetFact ?? 0,
      currency: "RUB",
    },
    dates: {
      start: asDateOnly(project.start),
      end: asDateOnly(project.end),
    },
    nextMilestone: nextMilestone
      ? { name: nextMilestone.name, date: nextMilestone.end }
      : null,
    team: teamNames,
    risks: riskCount,
    location: project.location ?? "TBD",
    priority: (project.priority as Project["priority"]) ?? "medium",
    health: HEALTH_TO_SCORE[project.health] ?? 68,
    objectives: buildDefaultObjectives(project),
    materials: deriveMaterials(progress, riskCount),
    laborProductivity: deriveLaborProductivity(progress, teamNames.length),
    safety: deriveSafety(projectStatus, riskCount),
    history: buildSyntheticHistory(
      project.start,
      progress,
      project.budgetPlan ?? 0,
      project.budgetFact ?? 0
    ),
  };
}

export function buildDashboardStateFromApi(input: {
  projects: ApiProject[];
  tasks: ApiTask[];
  team: ApiTeamMember[];
  risks: ApiRisk[];
}): DashboardState {
  const projects = input.projects.map(normalizeProject);
  const tasks = input.tasks.map(normalizeTask);
  const team = input.team.map(normalizeTeamMember);
  const risks = input.risks.map(normalizeRisk);
  const documents = input.projects.flatMap((project) =>
    (project.documents ?? []).map(normalizeDocument)
  );
  const milestones = input.projects.flatMap((project) =>
    (project.milestones ?? []).map(normalizeMilestone)
  );

  // Default current user (will be overridden by mock data)
  const currentUser = {
    id: "user1",
    name: "Саша",
    role: "PM" as const,
    email: "sasha@example.com",
  };

  return {
    currentUser,
    projects,
    tasks,
    team,
    risks,
    documents,
    milestones,
    auditLogEntries: [],
  };
}

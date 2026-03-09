export type ProjectStatus =
  | "active"
  | "planning"
  | "on-hold"
  | "completed"
  | "at-risk";

/**
 * Роли пользователей в системе
 * - EXEC: Гендиректор (полный доступ ко всем проектам)
 * - CURATOR: Куратор проекта (просмотр + ограниченные права редактирования)
 * - PM: Руководитель проекта (полный доступ к своим проектам)
 * - MEMBER: Исполнитель (только свои задачи и проекты)
 * - SOLO: Одиночка (персональное рабочее пространство)
 */
export type UserRole = "EXEC" | "CURATOR" | "PM" | "MEMBER" | "SOLO";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type ProjectDirection =
  | "metallurgy"
  | "logistics"
  | "trade"
  | "construction";

export type Priority = "low" | "medium" | "high" | "critical";

export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

export type RiskStatus = "open" | "mitigated" | "closed";

export type Severity = "info" | "warning" | "critical";

export interface Budget {
  planned: number;
  actual: number;
  currency: string;
}

export interface MilestoneRef {
  name: string;
  date: string;
}

export interface ProgressPoint {
  date: string;
  progress: number;
  budgetPlanned: number;
  budgetActual: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  direction: ProjectDirection;
  budget: Budget;
  dates: { start: string; end: string };
  nextMilestone: MilestoneRef | null;
  team: string[];
  risks: number;
  location: string;
  priority: Priority;
  health: number;
  objectives: string[];
  materials: number;
  laborProductivity: number;
  safety: { ltifr: number; trir: number };
  history: ProgressPoint[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  order: number;
  assignee: string;
  dueDate: string;
  priority: Priority;
  tags: string[];
  createdAt: string;
  blockedReason?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  capacity: number;
  allocated: number;
  projects: string[];
  location: string;
}

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  owner: string;
  probability: number;
  impact: number;
  status: RiskStatus;
  mitigation: string;
  category: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  type: string;
  owner: string;
  updatedAt: string;
  size: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  start: string;
  end: string;
  status: ProjectStatus;
  progress: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  createdAt: string;
  projectId?: string;
}

export interface AuditLogEntry {
  id: string;
  projectId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface DashboardState {
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  risks: Risk[];
  documents: ProjectDocument[];
  milestones: Milestone[];
  auditLogEntries: AuditLogEntry[];
}

export interface ProjectFormValues {
  name: string;
  description: string;
  direction: ProjectDirection;
  plannedBudget: number;
  actualBudget: number;
  currency: string;
  start: string;
  end: string;
  team: string[];
  location: string;
  priority: Priority;
  status: ProjectStatus;
  progress: number;
}

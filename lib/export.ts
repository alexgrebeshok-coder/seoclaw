"use client";

import { jsPDF } from "jspdf";

import { Project, Risk, Task } from "@/lib/types";
import { formatCurrency, formatDate, projectStatusMeta } from "@/lib/utils";

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function transliterate(value: string) {
  const dictionary: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return value
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = dictionary[lower];
      if (!mapped) return char;
      return lower === char ? mapped : mapped[0].toUpperCase() + mapped.slice(1);
    })
    .join("");
}

export function downloadProjectsCsv(projects: Project[]) {
  const header = [
    "ID",
    "Проект",
    "Статус",
    "Направление",
    "Прогресс",
    "Бюджет план",
    "Бюджет факт",
    "Локация",
    "Следующий milestone",
  ];
  const rows = projects.map((project) => [
    project.id,
    project.name,
    projectStatusMeta[project.status].label,
    project.direction,
    `${project.progress}%`,
    String(project.budget.planned),
    String(project.budget.actual),
    project.location,
    project.nextMilestone?.name ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => {
      const cellStr = cell ?? "";
      return `"${cellStr.replace(/"/g, '""')}"`;
    }).join(","))
    .join("\n");

  downloadBlob(
    "pm-dashboard-projects.csv",
    `\uFEFF${csv}`,
    "text/csv;charset=utf-8;"
  );
}

export function downloadTasksCsv(tasks: Task[]) {
  const header = [
    "ID",
    "Проект",
    "Задача",
    "Статус",
    "Исполнитель",
    "Срок",
    "Приоритет",
  ];
  const rows = tasks.map((task) => [
    task.id,
    task.projectId,
    task.title,
    task.status,
    task.assignee,
    task.dueDate,
    task.priority,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => {
      const cellStr = cell == null ? "" : typeof cell === "object" ? JSON.stringify(cell) : String(cell);
      return `"${cellStr.replace(/"/g, '""')}"`;
    }).join(","))
    .join("\n");

  downloadBlob("pm-dashboard-tasks.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8;");
}

export function downloadProjectPdf(project: Project, tasks: Task[], risks: Risk[]) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const lines = [
    "PM Dashboard Report",
    `Project: ${transliterate(project.name)}`,
    `Status: ${projectStatusMeta[project.status].label}`,
    `Progress: ${project.progress}%`,
    `Budget planned: ${formatCurrency(project.budget.planned, project.budget.currency)}`,
    `Budget actual: ${formatCurrency(project.budget.actual, project.budget.currency)}`,
    `Dates: ${formatDate(project.dates.start, "dd.MM.yyyy")} - ${formatDate(project.dates.end, "dd.MM.yyyy")}`,
    `Next milestone: ${project.nextMilestone ? transliterate(project.nextMilestone.name) : "n/a"}`,
    "",
    `Objectives: ${transliterate(project.objectives.join("; "))}`,
    "",
    "Open tasks:",
    ...tasks.slice(0, 5).map((task) => `- ${transliterate(task.title)} (${task.assignee}, ${task.status})`),
    "",
    "Top risks:",
    ...risks.slice(0, 5).map((risk) => `- ${transliterate(risk.title)} (${risk.probability}x${risk.impact})`),
  ];

  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, 595, 92, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text("PM Dashboard", 40, 56);
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(11);
  const wrapped = pdf.splitTextToSize(lines.join("\n"), 510);
  pdf.text(wrapped, 40, 128);
  pdf.save(`pm-dashboard-${project.id}.pdf`);
}

export function downloadDashboardPdf(
  projects: Project[],
  tasks: Task[],
  risks: Risk[],
  team: Array<{ id: string; name: string }>
) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  let y = 40;

  // Title
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, pageWidth, 92, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text("CEOClaw Dashboard Summary", 40, 56);
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(10);
  y = 128;

  // Date
  pdf.text(`Generated: ${formatDate(new Date().toISOString(), "dd MMM yyyy HH:mm")}`, pageWidth / 2, y, { align: "center" });
  y += 30;

  // Projects Section
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Projects Overview", 40, y);
  y += 20;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const activeProjects = projects.filter(p => p.status !== "completed");
  const completedProjects = projects.filter(p => p.status === "completed");
  
  pdf.text(`Total Projects: ${projects.length}`, 40, y);
  y += 15;
  pdf.text(`Active: ${activeProjects.length} | Completed: ${completedProjects.length}`, 40, y);
  y += 20;

  // Top 5 Projects
  activeProjects.slice(0, 5).forEach((project, index) => {
    if (y > 750) {
      pdf.addPage();
      y = 40;
    }
    const text = `${index + 1}. ${transliterate(project.name)} - ${project.progress}% (${projectStatusMeta[project.status].label})`;
    pdf.text(text, 50, y);
    y += 15;
  });
  y += 20;

  // Tasks Section
  if (y > 700) {
    pdf.addPage();
    y = 40;
  }
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Tasks Summary", 40, y);
  y += 20;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const doneTasks = tasks.filter(t => t.status === "done");
  const blockedTasks = tasks.filter(t => t.status === "blocked");

  pdf.text(`Total Tasks: ${tasks.length}`, 40, y);
  y += 15;
  pdf.text(`To Do: ${todoTasks.length} | In Progress: ${inProgressTasks.length} | Done: ${doneTasks.length} | Blocked: ${blockedTasks.length}`, 40, y);
  y += 20;

  // Risks Section
  if (y > 700) {
    pdf.addPage();
    y = 40;
  }
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Risks Overview", 40, y);
  y += 20;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const openRisks = risks.filter(r => r.status === "open");
  const criticalRisks = risks.filter(r => r.probability >= 5 || r.impact >= 5);

  pdf.text(`Total Risks: ${risks.length}`, 40, y);
  y += 15;
  pdf.text(`Open: ${openRisks.length} | Critical: ${criticalRisks.length}`, 40, y);
  y += 20;

  // Team Section
  if (y > 700) {
    pdf.addPage();
    y = 40;
  }
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Team", 40, y);
  y += 20;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Team Members: ${team.length}`, 40, y);

  // Footer
  pdf.setFontSize(8);
  pdf.text("Generated by CEOClaw - AI-powered Project Management Dashboard", pageWidth / 2, 820, { align: "center" });

  // Save
  const filename = `ceoclaw-dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(filename);
}

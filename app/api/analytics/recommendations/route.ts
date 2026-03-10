import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/recommendations — AI recommendations
 * 
 * Recommendations:
 * - Add resources to finish on time
 * - Reassign tasks from overloaded members
 * - Priority adjustments
 * - Risk mitigation suggestions
 */

export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Return mock recommendations if no database
      return NextResponse.json({
        recommendations: [
          {
            type: "resource",
            priority: "high",
            projectId: "p1",
            projectName: "Модернизация производственной линии",
            message: "Добавить ресурсы для соблюдения сроков",
            action: "Назначить дополнительных исполнителей на критические задачи",
          },
          {
            type: "risk",
            priority: "medium",
            projectId: "p2",
            projectName: "Логистический хаб",
            message: "Усилить контроль рисков",
            action: "Провести митигацию выявленных рисков",
          },
        ],
      });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Get predictions data
    const predictionsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/analytics/predictions${projectId ? `?projectId=${projectId}` : ""}`
    );
    const predictionsData = await predictionsRes.json();

    // Get team performance data
    const teamRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/analytics/team-performance${projectId ? `?projectId=${projectId}` : ""}`
    );
    const teamData = await teamRes.json();

    const recommendations: any[] = [];

    // Generate recommendations based on predictions
    for (const prediction of predictionsData.predictions || []) {
      // High budget overrun risk
      if (prediction.risks.budgetOverrun >= 50) {
        recommendations.push({
          type: "budget",
          priority: "high",
          projectId: prediction.projectId,
          projectName: prediction.projectName,
          title: "Budget overrun risk detected",
          description: `Project "${prediction.projectName}" has ${prediction.risks.budgetOverrun}% budget overrun risk. Consider reducing scope or adding resources.`,
          action: "Review project scope and timeline",
        });
      }

      // Resource bottleneck
      if (prediction.risks.resourceBottleneck >= 40) {
        recommendations.push({
          type: "resource",
          priority: "high",
          projectId: prediction.projectId,
          projectName: prediction.projectName,
          title: "Resource bottleneck detected",
          description: `Team members are overloaded in project "${prediction.projectName}". Consider redistributing tasks.`,
          action: "Reassign tasks or add team members",
        });
      }

      // Overdue prediction
      if (prediction.predictions.isOverdue) {
        const weeksOver = Math.ceil(
          (new Date(prediction.predictions.finishDate).getTime() - Date.now()) /
            (7 * 24 * 60 * 60 * 1000)
        );
        recommendations.push({
          type: "timeline",
          priority: "critical",
          projectId: prediction.projectId,
          projectName: prediction.projectName,
          title: "Project will miss deadline",
          description: `Project "${prediction.projectName}" is predicted to finish ${weeksOver} weeks late.`,
          action: "Add resources or reduce scope immediately",
        });
      }

      // Low velocity warning
      if (prediction.predictions.velocity < 1 && prediction.metrics.remainingTasks > 0) {
        recommendations.push({
          type: "velocity",
          priority: "medium",
          projectId: prediction.projectId,
          projectName: prediction.projectName,
          title: "Low task completion velocity",
          description: `Project "${prediction.projectName}" has low velocity (${prediction.predictions.velocity} tasks/week).`,
          action: "Identify blockers and improve team efficiency",
        });
      }
    }

    // Team-based recommendations
    for (const member of teamData.members || []) {
      // Overloaded team member
      if (member.metrics.totalTasks > 5 && member.metrics.completionRate < 50) {
        recommendations.push({
          type: "workload",
          priority: "medium",
          memberId: member.memberId,
          memberName: member.memberName,
          title: "Team member overloaded",
          description: `${member.memberName} has ${member.metrics.totalTasks} tasks but only ${member.metrics.completionRate}% completion rate.`,
          action: "Reassign some tasks to other team members",
        });
      }

      // Low performance
      if (member.performanceScore < 40 && member.metrics.totalTasks > 0) {
        recommendations.push({
          type: "performance",
          priority: "low",
          memberId: member.memberId,
          memberName: member.memberName,
          title: "Performance improvement needed",
          description: `${member.memberName}'s performance score is ${member.performanceScore}/100.`,
          action: "Provide training or reduce workload",
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    );

    return NextResponse.json({
      recommendations,
      summary: {
        total: recommendations.length,
        critical: recommendations.filter((r) => r.priority === "critical").length,
        high: recommendations.filter((r) => r.priority === "high").length,
        medium: recommendations.filter((r) => r.priority === "medium").length,
        low: recommendations.filter((r) => r.priority === "low").length,
      },
    });
  } catch (error) {
    console.error("[Recommendations API] Error:", error);
    // Fallback to mock data on any error
    return NextResponse.json({
      recommendations: [
        {
          type: "resource",
          priority: "high",
          projectId: "p1",
          projectName: "Модернизация производственной линии",
          message: "Добавить ресурсы для соблюдения сроков",
          action: "Назначить дополнительных исполнителей на критические задачи",
        },
      ],
    });
  }
}

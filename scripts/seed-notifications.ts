/**
 * Seed notifications for testing
 * 
 * Run with: npx tsx scripts/seed-notifications.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding notifications...");

  const userId = "default";

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId,
        type: "task_assigned",
        title: "Новая задача",
        message: "Вам назначена задача 'Подготовить КП для ЧЭМК'",
        entityType: "task",
        entityId: "task_1",
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "due_date",
        title: "Срок задачи",
        message: "Задача 'Согласовать СП' должна быть выполнена завтра",
        entityType: "task",
        entityId: "task_2",
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "status_changed",
        title: "Статус изменён",
        message: "Проект 'Бентонитовые глины' перешёл в статус 'В работе'",
        entityType: "project",
        entityId: "project_1",
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "mention",
        title: "Упоминание",
        message: "Иван Аксарин упомянул вас в комментарии к задаче",
        entityType: "task",
        entityId: "task_3",
      },
    }),
  ]);

  console.log(`✅ Created ${notifications.length} notifications`);
  console.log("\nNotifications:");
  notifications.forEach((n) => {
    console.log(`  - [${n.type}] ${n.title}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

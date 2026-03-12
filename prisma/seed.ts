// Seed Database with Mock Data
// Run: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.pilotReviewDeliveryPolicy.deleteMany();
  await prisma.telegramBriefDeliveryPolicy.deleteMany();
  await prisma.document.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.project.deleteMany();

  console.log('✅ Cleared existing data');

  // ============================================
  // TEAM MEMBERS
  // ============================================

  const sasha = await prisma.teamMember.create({
    data: {
      name: 'Саша',
      initials: 'С',
      role: 'Руководитель проектов',
      email: 'alex@example.com',
      capacity: 85,
    },
  });

  const ivan = await prisma.teamMember.create({
    data: {
      name: 'Иван Аксарин',
      initials: 'ИА',
      role: 'Партнёр',
      email: 'ivan@example.com',
      capacity: 30,
    },
  });

  const mikhail = await prisma.teamMember.create({
    data: {
      name: 'Михаил Петров',
      initials: 'МП',
      role: 'Операционный директор',
      email: 'mikhail@example.com',
      capacity: 62,
    },
  });

  const ekaterina = await prisma.teamMember.create({
    data: {
      name: 'Екатерина Белая',
      initials: 'ЕБ',
      role: 'Закупки и логистика',
      email: 'ekaterina@example.com',
      capacity: 76,
    },
  });

  const pavel = await prisma.teamMember.create({
    data: {
      name: 'Павел Орлов',
      initials: 'ПО',
      role: 'Логистика',
      email: 'pavel@example.com',
      capacity: 70,
    },
  });

  const irina = await prisma.teamMember.create({
    data: {
      name: 'Ирина Лапина',
      initials: 'ИЛ',
      role: 'Финансы',
      email: 'irina@example.com',
      capacity: 50,
    },
  });

  console.log('✅ Created 6 team members');

  // ============================================
  // PROJECTS
  // ============================================

  const chemkProject = await prisma.project.create({
    data: {
      name: 'ЧЭМК — переработка дунита',
      description:
        'Запуск цепочки переработки дунита в огнеупорные материалы с площадкой в Харпе и контуром коммерциализации через индустриальных партнёров.',
      status: 'active',
      direction: 'metallurgy',
      priority: 'high',
      health: 'warning',
      start: new Date('2026-01-01'),
      end: new Date('2026-12-31'),
      budgetPlan: 5000000,
      budgetFact: 1800000,
      progress: 35,
      location: 'Харп, ЯНАО',
      team: {
        connect: [{ id: sasha.id }, { id: ivan.id }, { id: mikhail.id }],
      },
    },
  });

  const bentoniteProject = await prisma.project.create({
    data: {
      name: 'Бентонитовые глины (KZ → RF)',
      description:
        'Поиск карьеров, оценка качества сырья и настройка импортного маршрута из Казахстана на Челябинский металлургический кластер.',
      status: 'planning',
      direction: 'logistics',
      priority: 'critical',
      health: 'warning',
      start: new Date('2026-02-01'),
      end: new Date('2026-08-31'),
      budgetPlan: 3000000,
      budgetFact: 450000,
      progress: 15,
      location: 'Казахстан → Челябинск',
      team: {
        connect: [{ id: sasha.id }, { id: ekaterina.id }],
      },
    },
  });

  const yelkiProject = await prisma.project.create({
    data: {
      name: 'Ёлки — поставка к Новому году',
      description:
        'Сезонный трейдинговый проект по закупке и поставке ёлок с фокусом на прогнозируемый спрос и минимизацию складских остатков.',
      status: 'completed',
      direction: 'trade',
      priority: 'medium',
      health: 'good',
      start: new Date('2025-11-01'),
      end: new Date('2025-12-31'),
      budgetPlan: 1500000,
      budgetFact: 1400000,
      progress: 100,
      location: 'Сургут',
      team: {
        connect: [{ id: sasha.id }],
      },
    },
  });

  const severnayaProject = await prisma.project.create({
    data: {
      name: 'Северная логистика — зимник и перевалка',
      description:
        'Подготовка временной инфраструктуры и логистического окна для поставок строительных материалов на северные объекты.',
      status: 'at_risk',
      direction: 'construction',
      priority: 'critical',
      health: 'critical',
      start: new Date('2026-01-15'),
      end: new Date('2026-04-30'),
      budgetPlan: 7800000,
      budgetFact: 4550000,
      progress: 48,
      location: 'ЯНАО',
      team: {
        connect: [{ id: sasha.id }, { id: pavel.id }, { id: irina.id }],
      },
    },
  });

  console.log('✅ Created 4 projects');

  // ============================================
  // TASKS
  // ============================================

  // Tasks for ЧЭМК
  await prisma.task.createMany({
    data: [
      {
        title: 'Согласовать СП с МИПТЭК',
        description: 'Подготовить и согласовать соглашение о совместной деятельности',
        status: 'in_progress',
        priority: 'critical',
        order: 0,
        dueDate: new Date('2026-03-15'),
        projectId: chemkProject.id,
        assigneeId: sasha.id,
      },
      {
        title: 'Получить лицензию на недропользование',
        status: 'todo',
        priority: 'high',
        order: 0,
        dueDate: new Date('2026-04-30'),
        projectId: chemkProject.id,
        assigneeId: ivan.id,
      },
      {
        title: 'Провести геологоразведку',
        status: 'todo',
        priority: 'medium',
        order: 1,
        dueDate: new Date('2026-06-30'),
        projectId: chemkProject.id,
        assigneeId: mikhail.id,
      },
    ],
  });

  // Tasks for Бентонит
  await prisma.task.createMany({
    data: [
      {
        title: 'Найти карьер в KZ',
        description: 'Поиск и оценка карьеров в Казахстане',
        status: 'in_progress',
        priority: 'critical',
        order: 0,
        dueDate: new Date('2026-05-01'),
        projectId: bentoniteProject.id,
        assigneeId: ekaterina.id,
      },
      {
        title: 'Проверить качество образцов',
        status: 'todo',
        priority: 'high',
        order: 0,
        dueDate: new Date('2026-04-15'),
        projectId: bentoniteProject.id,
        assigneeId: sasha.id,
      },
    ],
  });

  // Tasks for Северная логистика
  await prisma.task.createMany({
    data: [
      {
        title: 'Открыть окно зимника',
        description: 'Координация открытия зимника',
        status: 'in_progress',
        priority: 'critical',
        order: 0,
        dueDate: new Date('2026-03-18'),
        projectId: severnayaProject.id,
        assigneeId: pavel.id,
      },
      {
        title: 'Подготовить перевалочную базу',
        status: 'todo',
        priority: 'high',
        order: 0,
        dueDate: new Date('2026-03-25'),
        projectId: severnayaProject.id,
        assigneeId: irina.id,
      },
    ],
  });

  console.log('✅ Created 7 tasks');

  // ============================================
  // MILESTONES
  // ============================================

  await prisma.milestone.createMany({
    data: [
      {
        title: 'КП для МИПТЭК',
        date: new Date('2026-04-15'),
        status: 'upcoming',
        projectId: chemkProject.id,
      },
      {
        title: 'Найти карьер в KZ',
        date: new Date('2026-05-01'),
        status: 'upcoming',
        projectId: bentoniteProject.id,
      },
      {
        title: 'Окно зимника',
        date: new Date('2026-03-18'),
        status: 'in_progress',
        projectId: severnayaProject.id,
      },
    ],
  });

  console.log('✅ Created 3 milestones');

  // ============================================
  // RISKS
  // ============================================

  await prisma.risk.createMany({
    data: [
      {
        title: 'Задержка согласования модели СП',
        description: 'Риск задержки согласования совместной деятельности',
        probability: 'medium',
        impact: 'high',
        severity: 4,
        status: 'open',
        projectId: chemkProject.id,
        ownerId: sasha.id,
      },
      {
        title: 'Низкое качество образцов бентонита',
        description: 'Риск низкого качества сырья из Казахстана',
        probability: 'high',
        impact: 'medium',
        severity: 4,
        status: 'open',
        projectId: bentoniteProject.id,
        ownerId: ekaterina.id,
      },
      {
        title: 'Погодное окно может закрыться раньше плана',
        description: 'Риск раннего закрытия зимника',
        probability: 'high',
        impact: 'high',
        severity: 5,
        status: 'open',
        projectId: severnayaProject.id,
        ownerId: pavel.id,
      },
      {
        title: 'Нехватка оборотного капитала на субподряд',
        description: 'Финансовый риск',
        probability: 'medium',
        impact: 'high',
        severity: 4,
        status: 'open',
        projectId: severnayaProject.id,
        ownerId: irina.id,
      },
    ],
  });

  console.log('✅ Created 4 risks');

  // ============================================
  // DOCUMENTS
  // ============================================

  await prisma.document.createMany({
    data: [
      {
        title: 'Технико-экономическое обоснование',
        filename: 'teo.pdf',
        url: '/documents/teo.pdf',
        type: 'pdf',
        size: 4400000, // 4.2 MB
        projectId: chemkProject.id,
        ownerId: sasha.id,
      },
      {
        title: 'Коммерческое предложение v3',
        filename: 'kp_v3.docx',
        url: '/documents/kp_v3.docx',
        type: 'docx',
        size: 1100000, // 1.1 MB
        projectId: chemkProject.id,
        ownerId: ivan.id,
      },
      {
        title: 'Матрица поставщиков KZ',
        filename: 'suppliers.xlsx',
        url: '/documents/suppliers.xlsx',
        type: 'xlsx',
        size: 820000, // 820 KB
        projectId: bentoniteProject.id,
        ownerId: ekaterina.id,
      },
      {
        title: 'План зимника и перевалки',
        filename: 'winter_road.pdf',
        url: '/documents/winter_road.pdf',
        type: 'pdf',
        size: 6800000, // 6.8 MB
        projectId: severnayaProject.id,
        ownerId: pavel.id,
      },
    ],
  });

  console.log('✅ Created 4 documents');

  // ============================================
  // SUMMARY
  // ============================================

  const summary = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM Project) as projects,
      (SELECT COUNT(*) FROM Task) as tasks,
      (SELECT COUNT(*) FROM TeamMember) as team,
      (SELECT COUNT(*) FROM Risk) as risks,
      (SELECT COUNT(*) FROM Milestone) as milestones,
      (SELECT COUNT(*) FROM Document) as documents
  `;

  console.log('\n📊 Database seeded successfully!');
  console.log('Summary:', summary);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# CEOClaw Dashboard

CEOClaw — это AI-powered visual project management dashboard. Система превращает агентов OpenClaw в наглядную систему управления для человека.

## ✨ Core Features

*   **AI-Powered:** Интеграция с OpenClaw для выполнения CRUD операций через голос и текст.
*   **Visual Management:** Kanban-доски, диаграммы Ганта, календарь и Analytics Dashboard.
*   **Time Tracking:** Встроенный таймер и детальные отчеты.
*   **Smart Analytics:** AI-предсказания, Health Scores и рекомендации.
*   **Notifications:** Система уведомлений о задачах (назначения, сроки, статусы).

## 🚀 Getting Started

### Prerequisites
*   Node.js 22+
*   PostgreSQL or SQLite
*   OpenClaw Gateway

### Installation
1. Clone the repo: `git clone https://github.com/alexgrebeshok-coder/pm-dashboard.git`
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env.local`
4. Run migrations: `npx prisma migrate dev`
5. Start dev server: `npm run dev`

## 📖 Usage
*   **Voice/Text:** Используйте `/chat` или Telegram bot.
*   **Analytics:** Вкладка `/analytics` для контроля здоровья проектов.
*   **Kanban:** Управление задачами через drag & drop.

Project Roadmap available in `Проекты/Фронтенд/CEOClaw_Roadmap_Final.md`.

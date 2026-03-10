# SEOClaw API Documentation (OpenAPI 3.0)

## Overview
SEOClaw API предоставляет доступ к функциональности дашборда для внешних агентов и интеграций.

### Authentication
Требуется Bearer Token (DASHBOARD_API_KEY) в заголовке `Authorization`.

## Endpoints

### 1. Projects
*   `GET /api/projects` — Список всех проектов
*   `POST /api/projects` — Создать проект
*   `GET /api/projects/:id` — Детали проекта
*   `PUT /api/projects/:id` — Обновить проект
*   `DELETE /api/projects/:id` — Удалить проект

### 2. Tasks
*   `GET /api/tasks` — Список задач
*   `POST /api/tasks` — Создать задачу
*   `PUT /api/tasks/:id` — Обновить задачу

### 3. Analytics
*   `GET /api/analytics/overview` — Health scores & project status
*   `GET /api/analytics/team-performance` — Member statistics
*   `GET /api/analytics/predictions` — Finish date & budget risk
*   `GET /api/analytics/recommendations` — Actionable suggestions

### 4. Notifications
*   `GET /api/notifications` — Получить уведомления
*   `PUT /api/notifications/:id/read` — Пометить как прочитанное

For detailed OpenAPI specification, see `openapi.yaml`.

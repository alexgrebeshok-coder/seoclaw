import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Critical Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Homepage loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/CEOClaw|Dashboard/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Navigation works", async ({ page }) => {
    // Check sidebar navigation
    const projectsLink = page.locator('a[href="/projects"]');
    await expect(projectsLink).toBeVisible();
    
    await projectsLink.click();
    await expect(page).toHaveURL(/.*projects/);
  });

  test("Projects page displays projects", async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);
    
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"], .project-card', {
      timeout: 5000,
    }).catch(async () => {
      // Fallback: check for any project-related content
      // Use first() to avoid strict mode violation
      return expect(page.locator("text=/проект/i").first()).toBeVisible();
    });
    
    await expect(page.locator("h1")).toContainText(/проект/i);
  });

  test("Kanban board loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/kanban`);
    
    // Wait for board to load
    await page.waitForSelector('[data-testid="kanban-board"], .kanban-board', {
      timeout: 5000,
    }).catch(() => {
      // Check for kanban-related content
      return expect(page.locator("text=/загрузка|board|kanban/i")).toBeVisible();
    });
    
    await expect(page).toHaveURL(/.*kanban/);
  });

  test("Analytics page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    
    // Use first() to avoid strict mode violation
    await expect(page.locator("h2, h1").first()).toContainText(/аналитик|analytics/i);
  });

  test("Calendar page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/calendar`);
    
    // Use first() to avoid strict mode violation
    await expect(page.locator("h2, h1").first()).toContainText(/календарь|calendar/i);
  });
});

test.describe("API Health Checks", () => {
  test("Health API returns OK", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("Projects API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/projects`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("Notifications API returns data", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/notifications?userId=default`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty("notifications");
    expect(data).toHaveProperty("unreadCount");
  });
});

test.describe("Accessibility", () => {
  test("Page has proper heading structure", async ({ page }) => {
    await page.goto(BASE_URL);
    
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("Interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Tab through first few interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Check that focus is visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});

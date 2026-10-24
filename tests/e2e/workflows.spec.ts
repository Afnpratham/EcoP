import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
const pages = [
  "/",
  "/stations",
  "/dashboard",
  "/rewards",
  "/leaderboard",
  "/profile",
  "/impact",
  "/lab",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
];
test("all screens render with no client exceptions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const url of pages) {
    await page.goto(url);
    await expect(page.locator("h1,h2").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
  expect(errors).toEqual([]);
});
test("mobile navigation and pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    "/",
    "/stations",
    "/dashboard",
    "/rewards",
    "/impact",
    "/lab",
    "/login",
    "/register",
  ]) {
    await page.goto(url);
    await expect(page.locator("h1,h2").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      url,
    ).toBe(true);
  }
  await page.goto("/stations");
  await page.screenshot({
    path: "artifacts/mobile-stations.png",
    fullPage: true,
  });
});
test("station session creates one simulated award and blocks replay", async ({
  page,
  request,
}) => {
  await page.goto("/ecop/bin/BIN-014");
  await expect(
    page.getByText("Simulation workspace", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start disposal session" }).click();
  await expect(
    page.getByRole("heading", { name: "Ready when you are" }),
  ).toBeVisible();
  const before = await (await request.get("/api/dashboard")).json();
  await page
    .getByRole("button", { name: "Simulate disposal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Simulation recorded" }),
  ).toBeVisible();
  const after = await (await request.get("/api/dashboard")).json();
  expect(after.stats.ecoPoints - before.stats.ecoPoints).toBe(10);
  const sid = after.recentSessions[0].id;
  const replay = await request.post("/api/disposal-success", {
    data: { binId: "BIN-014", sessionId: sid, cycleId: sid },
  });
  expect((await replay.json()).duplicate).toBe(true);
  expect(
    (await (await request.get("/api/dashboard")).json()).stats.ecoPoints,
  ).toBe(after.stats.ecoPoints);
});
test("offline session start is disabled and does not claim points", async ({
  page,
  context,
}) => {
  await page.goto("/ecop/bin/BIN-014");
  await expect(
    page.getByRole("button", { name: "Start disposal session" }),
  ).toBeEnabled();
  await context.setOffline(true);
  await expect(
    page.getByRole("button", { name: "Start disposal session" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("alert").filter({ hasText: "offline" }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByRole("button", { name: "Start disposal session" }),
  ).toBeEnabled();
});
test("isolated lab supports evidence, replay, appeal, review, custody and reuse", async ({
  request,
  page,
}) => {
  await request.post("/api/impact-demo", { data: { action: "reset" } });
  const id = randomUUID();
  let response = await request.post("/api/impact-demo", {
    data: {
      action: "verify",
      eventId: id,
      bin: "BIN-014",
      vision: true,
      tracked: true,
      beam: false,
      load: null,
    },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).events[0].outcome).toBe("inconclusive");
  expect(
    (
      await request.post("/api/impact-demo", {
        data: {
          action: "verify",
          eventId: id,
          bin: "BIN-014",
          vision: true,
          tracked: true,
          beam: false,
          load: null,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/impact-demo", {
        data: { action: "appeal", eventId: id },
      })
    ).ok(),
  ).toBe(true);
  response = await request.post("/api/impact-demo", {
    data: { action: "review", eventId: id, approve: true },
  });
  expect((await response.json()).statistics.earned).toBe(10);
  expect(
    (
      await request.post("/api/impact-demo", {
        data: { action: "review", eventId: id, approve: true },
      })
    ).status(),
  ).toBe(409);
  response = await request.post("/api/impact-demo", {
    data: {
      action: "collect",
      massKg: 1.2,
      origin: "BIN-014",
      contamination: "Sample only",
    },
  });
  const batch = (await response.json()).batches[0].id;
  response = await request.post("/api/impact-demo", {
    data: { action: "accept", batchId: batch },
  });
  expect((await response.json()).statistics.acceptedKg).toBe(1.2);
  response = await request.post("/api/impact-demo", {
    data: { action: "refill", station: "REFILL-001" },
  });
  expect((await response.json()).statistics.earned).toBe(12);
  await page.goto("/lab");
  await expect(
    page.getByText("Approved in demonstration review"),
  ).toBeVisible();
});
test("API validation, cross-origin protection and signed-ingestion isolation", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/session/start", { data: { binId: "<script>" } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/session/start", {
        headers: { Origin: "https://attacker.invalid" },
        data: { binId: "BIN-014" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/disposal/verify", {
        data: { result: "success" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/profile", {
        data: { full_name: "Changed", leaderboard_opt_in: true },
      })
    ).status(),
  ).toBe(403);
  const r = await request.get("/api/dashboard");
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
});
test("landing desktop screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "artifacts/desktop-home.png", fullPage: true });
});

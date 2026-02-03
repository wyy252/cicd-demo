import { test, expect } from "@playwright/test";

test("user journey: create an item then list items", async ({ request }) => {
  const name = "from-e2e-" + Date.now();

  const createRes = await request.post("/api/items", {
    data: { name }
  });
  expect(createRes.status()).toBe(201);

  const listRes = await request.get("/api/items");
  expect(listRes.status()).toBe(200);

  const items = await listRes.json();
  const found = items.some((x: any) => x.name === name);
  expect(found).toBeTruthy();
});

import { test, expect } from '@playwright/test';

test('E2E: health endpoint should be OK', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.ok).toBe(true);
});

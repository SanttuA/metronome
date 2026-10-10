import { expect, test } from '@playwright/test';

test('is installable with a valid web app manifest', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/metronome/manifest.webmanifest');

  const response = await request.get(href ?? '');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: 'Metronome',
    display: 'standalone',
    start_url: '/metronome/',
    scope: '/metronome/',
  });

  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(
    true,
  );
  const icons = await Promise.all(
    (manifest.icons as { src: string }[]).map((icon) => request.get(icon.src)),
  );
  expect(icons.every((icon) => icon.ok())).toBe(true);
});

test('works offline once loaded', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByText('Ready to work offline.')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Metronome' })).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('beat-indicator').locator('li[data-active="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Stop' }).click();
});

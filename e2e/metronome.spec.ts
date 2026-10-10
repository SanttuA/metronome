import { expect, test, type Page } from '@playwright/test';

const bpmInput = (page: Page) => page.getByRole('textbox', { name: 'Tempo in beats per minute' });
const beats = (page: Page) => page.getByTestId('beat-indicator').locator('li');
const activeBeat = (page: Page) =>
  page.getByTestId('beat-indicator').locator('li[data-active="true"]');

async function activeBeatIndex(page: Page): Promise<number> {
  return beats(page).evaluateAll((dots) =>
    dots.findIndex((dot) => dot.getAttribute('data-active') === 'true'),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(bpmInput(page)).toBeVisible();
});

test('shows the metronome with sensible defaults', async ({ page }) => {
  await expect(page).toHaveTitle('Metronome');
  await expect(page.getByRole('heading', { name: 'Metronome' })).toBeVisible();
  await expect(bpmInput(page)).toHaveValue('120');
  await expect(page.getByTestId('tempo-marking')).toHaveText('Allegro');
  await expect(beats(page)).toHaveCount(4);
});

test('plays, advances through the bar and stops', async ({ page }) => {
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(activeBeat(page)).toHaveCount(1);

  const seen = new Set<number>();
  await expect
    .poll(
      async () => {
        seen.add(await activeBeatIndex(page));
        return seen.size;
      },
      { timeout: 5_000, intervals: [50] },
    )
    .toBeGreaterThanOrEqual(3);

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(activeBeat(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('changes the tempo with buttons, slider and typing', async ({ page }) => {
  await page.getByRole('button', { name: 'Increase tempo' }).click();
  await expect(bpmInput(page)).toHaveValue('121');
  await page.getByRole('button', { name: 'Decrease tempo' }).click();
  await page.getByRole('button', { name: 'Decrease tempo' }).click();
  await expect(bpmInput(page)).toHaveValue('119');

  await page.getByRole('slider', { name: 'Tempo' }).fill('200');
  await expect(bpmInput(page)).toHaveValue('200');
  await expect(page.getByTestId('tempo-marking')).toHaveText('Prestissimo');

  await bpmInput(page).fill('72');
  await bpmInput(page).press('Enter');
  await expect(bpmInput(page)).toHaveValue('72');
  await expect(page.getByTestId('tempo-marking')).toHaveText('Adagio');
});

test.describe('keyboard shortcuts', () => {
  test('Space starts and stops', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('Space on the focused play button toggles only once', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('arrow keys change the tempo', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await expect(bpmInput(page)).toHaveValue('121');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(bpmInput(page)).toHaveValue('111');
  });
});

test('time signature sets the number of beats', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Time signature' }).selectOption('3/4');
  await expect(beats(page)).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Time signature' }).selectOption('7/8');
  await expect(beats(page)).toHaveCount(7);
});

test('remembers settings across reloads', async ({ page }) => {
  await page.getByRole('slider', { name: 'Tempo' }).fill('90');
  await page.getByRole('combobox', { name: 'Time signature' }).selectOption('6/8');
  await page.getByRole('switch', { name: 'Accent first beat' }).uncheck();

  await page.reload();

  await expect(bpmInput(page)).toHaveValue('90');
  await expect(beats(page)).toHaveCount(6);
  await expect(page.getByRole('switch', { name: 'Accent first beat' })).not.toBeChecked();
});

test.describe('theme', () => {
  // --bg from src/styles.css.
  const DARK_BACKGROUND = 'rgb(14, 13, 20)';
  const LIGHT_BACKGROUND = 'rgb(243, 242, 248)';

  // Dark is the default even when the OS prefers light.
  test.use({ colorScheme: 'light' });

  test('defaults to dark and remembers a switch to light', async ({ page }) => {
    const html = page.locator('html');
    const body = page.locator('body');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(body).toHaveCSS('background-color', DARK_BACKGROUND);

    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(body).toHaveCSS('background-color', LIGHT_BACKGROUND);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(body).toHaveCSS('background-color', LIGHT_BACKGROUND);
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  });

  test.describe(() => {
    // Otherwise the service worker could serve the bundle from its cache, bypassing the route.
    test.use({ serviceWorkers: 'block' });

    test('applies the saved theme before the app renders', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('metronome.theme', '"light"'));
      // Block the app bundle so only the inline script in index.html can set the theme.
      await page.route('**/assets/*.js', (route) => route.abort());
      await page.reload();

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3f2f8');
    });
  });
});

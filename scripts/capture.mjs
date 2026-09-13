import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { open } from '@vscode/test-web';
import { chromium } from 'playwright';
import { root, readJson, json } from './lib/project.mjs';
import { palettes } from '../src/palettes.mjs';

const port = 4174;
const reference = readJson('reference/vscode-colors.json');
const server = await open({
  browserType: 'none',
  quality: 'stable',
  commit: reference.commit,
  extensionDevelopmentPath: root,
  extensionPaths: [resolve(root, 'scripts/preview-extension')],
  folderPath: resolve(root, 'showcase'),
  host: 'localhost',
  port,
  testRunnerDataDir: resolve(root, '.vscode-test-web'),
});
let browser;
let page;
const results = [];
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({
    viewport: { width: 1600, height: 1040 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  page.setDefaultTimeout(45000);
  page.on('pageerror', (error) => console.error('Browser:', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('Editor:', message.text());
  });
  await page.goto(`http://localhost:${port}`);
  await page.locator('.monaco-workbench').waitFor();
  // Extension startup owns the initial file; waiting for it also waits for registration.
  await page.locator('.tab[aria-label*="tide.ts"]').first().waitFor({ timeout: 60000 });
  const command = async (title) => {
    await page.keyboard.press('F1');
    const input = page.locator('.quick-input-widget input');
    await input.fill(`>${title}`);
    const row = page
      .locator('.quick-input-list .monaco-list-row')
      .filter({ hasText: title })
      .first();
    await row.waitFor();
    await row.click();
    await page.locator('.quick-input-widget').waitFor({ state: 'hidden' });
  };
  const settle = async () => {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  };
  mkdirSync(resolve(root, 'assets'), { recursive: true });
  mkdirSync(resolve(root, 'dist/screenshots'), { recursive: true });
  for (const variant of ['dark', 'light']) {
    await command(`Tide Preview: ${variant === 'dark' ? 'Dark' : 'Light'}`);
    await page.waitForFunction(
      (expected) =>
        getComputedStyle(document.querySelector('.monaco-workbench'))
          .getPropertyValue('--vscode-editor-background')
          .trim()
          .toLowerCase() === expected,
      palettes[variant].canvas.toLowerCase(),
    );
    await page.locator('.view-lines').filter({ hasText: 'TideStation' }).first().waitFor();
    await page.keyboard.press('Escape');
    await settle();
    const properties = await page.locator('.monaco-workbench').evaluate((element) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        [
          'editor-background',
          'editor-foreground',
          'focusBorder',
          'sideBar-background',
          'statusBar-foreground',
        ].map((key) => [key, style.getPropertyValue(`--vscode-${key}`).trim()]),
      );
    });
    for (const [key, role] of [
      ['editor-background', 'canvas'],
      ['editor-foreground', 'foreground'],
      ['focusBorder', 'accent'],
      ['sideBar-background', 'chrome'],
      ['statusBar-foreground', 'foreground'],
    ]) {
      if (properties[key].toUpperCase() !== palettes[variant][role])
        throw new Error(
          `${variant}: runtime ${key} is ${properties[key]}, expected ${palettes[variant][role]}`,
        );
    }
    await page.screenshot({ path: resolve(root, `assets/tide-${variant}.png`) });
    await command('Tide Preview: Semantic Off');
    await settle();
    await page.screenshot({ path: resolve(root, `dist/screenshots/tide-${variant}-textmate.png`) });
    await command('Tide Preview: Semantic On');
    await command('Tide Preview: Semantic Fixture');
    const semanticColors = Object.fromEntries(
      [
        ['Ocean', 'muted'],
        ['Harbor', 'amber'],
        ['current', 'foreground'],
        ['height', 'subtle'],
        ['measure', 'accent'],
        ['"North Cove"', 'string'],
        ['1.72', 'amber'],
        ['return', 'keyword'],
        ['// Quietly explicit', 'muted'],
      ].map(([word, role]) => [word, palettes[variant][role]]),
    );
    await page.waitForFunction(
      (expected) =>
        Object.entries(expected).every(([word, hex]) => {
          const span = [...document.querySelectorAll('.view-lines span')].find(
            (element) =>
              element.textContent.replaceAll('\u00a0', ' ') === word &&
              element.children.length === 0,
          );
          if (!span) return false;
          const color = `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
          return (
            getComputedStyle(span).color === color && getComputedStyle(span).fontStyle === 'normal'
          );
        }),
      semanticColors,
    );
    await page.screenshot({ path: resolve(root, `dist/screenshots/tide-${variant}-semantic.png`) });
    await command('Tide Preview: Diff');
    await page.locator('.monaco-diff-editor.side-by-side').first().waitFor();
    await page.locator('.char-insert').first().waitFor();
    await settle();
    await page.screenshot({ path: resolve(root, `assets/tide-${variant}-diff.png`) });
    await command('Tide Preview: Inline Diff');
    await page.locator('.monaco-diff-editor:not(.side-by-side)').first().waitFor();
    await page.locator('.char-insert').first().waitFor();
    await settle();
    await page.screenshot({
      path: resolve(root, `dist/screenshots/tide-${variant}-inline-diff.png`),
    });
    await command('Tide Preview: Diagnostics');
    await page.getByText('Preview: a station name is required.', { exact: true }).first().waitFor();
    await settle();
    await page.screenshot({
      path: resolve(root, `dist/screenshots/tide-${variant}-diagnostics.png`),
    });
    results.push({ variant, properties, semanticColors });
  }
  writeFileSync(
    resolve(root, 'dist/visual.json'),
    json({
      vscode: reference.version,
      commit: reference.commit,
      browser: browser.version(),
      viewport: { width: 1600, height: 1040 },
      results,
    }),
  );
  console.log(
    'Captured real VS Code dark/light, diff, and TextMate views; runtime palette checks passed.',
  );
  for (const extension of ['png', 'html'])
    rmSync(resolve(root, `dist/capture-failure.${extension}`), { force: true });
} catch (error) {
  mkdirSync(resolve(root, 'dist'), { recursive: true });
  if (page && !page.isClosed()) {
    await page.screenshot({ path: resolve(root, 'dist/capture-failure.png') });
    writeFileSync(resolve(root, 'dist/capture-failure.html'), await page.content());
  }
  throw error;
} finally {
  await browser?.close();
  server.dispose();
}

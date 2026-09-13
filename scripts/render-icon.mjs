import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './lib/project.mjs';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 256, height: 256 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>body{margin:0}</style>${readFileSync(resolve(root, 'assets/icon.svg'), 'utf8')}`,
  );
  await page.screenshot({ path: resolve(root, 'assets/icon.png'), omitBackground: true });
} finally {
  await browser.close();
}

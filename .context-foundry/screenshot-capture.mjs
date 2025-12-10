#!/usr/bin/env node
/**
 * Screenshot capture script using Playwright
 * Captures key pages of the Sleep Tracker app at different viewports
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = join(__dirname, 'screenshots');

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
};

// Pages to capture (public pages - no auth required)
const PUBLIC_PAGES = [
  { path: '/login', name: 'login', waitFor: 'text=Welcome back' },
  { path: '/register', name: 'register', waitFor: 'text=Create account' },
];

async function captureScreenshot(page, url, name, viewportName, waitFor) {
  const viewport = VIEWPORTS[viewportName];
  await page.setViewportSize(viewport);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for specific content to appear
    if (waitFor) {
      try {
        await page.waitForSelector(waitFor, { timeout: 10000 });
      } catch (e) {
        console.log(`  Warning: Could not find "${waitFor}" - taking screenshot anyway`);
      }
    }

    await page.waitForTimeout(1000); // Allow animations to settle

    const filename = `${name}-${viewportName}-light.png`;
    const filepath = join(OUTPUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  Captured: ${filename}`);
    return filename;
  } catch (e) {
    console.log(`  Error capturing ${name}-${viewportName}: ${e.message}`);
    return null;
  }
}

async function captureErrorState(page, name, viewportName) {
  const viewport = VIEWPORTS[viewportName];
  await page.setViewportSize(viewport);

  try {
    if (name === 'login') {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for the form to be visible
      try {
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      } catch (e) {
        console.log(`  Warning: Login form not found`);
        return null;
      }

      await page.waitForTimeout(500);

      // Fill with invalid credentials
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000); // Wait for error to appear

      const filename = `${name}-error-${viewportName}-light.png`;
      const filepath = join(OUTPUT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`  Captured: ${filename}`);
      return filename;
    }
  } catch (e) {
    console.log(`  Error capturing ${name}-error-${viewportName}: ${e.message}`);
    return null;
  }
  return null;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const captured = [];
  const errors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [Browser Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`  [Page Error]: ${err.message}`);
  });

  console.log('Capturing Public Pages...');
  console.log('-'.repeat(40));

  // Capture public pages at different viewports
  for (const pageInfo of PUBLIC_PAGES) {
    const { name, path, waitFor } = pageInfo;
    const url = `${BASE_URL}${path}`;

    console.log(`\n${name.charAt(0).toUpperCase() + name.slice(1)} Page:`);
    for (const viewportName of ['desktop', 'mobile']) {
      const result = await captureScreenshot(page, url, name, viewportName, waitFor);
      if (result) {
        captured.push(result);
      } else {
        errors.push(`${name}-${viewportName}-light.png`);
      }
    }
  }

  // Capture error states
  console.log('\nError States:');
  const errorResult = await captureErrorState(page, 'login', 'desktop');
  if (errorResult) {
    captured.push(errorResult);
  }

  await browser.close();

  console.log('\n' + '='.repeat(40));
  console.log(`Captured: ${captured.length} screenshots`);
  console.log(`Errors: ${errors.length}`);

  // Write manifest
  const manifest = `Screenshots captured:\n${captured.map(s => `  ${s}`).join('\n')}\n${errors.length ? `\nFailed:\n${errors.map(e => `  ${e}`).join('\n')}` : ''}`;
  await writeFile(join(OUTPUT_DIR, 'manifest.txt'), manifest);

  return { captured, errors };
}

main().catch(console.error);

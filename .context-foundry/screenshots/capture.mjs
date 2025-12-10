import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/Users/name/homelab/Sleep_Tracker___Well_20251209_215338-n2m/.context-foundry/screenshots';

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
};

// Pages to capture (public pages only since backend is down)
const PUBLIC_PAGES = [
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' }
];

async function captureScreenshots() {
  console.log('Starting screenshot capture...');

  // Ensure directory exists
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const viewport of ['mobile', 'desktop']) {
      const context = await browser.newContext({
        viewport: VIEWPORTS[viewport],
        deviceScaleFactor: viewport === 'mobile' ? 2 : 1
      });

      const page = await context.newPage();

      for (const pageConfig of PUBLIC_PAGES) {
        const filename = `${pageConfig.name}-${viewport}-light.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);

        try {
          console.log(`Capturing: ${filename}`);
          await page.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: 'networkidle', timeout: 10000 });

          // Wait for any animations
          await page.waitForTimeout(500);

          await page.screenshot({ path: filepath, fullPage: false });

          results.push({
            filename,
            path: pageConfig.path,
            viewport,
            status: 'success'
          });

          console.log(`  ✓ Captured ${filename}`);
        } catch (error) {
          results.push({
            filename,
            path: pageConfig.path,
            viewport,
            status: 'failed',
            error: error.message
          });
          console.log(`  ✗ Failed ${filename}: ${error.message}`);
        }
      }

      // Try to capture error states
      // Login with invalid credentials (form validation)
      if (viewport === 'desktop') {
        const errorFilename = 'login-error-desktop-light.png';
        try {
          await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });

          // Try to submit empty form
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, errorFilename), fullPage: false });
            results.push({ filename: errorFilename, path: '/login', viewport, status: 'success', state: 'error' });
            console.log(`  ✓ Captured ${errorFilename}`);
          }
        } catch (error) {
          console.log(`  ✗ Failed error state: ${error.message}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\nCapture complete!');
  console.log(`Total: ${results.length} screenshots`);
  console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'failed').length}`);

  return results;
}

captureScreenshots().catch(console.error);

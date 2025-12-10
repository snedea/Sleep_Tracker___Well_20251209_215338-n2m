const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5174';
const SCREENSHOTS_DIR = path.join(__dirname);

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },   // iPhone X
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1440, height: 900 }, // Standard laptop
};

// Pages to capture
const PAGES = [
  { name: 'login', path: '/login', public: true },
  { name: 'register', path: '/register', public: true },
  { name: 'dashboard', path: '/', public: false },
  { name: 'sleep-log', path: '/sleep', public: false },
  { name: 'diary', path: '/diary', public: false },
  { name: 'insights', path: '/insights', public: false },
  { name: 'history', path: '/history', public: false },
  { name: 'settings', path: '/settings', public: false },
];

// Fake user data for localStorage
const FAKE_USER = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  createdAt: '2024-01-01T00:00:00Z',
};

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNzAyMDAwMDAwLCJleHAiOjE3OTkwMDAwMDB9.fake';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const results = [];

  console.log('Starting screenshot capture...\n');

  for (const viewport of ['mobile', 'desktop']) {
    // Context for public pages (no auth)
    const publicContext = await browser.newContext({
      viewport: VIEWPORTS[viewport],
    });
    const publicPage = await publicContext.newPage();

    // Capture public pages
    for (const pageInfo of PAGES.filter(p => p.public)) {
      try {
        console.log(`Capturing ${pageInfo.name} (${viewport})...`);
        await publicPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 10000 });
        await publicPage.waitForTimeout(500);

        const filename = `${pageInfo.name}-populated-${viewport}-light.png`;
        await publicPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, filename),
          fullPage: false,
        });

        results.push({
          filename,
          feature: pageInfo.name,
          state: 'populated',
          viewport,
          success: true,
        });
        console.log(`  - Saved: ${filename}`);
      } catch (error) {
        console.log(`  - ERROR: ${error.message}`);
        results.push({
          filename: `${pageInfo.name}-populated-${viewport}-light.png`,
          feature: pageInfo.name,
          state: 'populated',
          viewport,
          success: false,
          error: error.message,
        });
      }
    }

    // Capture login error state
    try {
      console.log(`Capturing login-error (${viewport})...`);
      await publicPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });
      await publicPage.waitForTimeout(300);

      // Fill form and submit to trigger error
      await publicPage.fill('input[type="email"]', 'test@example.com');
      await publicPage.fill('input[type="password"]', 'wrongpassword');
      await publicPage.click('button[type="submit"]');
      await publicPage.waitForTimeout(2000); // Wait for error to appear

      const filename = `login-error-${viewport}-light.png`;
      await publicPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, filename),
        fullPage: false,
      });

      results.push({
        filename,
        feature: 'login',
        state: 'error',
        viewport,
        success: true,
      });
      console.log(`  - Saved: ${filename}`);
    } catch (error) {
      console.log(`  - ERROR (login-error): ${error.message}`);
    }

    await publicContext.close();

    // Context for authenticated pages
    const authContext = await browser.newContext({
      viewport: VIEWPORTS[viewport],
    });
    const authPage = await authContext.newPage();

    // Set up fake auth state before navigation
    await authPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });

    // Inject auth into localStorage
    await authPage.evaluate(({ user, token }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }, { user: FAKE_USER, token: FAKE_TOKEN });

    // Capture protected pages
    for (const pageInfo of PAGES.filter(p => !p.public)) {
      try {
        console.log(`Capturing ${pageInfo.name} (${viewport}) [authenticated]...`);
        await authPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 10000 });
        await authPage.waitForTimeout(1000);

        const filename = `${pageInfo.name}-populated-${viewport}-light.png`;
        await authPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, filename),
          fullPage: false,
        });

        results.push({
          filename,
          feature: pageInfo.name,
          state: 'populated',
          viewport,
          success: true,
        });
        console.log(`  - Saved: ${filename}`);
      } catch (error) {
        console.log(`  - ERROR: ${error.message}`);
        results.push({
          filename: `${pageInfo.name}-populated-${viewport}-light.png`,
          feature: pageInfo.name,
          state: 'populated',
          viewport,
          success: false,
          error: error.message,
        });
      }
    }

    await authContext.close();
  }

  await browser.close();

  // Write results to JSON
  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'capture-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\nScreenshot capture complete!');
  console.log(`Total: ${results.length} screenshots`);
  console.log(`Success: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  return results;
}

captureScreenshots().catch(console.error);

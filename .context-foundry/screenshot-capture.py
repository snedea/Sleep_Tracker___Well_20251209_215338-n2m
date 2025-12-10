#!/usr/bin/env python3
"""
Screenshot capture script using Playwright
Captures key pages of the Sleep Tracker app at different viewports
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "screenshots"

# Viewport configurations
VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
}

# Pages to capture (public pages - no auth required)
PUBLIC_PAGES = [
    {"path": "/login", "name": "login"},
    {"path": "/register", "name": "register"},
]

async def capture_screenshot(page, url: str, name: str, viewport_name: str):
    """Capture a screenshot at the given URL and viewport"""
    viewport = VIEWPORTS[viewport_name]
    await page.set_viewport_size(viewport)

    try:
        await page.goto(url, wait_until="networkidle", timeout=10000)
        await page.wait_for_timeout(500)  # Allow animations to settle

        filename = f"{name}-{viewport_name}-light.png"
        filepath = OUTPUT_DIR / filename
        await page.screenshot(path=str(filepath), full_page=False)
        print(f"  Captured: {filename}")
        return True
    except Exception as e:
        print(f"  Error capturing {name}-{viewport_name}: {e}")
        return False

async def capture_error_state(page, name: str, viewport_name: str):
    """Capture error state for forms"""
    viewport = VIEWPORTS[viewport_name]
    await page.set_viewport_size(viewport)

    try:
        if name == "login":
            await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=10000)
            await page.wait_for_timeout(300)

            # Fill with invalid credentials
            await page.fill('input[type="email"]', "invalid@test.com")
            await page.fill('input[type="password"]', "wrongpassword")

            # Submit form
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(1000)  # Wait for error to appear

            filename = f"{name}-error-{viewport_name}-light.png"
            filepath = OUTPUT_DIR / filename
            await page.screenshot(path=str(filepath), full_page=False)
            print(f"  Captured: {filename}")
            return True
    except Exception as e:
        print(f"  Error capturing {name}-error-{viewport_name}: {e}")
        return False

async def main():
    """Main capture routine"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    captured = []
    errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Capturing Public Pages...")
        print("-" * 40)

        # Capture public pages at different viewports
        for page_info in PUBLIC_PAGES:
            name = page_info["name"]
            url = f"{BASE_URL}{page_info['path']}"

            print(f"\n{name.title()} Page:")
            for viewport_name in ["desktop", "mobile"]:
                success = await capture_screenshot(page, url, name, viewport_name)
                if success:
                    captured.append(f"{name}-{viewport_name}-light.png")
                else:
                    errors.append(f"{name}-{viewport_name}-light.png")

        # Capture error states
        print(f"\nError States:")
        success = await capture_error_state(page, "login", "desktop")
        if success:
            captured.append("login-error-desktop-light.png")

        await browser.close()

    print("\n" + "=" * 40)
    print(f"Captured: {len(captured)} screenshots")
    print(f"Errors: {len(errors)}")

    # Write manifest
    manifest_path = OUTPUT_DIR / "manifest.txt"
    with open(manifest_path, "w") as f:
        f.write("Screenshots captured:\n")
        for s in captured:
            f.write(f"  {s}\n")
        if errors:
            f.write("\nFailed:\n")
            for e in errors:
                f.write(f"  {e}\n")

    return captured, errors

if __name__ == "__main__":
    asyncio.run(main())

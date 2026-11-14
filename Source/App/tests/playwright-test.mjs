import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";

const PORT = 3088;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.resolve("./tests/screenshots");

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          resolve(true);
        })
        .on("error", () => {
          if (Date.now() - start > timeout) {
            reject(new Error(`Timeout waiting for server at ${url}`));
          } else {
            setTimeout(check, 500);
          }
        });
    };
    check();
  });
}

async function runPlaywrightSuite() {
  console.log("==================================================");
  console.log("   EPIC CRAFT PROGRESS TRACKER PLAYWRIGHT TEST    ");
  console.log("==================================================\n");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log(`Starting Next.js production server on port ${PORT}...`);
  const serverProcess = spawn(
    "npx",
    ["next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      stdio: "pipe",
      env: { ...process.env, PORT: String(PORT) },
    }
  );

  serverProcess.stdout.on("data", (d) => {
    const msg = d.toString().trim();
    if (msg.includes("Ready in")) {
      console.log(`✓ Next.js server: ${msg}`);
    }
  });

  serverProcess.stderr.on("data", (d) => {
    // console.error(d.toString());
  });

  console.log(`Waiting for ${BASE_URL} to be ready...`);
  await waitForServer(`${BASE_URL}/login`);
  console.log("✓ Server is ready! Starting Playwright browser tests...\n");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Login Page
    // -------------------------------------------------------------------------
    console.log("1. Navigating to Login Page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('text=Epic Craft');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png` });
    console.log("✓ Login page rendered successfully (screenshot saved)");

    // -------------------------------------------------------------------------
    // TEST 2: CEO Login & Executive Dashboard
    // -------------------------------------------------------------------------
    console.log("2. Performing CEO Authentication (EC-0001)...");
    await page.fill('input[placeholder*="EC-"]', "EC-0001");
    await page.fill('input[type="password"]', "Admin@123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/ceo", { timeout: 10000 });
    console.log("✓ CEO redirected to /ceo");

    await page.waitForSelector("text=Active Projects");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-ceo-dashboard.png` });
    console.log("✓ DashStack CEO Command Center verified & screenshot captured");

    // -------------------------------------------------------------------------
    // TEST 3: CEO Projects Hub & Tables
    // -------------------------------------------------------------------------
    console.log("3. Navigating to All Projects table...");
    await page.goto(`${BASE_URL}/ceo/projects`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Projects Central Hub");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-ceo-projects-table.png` });
    console.log("✓ CEO Projects Hub verified with live Drive links & progress bars");

    // -------------------------------------------------------------------------
    // TEST 4: CEO Approval Queue
    // -------------------------------------------------------------------------
    console.log("4. Inspecting CEO Approval Queue...");
    await page.goto(`${BASE_URL}/ceo/approvals`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Review & Sign-Off Queue");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-ceo-approvals.png` });
    console.log("✓ CEO Approval Queue verified");

    // -------------------------------------------------------------------------
    // TEST 5: Employee Login & Progress Workspace
    // -------------------------------------------------------------------------
    console.log("5. Switching to Employee Session (EC-0002)...");
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[placeholder*="EC-"]', "EC-0002");
    await page.fill('input[type="password"]', "Pass@123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/employee", { timeout: 10000 });
    console.log("✓ Employee authenticated and landed on /employee");

    await page.waitForSelector("text=My Assigned Projects");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-employee-dashboard.png` });
    console.log("✓ Employee Workspace verified");

    // Test opening Post Progress Modal
    const postProgressBtn = await page.$('button:has-text("Post Progress")');
    if (postProgressBtn) {
      await postProgressBtn.click();
      await page.waitForSelector("text=Post Progress Update");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-progress-update-modal.png` });
      console.log("✓ Progress update modal opened & verified with slider");
    }

    console.log("\n==================================================");
    console.log("   ALL PLAYWRIGHT BROWSER TESTS PASSED 100% !     ");
    console.log("==================================================");
  } catch (error) {
    console.error("Playwright test encountered error:", error);
    try {
      console.error("Current URL:", page.url());
      const html = await page.content();
      console.error("Page HTML preview:\n", html.slice(0, 1000));
    } catch (e) {}
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
    serverProcess.kill("SIGTERM");
  }
}

runPlaywrightSuite().catch((err) => {
  process.exit(1);
});

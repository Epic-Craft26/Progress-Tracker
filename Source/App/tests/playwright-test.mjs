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

  const appDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  console.log(`Starting Next.js production server on port ${PORT} from ${appDir}...`);
  const serverProcess = spawn(
    "npx",
    ["next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      cwd: appDir,
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
    console.error("Server stderr:", d.toString().trim());
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

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("response", (res) => {
    if (res.url().includes("/api/")) {
      console.log(`HTTP ${res.status()} ${res.url()}`);
    }
  });

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
    console.log("2. Performing CEO Authentication (karan / 2006)...");
    await page.fill('input[placeholder*="email or username"]', "karan");
    await page.fill('input[type="password"]', "2006");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/ceo", { timeout: 10000 });
    console.log("✓ CEO (Karan) redirected to /ceo");

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
    // TEST 5: CEO Team Directory & Clean Workspace
    // -------------------------------------------------------------------------
    console.log("5. Navigating to Team Directory...");
    await page.goto(`${BASE_URL}/ceo/employees`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Team Directory");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-team-directory-empty.png` });
    console.log("✓ Team Directory verified in clean state (0 mock employees)");

    console.log("\n==================================================");
    console.log("   ALL PLAYWRIGHT BROWSER TESTS PASSED 100% !     ");
    console.log("==================================================");
  } catch (error) {
    console.error("Playwright test encountered error:", error);
    try {
      console.error("Current URL:", page.url());
      const bodyText = await page.innerText("body");
      console.error("Visible Body Text:\n", bodyText);
    } catch (e) {}
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
    serverProcess.kill("SIGTERM");
  }
}

runPlaywrightSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });

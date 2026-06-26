const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "deliverables", "demo-frames");
const publicFramesDir = path.join(rootDir, "apps", "web", "public", "demo-frames");
const baseUrl = process.env.DEMO_BASE_URL || "http://localhost:4173";

const frames = [
  { id: "00-onboarding", route: "/onboarding", title: "Onboarding" },
  { id: "01-dashboard", route: "/", title: "Dashboard" },
  { id: "02-demo", route: "/demo", title: "Demo sequence" },
  { id: "03-coach", route: "/coach?exercise=squat", title: "Pose Coach" },
  { id: "04-exercises", route: "/exercise-library", title: "Exercise library" },
  { id: "05-diet", route: "/diet-chart", title: "Diet chart" },
  { id: "06-calorie", route: "/calorie-check", title: "Calorie check" },
  { id: "07-progress", route: "/progress", title: "Progress" },
  { id: "08-submission", route: "/demo?scene=submission", title: "Submission" }
];

async function capture() {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(publicFramesDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    window.localStorage.setItem("shorir-theme", "light");
    window.localStorage.setItem("shorir.profileId.v2", "demo-profile");
  });

  const manifest = [];
  for (const frame of frames) {
    await page.goto(`${baseUrl}${frame.route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const fileName = `${frame.id}.png`;
    const outputPath = path.join(outputDir, fileName);
    await page.screenshot({ path: outputPath, fullPage: false });
    await fs.copyFile(outputPath, path.join(publicFramesDir, fileName));
    manifest.push({ ...frame, fileName });
  }

  await browser.close();
  await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Captured ${manifest.length} demo frames in ${outputDir}`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});

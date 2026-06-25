import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const artifactModule =
  process.env.ARTIFACT_TOOL_MODULE ||
  "C:/Users/alfar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const { Presentation, PresentationFile } = await import(pathToFileURL(artifactModule).href);

const outDir = path.join(rootDir, "deliverables");
const renderDir = path.join(outDir, "presentation-render");
const framesDir = path.join(outDir, "demo-frames");
const pptxPath = path.join(outDir, "SHORIR_AI_Project_Presentation.pptx");

const C = {
  bg: "#F6FAFF",
  ink: "#101828",
  muted: "#53657F",
  line: "#D7E3F3",
  panel: "#FFFFFF",
  panel2: "#EAF3FF",
  blue: "#1D6FDB",
  blueDark: "#0B4DA2",
  green: "#29A35A",
  red: "#E22D2D"
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function readImage(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addText(slide, text, position, style = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 }
  });
  box.text = text;
  box.text.style = {
    fontSize: style.fontSize ?? 22,
    color: style.color ?? C.ink,
    bold: style.bold ?? false,
    alignment: style.alignment ?? "left"
  };
  return box;
}

function addPanel(slide, position, fill = C.panel, line = C.line) {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill,
    line: { style: "solid", fill: line, width: 1 },
    borderRadius: "rounded-xl"
  });
}

function addHeader(slide, label) {
  addText(slide, "SHORIR AI", { left: 48, top: 34, width: 190, height: 28 }, { fontSize: 18, bold: true });
  addText(slide, label, { left: 1040, top: 36, width: 190, height: 24 }, { fontSize: 13, color: C.muted, alignment: "right" });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 48, top: 74, width: 1184, height: 1 },
    fill: C.line,
    line: { style: "solid", fill: C.line, width: 0 }
  });
}

async function addScreenshot(slide, fileName, position, alt) {
  slide.images.add({
    blob: await readImage(path.join(framesDir, fileName)),
    contentType: "image/png",
    fit: "cover",
    position,
    geometry: "roundRect",
    borderRadius: "rounded-xl",
    alt
  });
}

function addBullets(slide, items, x, y, width, color = C.ink) {
  items.forEach((item, index) => {
    const top = y + index * 58;
    slide.shapes.add({
      geometry: "ellipse",
      position: { left: x, top: top + 8, width: 12, height: 12 },
      fill: C.blue,
      line: { style: "solid", fill: C.blue, width: 0 }
    });
    addText(slide, item, { left: x + 26, top, width, height: 48 }, { fontSize: 20, color });
  });
}

async function build() {
  await fs.rm(renderDir, { recursive: true, force: true });
  await fs.mkdir(renderDir, { recursive: true });

  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

  let slide = deck.slides.add();
  slide.background.fill = C.bg;
  addText(slide, "SHORIR AI", { left: 70, top: 82, width: 560, height: 84 }, { fontSize: 68, bold: true });
  addText(slide, "Movement Intelligence", { left: 74, top: 166, width: 420, height: 34 }, { fontSize: 24, color: C.blueDark, bold: true });
  addText(
    slide,
    "A privacy-aware fitness assistant for strict pose coaching, Bangladeshi diet planning, calorie review, and progress tracking.",
    { left: 74, top: 248, width: 520, height: 128 },
    { fontSize: 24, color: C.muted }
  );
  addPanel(slide, { left: 690, top: 78, width: 505, height: 438 }, C.panel);
  await addScreenshot(slide, "03-coach.png", { left: 710, top: 98, width: 465, height: 398 }, "Pose Coach product screen");
  addText(slide, "Mindsparks 26 CodeFront Challenge", { left: 74, top: 610, width: 480, height: 30 }, { fontSize: 18, color: C.muted, bold: true });

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Problem");
  addText(slide, "Most fitness demos count movement, not correctness.", { left: 58, top: 118, width: 820, height: 92 }, { fontSize: 46, bold: true });
  addBullets(slide, [
    "Noisy camera landmarks can turn random movement into false reps.",
    "Generic meal plans ignore familiar local foods and serving patterns.",
    "First-time users need a guided path, not a wall of controls."
  ], 70, 260, 720);
  addPanel(slide, { left: 890, top: 170, width: 300, height: 350 }, C.panel2);
  addText(slide, "Product goal", { left: 920, top: 210, width: 230, height: 34 }, { fontSize: 22, bold: true, color: C.blueDark });
  addText(slide, "Prefer strict, explainable guidance over easy but unreliable counting.", { left: 920, top: 268, width: 230, height: 150 }, { fontSize: 25, color: C.ink, bold: true });

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Solution");
  addText(slide, "One coordinated coaching loop", { left: 58, top: 118, width: 640, height: 64 }, { fontSize: 46, bold: true });
  ["Profile", "Coach", "Nutrition", "Progress"].forEach((label, index) => {
    const left = 70 + index * 296;
    addPanel(slide, { left, top: 245, width: 238, height: 190 }, index % 2 === 0 ? C.panel : C.panel2);
    addText(slide, `0${index + 1}`, { left: left + 22, top: 268, width: 60, height: 34 }, { fontSize: 24, bold: true, color: C.blue });
    addText(slide, label, { left: left + 22, top: 318, width: 190, height: 42 }, { fontSize: 28, bold: true });
  });
  addText(slide, "The refreshed UI keeps the next useful action visible while moving secondary detail into tabs and guided demo surfaces.", { left: 70, top: 515, width: 1000, height: 70 }, { fontSize: 24, color: C.muted });

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "UI refresh");
  addText(slide, "A calmer first viewport", { left: 58, top: 112, width: 460, height: 58 }, { fontSize: 44, bold: true });
  addText(slide, "The coach screen now has a compact intro, a dominant camera stage, a slim live readout rail, and hidden secondary tabs.", { left: 62, top: 184, width: 390, height: 122 }, { fontSize: 22, color: C.muted });
  await addScreenshot(slide, "03-coach.png", { left: 500, top: 112, width: 692, height: 442 }, "Redesigned Pose Coach screen");

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Demo sequence");
  addText(slide, "Show it in eight steps", { left: 58, top: 112, width: 540, height: 58 }, { fontSize: 44, bold: true });
  await addScreenshot(slide, "02-demo.png", { left: 520, top: 110, width: 675, height: 430 }, "Demo sequence route");
  addBullets(slide, [
    "Start with onboarding and dashboard context.",
    "Demonstrate strict pose coaching and hidden diagnostics.",
    "Move through exercise guidance, diet, calorie photo review, and progress.",
    "Close on the generated submission package."
  ], 70, 218, 400);

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Pose quality");
  addText(slide, "Strict reps over flattering reps", { left: 58, top: 112, width: 640, height: 60 }, { fontSize: 44, bold: true });
  addBullets(slide, [
    "Confidence gate checks required landmarks before rep logic runs.",
    "Temporal state machine requires top, controlled descent, confirmed depth, ascent, and stable lockout.",
    "Bad distance, jitter, side switching, and incomplete depth pause the count."
  ], 70, 224, 700);
  addPanel(slide, { left: 840, top: 188, width: 300, height: 300 }, C.panel2);
  addText(slide, "Acceptance", { left: 880, top: 230, width: 220, height: 34 }, { fontSize: 22, bold: true, color: C.blueDark });
  addText(slide, "5 valid reps count as 5. Waving, partial crouches, and camera movement count as 0.", { left: 880, top: 292, width: 220, height: 150 }, { fontSize: 24, bold: true });

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Nutrition");
  addText(slide, "Food planning and calorie review", { left: 58, top: 112, width: 620, height: 60 }, { fontSize: 44, bold: true });
  await addScreenshot(slide, "05-diet.png", { left: 62, top: 205, width: 520, height: 330 }, "Diet chart screen");
  await addScreenshot(slide, "06-calorie.png", { left: 652, top: 205, width: 520, height: 330 }, "Calorie check screen");
  addText(slide, "Local meal examples plus cautious AI food estimates keep the product useful beyond the workout camera.", { left: 62, top: 580, width: 930, height: 34 }, { fontSize: 22, color: C.muted });

  slide = deck.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, "Delivery");
  addText(slide, "Submission package", { left: 58, top: 112, width: 540, height: 60 }, { fontSize: 44, bold: true });
  addBullets(slide, [
    "Live website URL: shorir-ai-production.up.railway.app",
    "Demo route and MP4 walkthrough generated from live UI frames.",
    "Project presentation and technical report regenerated from the same sequence.",
    "Complete source ZIP packaged from the current committed workspace."
  ], 70, 222, 780);
  addPanel(slide, { left: 930, top: 180, width: 210, height: 210 }, C.panel2);
  addText(slide, "READY", { left: 966, top: 248, width: 140, height: 42 }, { fontSize: 34, bold: true, color: C.green, alignment: "center" });

  for (const [index, deckSlide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(renderDir, `${stem}.png`), await deck.export({ slide: deckSlide, format: "png", scale: 1 }));
    const layout = await deckSlide.export({ format: "layout" });
    await fs.writeFile(path.join(renderDir, `${stem}.layout.json`), await layout.text());
  }
  await writeBlob(path.join(renderDir, "deck-montage.webp"), await deck.export({ format: "webp", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(pptxPath);
  console.log(`Wrote ${pptxPath}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});

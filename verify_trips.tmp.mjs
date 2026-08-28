import { chromium } from "playwright";

const BASE = "http://localhost:4173";
const shotDir = "/private/tmp/claude-502/-Users-aishvarya-dhansheka-Desktop-careerpassport/7a0d0e9c-c7da-44fc-9b9c-b0705cd48f59/scratchpad/shots";
import fs from "fs";
fs.mkdirSync(shotDir, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: true });
  console.log("shot:", name);
}

async function createJobViaOnboarding(page) {
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: "Create a job" }).first().click();
  await page.waitForURL("**/create-job");
  await page.getByLabel("Role notes").fill(
    "Senior backend engineer, 5–8 years, Bangalore hybrid, ₹45–60L, ownership of payments services, on-call OK"
  );
  await shot(page, "00a_before_generate");
  await page.click("#generate-btn");
  await shot(page, "00b_after_generate_click");
  // wait for analysing spinner to go away and continue to become enabled
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const cont = btns.find((b) => b.textContent?.trim() === "Continue");
    return cont && !cont.disabled;
  }, { timeout: 20000 }).catch(async () => {
    await shot(page, "00c_continue_still_disabled");
    for (let attempt = 0; attempt < 4; attempt++) {
      const missing = await page.locator(".field-missing").allInnerTexts();
      console.log(`MISSING FIELDS (attempt ${attempt}):`, missing);
      if (missing.length === 0) break;
      const missingEls = await page.locator(".field-missing input, .field-missing select, .field-missing textarea").all();
      for (const el of missingEls) {
        const tag = await el.evaluate((n) => n.tagName);
        if (tag === "SELECT") {
          await el.selectOption({ index: 1 }).catch(() => {});
        } else {
          await el.fill("N/A").catch(() => {});
        }
      }
      const missingFields = await page.locator(".field-missing").all();
      for (const field of missingFields) {
        const chips = field.locator("button");
        const n = await chips.count();
        for (let i = 0; i < n; i++) {
          const text = (await chips.nth(i).innerText()).trim();
          if (text && text !== "▾") {
            await chips.nth(i).click().catch(() => {});
            break;
          }
        }
      }
      await page.waitForTimeout(300);
    }
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL("**/role-profile");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL("**/step-2");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL("**/step-3");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.waitForURL(/\/jobs\/[^/]+$/);
  const url = page.url();
  const id = url.split("/jobs/")[1];
  console.log("job id:", id);
  return id;
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
  });
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  const jobId = await createJobViaOnboarding(page);

  await page.goto(`${BASE}/jobs/${jobId}/trips`);
  await page.waitForSelector("text=Create a trip");
  await shot(page, "01_trips_list_empty");

  // --- Manual trip ---
  await page.getByRole("button", { name: "Create a trip" }).click();
  await page.waitForSelector("text=Build manually", { timeout: 5000 }).catch(() => {});
  await shot(page, "02_choice_modal");
  const manualCard = page.locator(".trip-choice-card").filter({ hasNotText: "AI" }).first();
  const cards = await page.locator(".trip-choice-card").all();
  console.log("choice cards found:", cards.length);
  for (const c of cards) console.log("card text:", (await c.innerText()).slice(0, 60));
  // click the first card (manual) - assume manual is not badged AI
  await cards[0].click();
  await page.waitForURL(/\/trips\/[^/]+$/, { timeout: 5000 });
  await page.waitForSelector(".trip-builder-header");
  await shot(page, "03_manual_trip_header");

  // Inspect header structure
  const headerText = await page.locator(".trip-builder-header").innerText();
  console.log("HEADER TEXT:\n", headerText);
  const hasLabelText = await page.locator(".trip-builder-title-row").innerText();
  console.log("TITLE ROW TEXT:", hasLabelText);
  const backBtn = await page.locator(".trip-builder-title-row .jd-back-btn").count();
  console.log("back icon-button count:", backBtn);
  const backLink = await page.locator("text=Back to trips").count();
  console.log("'Back to trips' text link count (should be 0):", backLink);
  const pencilCount = await page.locator(".trip-builder-title-row .editable-field-pencil").count();
  console.log("pencil button count:", pencilCount);

  const colsBox = await page.locator(".trip-builder-columns").boundingBox();
  const leftBox = await page.locator(".trip-builder-col-left").boundingBox();
  const rightBox = await page.locator(".trip-builder-col-right").boundingBox();
  console.log("left col width:", leftBox?.width, "right col width:", rightBox?.width, "ratio:", leftBox && rightBox ? (rightBox.width / leftBox.width).toFixed(2) : "n/a");

  const headerBox = await page.locator(".trip-builder-header").boundingBox();
  console.log("header height:", headerBox?.height);

  // --- Add lever ---
  await page.getByRole("button", { name: "+ Add lever" }).click();
  await shot(page, "04_add_lever_panel");
  const liveCards = await page.locator(".stage-picker-card:not(.disabled-stage-card)").allInnerTexts();
  const disabledCards = await page.locator(".stage-picker-card.disabled-stage-card").allInnerTexts();
  console.log("LIVE (clickable) lever types:", liveCards);
  console.log("DISABLED (greyed) lever types:", disabledCards);

  const tabsBefore = await page.locator(".trip-round-tab.active, .trip-round-tab:not(.trip-round-tab-add)").count();
  await page.locator(".stage-picker-card:not(.disabled-stage-card)").first().click();
  await page.waitForTimeout(300);
  await shot(page, "05_after_add_lever");
  const activeTabText = await page.locator(".trip-round-tab.active").innerText();
  console.log("active tab after adding lever:", activeTabText);

  // --- AI trip ---
  await page.goto(`${BASE}/jobs/${jobId}/trips`);
  await page.getByRole("button", { name: "Create a trip" }).click();
  await page.waitForSelector(".trip-choice-card");
  const aiCard = page.locator(".trip-choice-card-ai");
  await aiCard.click();
  await page.waitForSelector(".ai-build-loader-overlay", { timeout: 5000 }).catch(() => {});
  await shot(page, "06_ai_build_loader");
  await page.waitForURL(/\/trips\/[^/]+$/, { timeout: 20000 });
  await page.waitForSelector(".trip-builder-header");
  await page.waitForTimeout(500);
  await shot(page, "07_ai_trip_header");
  const aiTitle = await page.locator(".trip-builder-title-row h1.jd-title").innerText();
  console.log("AI TRIP TITLE:", aiTitle);

  await browser.close();
})().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  process.exit(1);
});

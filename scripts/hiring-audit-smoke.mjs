import { expect } from "@playwright/test";

export async function runHiringAudit(page, context, errors) {
  const panel = page.locator(".hiring-workspace");
  const open = async (name) => {
    const close = page.getByRole("button", { name: "Close detail panel", exact: true });
    if (await close.isVisible()) await close.click();
    await page.getByRole("button", { name: "Fit View", exact: true }).click();
    await page.locator(".fn-main").getByText(name, { exact: true }).click();
    await expect(panel).toBeVisible();
  };
  await open("Role & hiring settings");
  await panel.getByLabel("Client", { exact: true }).fill("Northstar Labs");
  await panel.getByLabel("Open positions", { exact: true }).fill("3");
  await panel
    .getByRole("button", { name: "Save Role & comp", exact: true })
    .click();
  await expect(
    panel.getByText("Role & comp saved.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/careerpassport-audit-setup.png",
    fullPage: true,
  });
  await open("Private prospect pool");
  await panel
    .getByRole("button", { name: "Load sample sourcing data", exact: true })
    .click();
  await expect(
    panel.getByRole("button", { name: "Riya Kapoor", exact: true }),
  ).toBeVisible();
  await panel.getByRole("tab", { name: "Team leads", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "Sara Khan", exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Riya Kapoor", exact: true }),
  ).toHaveCount(0);
  await panel.getByRole("tab", { name: "My leads", exact: true }).click();
  await panel.getByRole("button", { name: "Riya Kapoor", exact: true }).click();
  await panel.getByRole("tab", { name: "Application", exact: true }).click();
  await panel
    .getByRole("button", {
      name: "Complete application & promote",
      exact: true,
    })
    .click();
  await expect(panel.locator("form :invalid").first()).toBeVisible();
  await panel
    .getByRole("button", { name: "Fill sample answers", exact: true })
    .click();
  await panel
    .getByRole("button", {
      name: "Complete application & promote",
      exact: true,
    })
    .click();
  await expect(
    panel.getByText(/Application completed. Candidate is now in Applied./),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/careerpassport-audit-prospects.png",
    fullPage: true,
  });

  await open("Candidate review");
  await panel.getByRole("button", { name: "Priya Nair", exact: true }).click();
  await panel
    .getByLabel("Move to stage", { exact: true })
    .selectOption("offered");
  await panel
    .getByLabel("Move to status", { exact: true })
    .selectOption("Offer accepted");
  await panel
    .getByRole("button", { name: "Confirm move", exact: true })
    .click();
  await panel
    .getByLabel("Candidate feedback note", { exact: true })
    .fill("Please verify the final offer details.");
  await panel
    .getByLabel("Assign to / mention", { exact: true })
    .selectOption("Demo Recruiter");
  await panel.getByRole("button", { name: "Post note", exact: true }).click();
  await expect(
    panel.getByText("Please verify the final offer details.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/careerpassport-audit-review.png",
    fullPage: true,
  });
  await open("Action on you");
  await panel.getByRole("tab", { name: "Feedback", exact: true }).click();
  await expect(
    panel.getByRole("heading", {
      name: "Please verify the final offer details.",
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Mark done", exact: true }).click();

  await open("Outreach library");
  await panel
    .getByRole("button", { name: "＋ Create template", exact: true })
    .click();
  await panel
    .getByLabel("Template name", { exact: true })
    .fill("Audited email outreach");
  await panel
    .getByRole("button", { name: "✦ Draft demo content", exact: true })
    .click();
  await expect(panel.locator(".hire-template-preview")).toContainText(
    "Northstar Labs",
  );
  await panel
    .getByRole("button", { name: "Save template", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", { name: "Audited email outreach", exact: true }),
  ).toBeVisible();
  await panel.getByRole("tab", { name: "AI call", exact: true }).click();
  await panel
    .getByRole("button", { name: "＋ Create agent", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "✦ Draft demo content", exact: true })
    .click();
  await panel
    .getByLabel("Preview candidate", { exact: true })
    .selectOption("cand-priya");
  await panel
    .getByLabel("Stage scope", { exact: true })
    .selectOption("offered");
  await panel
    .getByRole("button", { name: "Send demo preview", exact: true })
    .click();
  // Missing phone or provisioning is an explicit gate, never a fake successful call.
  await expect(panel.getByRole("alert")).toBeVisible();
  await panel
    .getByRole("button", { name: "Save template", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Provision demo agent", exact: true })
    .click();
  await expect(
    panel.getByText("Provisioned · demo calling enabled", { exact: true }),
  ).toBeVisible();

  await open("Assessment studio");
  await panel
    .getByRole("button", { name: "＋ Generate AI trip", exact: true })
    .click();
  await panel
    .getByLabel("Assessment title", { exact: true })
    .fill("Audited product judgment");
  await panel
    .getByLabel("Assessment target stage", { exact: true })
    .selectOption("applied");
  await panel
    .getByRole("button", { name: "Generate demo assessment", exact: true })
    .click();
  await expect(
    panel.getByText("Hidden answer key", { exact: true }).first(),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Publish and assign", exact: true })
    .click();
  await expect(
    panel.getByText("Published · VIEW ONLY", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByLabel("Step title", { exact: true }).first(),
  ).toBeDisabled();
  await panel.getByRole("tab", { name: "Invite roster", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "Send to candidates", exact: true }),
  ).toBeDisabled();
  await panel
    .getByRole("button", { name: /＋ Add to roster/ })
    .first()
    .click();
  await panel
    .getByRole("button", { name: "Send to candidates", exact: true })
    .click();
  await expect(
    panel.getByText(
      "Invitations sent to selected candidates in the demo outbox.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/careerpassport-audit-assessment.png",
    fullPage: true,
  });
  const newPagePromise = context.waitForEvent("page");
  await panel
    .getByRole("link", { name: "Open candidate link ↗", exact: true })
    .click();
  const candidate = await newPagePromise;
  candidate.on("pageerror", (e) => errors.push(e.message));
  const seriousAnswers = candidate.getByRole("radio", {
    name: "SERIOUS",
    exact: true,
  });
  await expect(seriousAnswers).toHaveCount(8);
  for (const answer of await seriousAnswers.all()) await answer.check();
  await candidate.getByRole("radio", { name: /Validate first/ }).check();
  for (const textarea of await candidate.locator("textarea").all())
    await textarea.fill(
      "I would validate the riskiest assumption and measure the result.",
    );
  await expect(
    candidate.getByText("Hidden answer key", { exact: true }),
  ).toHaveCount(0);
  await expect(
    candidate.getByText("Hidden rubric", { exact: true }),
  ).toHaveCount(0);
  await candidate.screenshot({
    path: "/tmp/careerpassport-audit-candidate.png",
    fullPage: true,
  });
  await candidate
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click();
  await expect(
    candidate.getByRole("heading", {
      name: "Assessment submitted.",
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByRole("tab", { name: "Responses", exact: true }).click();
  await expect(
    panel.getByText(/I would validate the riskiest assumption/).first(),
  ).toBeVisible();

  await open("Hiring team");
  await panel
    .getByRole("button", { name: "Simulate partner request", exact: true })
    .click();
  await panel.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    panel.getByRole("heading", {
      name: "Northstar Talent · Approved",
      exact: true,
    }),
  ).toBeVisible();
  await open("Client coordination");
  await panel
    .getByLabel("Message to client", { exact: true })
    .fill("Sharing this profile for your review.");
  await panel.getByRole("button", { name: "Send", exact: true }).click();
  await panel
    .getByRole("button", { name: "Simulate client reply", exact: true })
    .click();
  await expect(
    panel.getByText("Sharing this profile for your review.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/careerpassport-audit-client.png",
    fullPage: true,
  });
  await open("Activity history");
  await expect(
    panel.getByText("Approved partner access: Northstar Talent", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await open("Role & hiring settings");
  await expect(panel.getByLabel("Client", { exact: true })).toHaveValue(
    "Northstar Labs",
  );
  await open("Assessment studio");
  await expect(
    panel.getByRole("button", { name: /Audited product judgment/ }),
  ).toBeVisible();
  console.log(
    "PASS: audited setup, private/team prospects, promotion gate, review statuses, feedback/tasks, outreach, calling gate, frozen assessment, selected roster, candidate response, team/client history, persistence.",
  );
}

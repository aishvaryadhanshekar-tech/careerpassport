# Assessment B — isolated detector and browser evidence

Read-only audit completed before sharing any findings with Assessment A. Target: src. Detector run once, exit 2 (findings), full JSON `/tmp/impeccable-detect.json`.

## Deterministic scan
12 warnings, 0 reported errors: bounce-easing 2; side-tab 6; border-accent-on-rounded 2; layout-transition 1; overused-font 1.

Locations:
- bounce-easing: src/PublishSuccess.css:27,47.
- side-tab: src/canvasJob/canvas-job.css:218; src/canvasJob/funnel.css:1 (2); src/canvasJob/node-cards.css:192,193; src/hiring/hiring.css:113.
- border-accent-on-rounded: src/canvasJob/funnel.css:1; src/canvasJob/node-cards.css:188.
- layout-transition: src/canvasJob/inspector-resize.css:23.
- overused-font: src/styles/base.css:43.

False positives / contextual exemptions: Inter is incumbent app typography, not a reason to redesign. Colored borders distinguish workflow/activity/trip/configuration types explicitly requested by the user; retain semantics rather than stripping every detected accent. Legacy CSS declarations may be overridden, so these are source matches, not 12 unique visible defects. Resize handle hover-height transition is localized, not evidence of whole-inspector layout thrash. Bounce is a polish/motion issue, not a workflow blocker.

## Browser evidence
No native browser tool exposed. Used an isolated fresh Playwright page. Mutating preflight changed title and appended script successfully. Overlay injection succeeded on 5 representative routes; screenshots `/tmp/impeccable-{jobs,create-job,settings,create-job-canvas,role-profile}-{1512,390}.png`.
Initial console count by route: jobs 9, create-job 1, settings 3, create-job-canvas 13, role-profile 6. Raw console arrays in `/tmp/impeccable-browser.json` include subsequent route messages due accumulating listeners; use only the first message of each route, not the array sum.

Viewed mobile Role Profile screenshot: low-contrast labels Location, WFO/WFH, CTC, Experience, Industry clearly highlighted. Edit Role summary and Edit Requirements buttons measure 24px high; increase touch hit area while retaining compact icon appearance. Requirements/Sourcing Playbook/Evaluation tab strip intentionally scrolls horizontally; ensure keyboard selection/focus follows selected tab.

All inspected app routes report CSS color-scheme light under dark OS preference. Initial apparent overflow on Jobs/new canvas was caused by injected overlay UI. Clean remeasurement confirms 0 page overflow on Jobs and New canvas at both 1512px and390px. Do not file overlay overflow or its unlabeled 21–22px controls as app defects. Create job/settings/Role Profile report 0 overflow even with overlay. No unlabeled visible inputs found on those five initial routes by DOM labels/aria-label/aria-labelledby heuristic (not comprehensive screen-reader certification).

Candidate route error states separately inspected at1512/390, no page overflow and light mode:
- /demo/apply/missing: Application not available; explains same-browser published-role requirement.
- /demo/trip/missing/missing: only Invitation not found. P2: add concise recovery guidance (request a fresh link/check browser), no recruiter navigation for candidate.
- /demo/assessment/missing/missing/missing: explanation exists but lacks a normal page heading. Align invitation unavailable presentation with other candidate routes.
Source review TripAssignmentExperience confirms associated labels, mandatory input constraints, alert errors and response-received state. Application includes labels and role=alert errors. Valid assignment/candidate progression not exercised in this isolated evidence pass; parent regression should exercise seeded valid candidate routes, not claim missing-link pages prove full forms.

## Limits / cleanup
No user-visible browser tab presented: browser was headless, screenshots contain successfully injected overlays but no persistent Human tab exists. Temporary audit server pid22378 port8400 was stopped with kill after CLI stop failed to locate config. Existing app server left running. No UI edits. Questions skipped here: evidence-only subtask; user already requested all UI/IA improvements preserving functionality.

import { describe, expect, it } from "vitest";
import {
  childNeedsScroll,
  contextVisibleInPreview,
  pickActiveAnchor,
  previewTargetId,
  type PreviewAnchor,
} from "./previewScroll";

describe("pickActiveAnchor", () => {
  it("returns the anchor with the highest intersection ratio", () => {
    const ratios = new Map<PreviewAnchor, number>([
      ["company", 0.1],
      ["role", 0.8],
      ["fields", 0.2],
      ["questions", 0],
    ]);
    expect(pickActiveAnchor(ratios)).toBe("role");
  });

  it("returns null when nothing is intersecting", () => {
    const ratios = new Map<PreviewAnchor, number>([
      ["company", 0],
      ["role", 0],
      ["fields", 0],
      ["questions", 0],
    ]);
    expect(pickActiveAnchor(ratios)).toBeNull();
  });
});

describe("previewTargetId", () => {
  it("maps editor anchors to preview element ids", () => {
    expect(
      previewTargetId("company", { company: true, role: true }),
    ).toBe("preview-company");
    expect(previewTargetId("role", { company: true, role: true })).toBe(
      "preview-role",
    );
    expect(previewTargetId("fields", { company: true, role: true })).toBe(
      "preview-fields",
    );
    expect(previewTargetId("questions", { company: true, role: true })).toBe(
      "preview-questions",
    );
  });

  it("falls back to the job header when company or role is not in the preview", () => {
    expect(
      previewTargetId("company", { company: false, role: true }),
    ).toBe("preview-job");
    expect(
      previewTargetId("role", { company: true, role: false }),
    ).toBe("preview-job");
  });

  it("resolves fields and questions to their own ids regardless of company/role visibility", () => {
    // Company/Role/Fields/Questions all render in one continuous scroll (no
    // tabs), so fields/questions must never be gated by company/role state.
    expect(
      previewTargetId("fields", { company: false, role: false }),
    ).toBe("preview-fields");
    expect(
      previewTargetId("questions", { company: false, role: false }),
    ).toBe("preview-questions");
  });
});

describe("contextVisibleInPreview", () => {
  it("is visible only when shown and the copy is non-empty", () => {
    expect(contextVisibleInPreview(true, "Acme")).toBe(true);
    expect(contextVisibleInPreview(true, "  ")).toBe(false);
    expect(contextVisibleInPreview(false, "Acme")).toBe(false);
  });
});

describe("childNeedsScroll", () => {
  const sheet = { top: 100, bottom: 500 };

  it("does not scroll when the child is already fully inside the sheet", () => {
    expect(
      childNeedsScroll(sheet, { top: 140, bottom: 220 }),
    ).toBe(false);
  });

  it("does not scroll when the child is already pinned to the sheet top", () => {
    expect(
      childNeedsScroll(sheet, { top: 100, bottom: 700 }),
    ).toBe(false);
  });

  it("scrolls when the child sits below the visible sheet", () => {
    expect(
      childNeedsScroll(sheet, { top: 560, bottom: 640 }),
    ).toBe(true);
  });

  it("scrolls when the child sits above the visible sheet", () => {
    expect(
      childNeedsScroll(sheet, { top: 20, bottom: 80 }),
    ).toBe(true);
  });
});

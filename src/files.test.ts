import { describe, expect, it } from "vitest";
import { ingestFiles } from "./files";

describe("ingestFiles", () => {
  it("rejects files over 25 MB by name", () => {
    const huge = new File(["x"], "deck.pdf", { type: "application/pdf" });
    Object.defineProperty(huge, "size", { value: 26 * 1024 * 1024 });
    const { accepted, errors } = ingestFiles([huge], 0);
    expect(accepted).toHaveLength(0);
    expect(errors[0]).toContain("deck.pdf");
    expect(errors[0]).toContain("25 MB");
  });
});

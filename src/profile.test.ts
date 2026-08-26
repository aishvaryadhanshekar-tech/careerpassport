import { describe, expect, it } from "vitest";
import { PROFILE, truncateEmail } from "./profile";

describe("PROFILE", () => {
  it("has a display name, email, and initials", () => {
    expect(PROFILE.name).toBe("Alex Smith");
    expect(PROFILE.email).toBe("alexsmith@conte.example");
    expect(PROFILE.initials).toBe("AS");
  });
});

describe("truncateEmail", () => {
  it("shortens a long email with an ellipsis", () => {
    expect(truncateEmail("alexsmith@conte.example")).toBe("alexsmith@conte…");
  });

  it("leaves a short email unchanged", () => {
    expect(truncateEmail("a@b.co")).toBe("a@b.co");
  });
});

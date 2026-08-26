import { describe, expect, it } from "vitest";
import {
  addPoint,
  addTag,
  filterSuggestions,
  joinTags,
  removePoint,
  removeTag,
  splitPoints,
  splitTags,
  withExtraChoice,
} from "./formControlUtils";

describe("splitTags", () => {
  it("splits a comma-separated string and trims blanks", () => {
    expect(splitTags("Bangalore, Mumbai")).toEqual(["Bangalore", "Mumbai"]);
  });

  it("returns an empty list for blank input", () => {
    expect(splitTags("")).toEqual([]);
    expect(splitTags("   ")).toEqual([]);
  });
});

describe("joinTags", () => {
  it("joins tags with a comma and space", () => {
    expect(joinTags(["Bangalore", "Mumbai"])).toBe("Bangalore, Mumbai");
  });

  it("returns an empty string for no tags", () => {
    expect(joinTags([])).toBe("");
  });
});

describe("addTag", () => {
  it("appends a new tag", () => {
    expect(addTag("Bangalore", "Pune")).toBe("Bangalore, Pune");
  });

  it("ignores duplicates case-insensitively", () => {
    expect(addTag("Bangalore", "bangalore")).toBe("Bangalore");
  });

  it("ignores blank tags", () => {
    expect(addTag("Bangalore", "  ")).toBe("Bangalore");
  });
});

describe("removeTag", () => {
  it("removes a matching tag", () => {
    expect(removeTag("Bangalore, Mumbai", "Bangalore")).toBe("Mumbai");
  });
});

describe("filterSuggestions", () => {
  const cities = ["Bangalore", "Mumbai", "Pune"];

  it("filters by query and hides already selected tags", () => {
    expect(filterSuggestions(cities, "ba", ["Mumbai"])).toEqual(["Bangalore"]);
  });

  it("returns remaining suggestions when the query is blank", () => {
    expect(filterSuggestions(cities, "", ["Pune"])).toEqual([
      "Bangalore",
      "Mumbai",
    ]);
  });
});

describe("splitPoints", () => {
  it("splits newline-separated points and trims blanks", () => {
    expect(splitPoints("Payments experience\nOn-call")).toEqual([
      "Payments experience",
      "On-call",
    ]);
  });

  it("falls back to comma-separated tags when there are no newlines", () => {
    expect(splitPoints("Payments, on-call")).toEqual(["Payments", "on-call"]);
  });

  it("keeps commas inside a newline-separated point", () => {
    expect(
      splitPoints("5+ years in payments, on-call\nPython"),
    ).toEqual(["5+ years in payments, on-call", "Python"]);
  });
});

describe("addPoint", () => {
  it("appends a point on a new line", () => {
    expect(addPoint("Payments", "On-call")).toBe("Payments\nOn-call");
  });

  it("ignores duplicates case-insensitively", () => {
    expect(addPoint("Payments", "payments")).toBe("Payments");
  });

  it("ignores blank points", () => {
    expect(addPoint("Payments", "  ")).toBe("Payments");
  });
});

describe("removePoint", () => {
  it("removes a matching point", () => {
    expect(removePoint("Payments\nOn-call", "Payments")).toBe("On-call");
  });
});

describe("withExtraChoice", () => {
  it("appends a captured value that is not in the closed set", () => {
    expect(withExtraChoice(["WFO", "WFH", "Hybrid"], "Remote")).toEqual([
      "WFO",
      "WFH",
      "Hybrid",
      "Remote",
    ]);
  });

  it("does not duplicate a value that already matches an option", () => {
    expect(withExtraChoice(["WFO", "WFH", "Hybrid"], "hybrid")).toEqual([
      "WFO",
      "WFH",
      "Hybrid",
    ]);
  });

  it("leaves the list unchanged when the value is empty", () => {
    expect(withExtraChoice(["WFO"], "")).toEqual(["WFO"]);
    expect(withExtraChoice(["WFO"], null)).toEqual(["WFO"]);
  });
});

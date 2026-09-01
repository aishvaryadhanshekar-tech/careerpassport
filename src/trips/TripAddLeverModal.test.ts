import { describe, expect, it } from "vitest";
import { pickLeverTypes } from "./TripAddLeverModal";

describe("pickLeverTypes", () => {
  it("returns exactly count types, cycling through the live stage types in order", () => {
    expect(pickLeverTypes(1)).toEqual(["rapid_fire"]);
    expect(pickLeverTypes(3)).toEqual(["rapid_fire", "do_a_demo", "pick_and_defend"]);
  });

  it("wraps around once count exceeds the number of live types", () => {
    expect(pickLeverTypes(5)).toEqual([
      "rapid_fire",
      "do_a_demo",
      "pick_and_defend",
      "rapid_fire",
      "do_a_demo",
    ]);
  });

  it("returns an empty array for a non-positive count", () => {
    expect(pickLeverTypes(0)).toEqual([]);
    expect(pickLeverTypes(-1)).toEqual([]);
  });
});

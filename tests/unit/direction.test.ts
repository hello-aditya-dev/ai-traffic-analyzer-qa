/**
 * Unit tests for direction classification.
 * Phase 12 (Direction) — validates all 8 compass points, opposites, wrong-way.
 */
import { describe, it, expect } from "vitest";
import {
  directionFromDelta,
  oppositeDirection,
  isWrongWay,
  type CardinalDirection,
} from "@/lib/direction";

describe("directionFromDelta — 8 compass points", () => {
  const cases: Array<[number, number, CardinalDirection]> = [
    [1, 0, "east"],
    [-1, 0, "west"],
    [0, -1, "north"],   // screen: -y = up = north
    [0, 1, "south"],    // +y = down = south
    [1, -1, "northeast"],
    [-1, -1, "northwest"],
    [1, 1, "southeast"],
    [-1, 1, "southwest"],
  ];
  for (const [dx, dy, expected] of cases) {
    it(`${expected} for dx=${dx} dy=${dy}`, () => {
      expect(directionFromDelta(dx, dy)).toBe(expected);
    });
  }
  it("returns null for zero movement", () => {
    expect(directionFromDelta(0, 0)).toBeNull();
  });
  it("returns null for near-zero movement (epsilon)", () => {
    expect(directionFromDelta(1e-9, 1e-9)).toBeNull();
  });
  it("handles large magnitudes", () => {
    expect(directionFromDelta(1000, 0)).toBe("east");
    expect(directionFromDelta(0, -1000)).toBe("north");
  });
});

describe("oppositeDirection", () => {
  const cases: Array<[CardinalDirection, CardinalDirection]> = [
    ["north", "south"],
    ["south", "north"],
    ["east", "west"],
    ["west", "east"],
    ["northeast", "southwest"],
    ["southwest", "northeast"],
    ["northwest", "southeast"],
    ["southeast", "northwest"],
  ];
  for (const [dir, opp] of cases) {
    it(`opposite of ${dir} is ${opp}`, () => {
      expect(oppositeDirection(dir)).toBe(opp);
    });
  }
});

describe("isWrongWay", () => {
  it("flags the opposite direction as wrong-way", () => {
    expect(isWrongWay("south", "north")).toBe(true);
    expect(isWrongWay("west", "east")).toBe(true);
    expect(isWrongWay("southwest", "northeast")).toBe(true);
  });
  it("does not flag the allowed direction itself", () => {
    expect(isWrongWay("north", "north")).toBe(false);
  });
  it("does not flag perpendicular directions", () => {
    expect(isWrongWay("east", "north")).toBe(false);
    expect(isWrongWay("west", "north")).toBe(false);
  });
});

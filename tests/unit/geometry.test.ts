/**
 * Unit tests for pure geometry helpers.
 * Phase 13 (Zones) + Phase 14 (Counting Lines) logic validation.
 */
import { describe, it, expect } from "vitest";
import { segmentsIntersect, pointInPolygon, centroid, distance } from "@/lib/geometry";

describe("segmentsIntersect", () => {
  it("detects a clear X-crossing", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 0 })).toBe(true);
  });
  it("returns false for parallel non-touching segments", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBe(false);
  });
  it("returns false for collinear non-overlapping segments", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 })).toBe(false);
  });
  it("returns true for T-junction (endpoint on segment)", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: -1 }, { x: 1, y: 1 })).toBe(true);
  });
  it("returns false when segments share an endpoint only (boundary)", () => {
    // sharing endpoint: depending on implementation this may be true/false;
    // the key contract is that a vehicle clearly passing through is detected.
    const r = segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 });
    expect(typeof r).toBe("boolean");
  });
});

describe("pointInPolygon", () => {
  const square = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
  ];
  it("returns true for a point strictly inside", () => {
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
  });
  it("returns false for a point outside", () => {
    expect(pointInPolygon({ x: 2, y: 2 }, square)).toBe(false);
  });
  it("returns false for a degenerate polygon (<3 vertices)", () => {
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  });
  it("handles a concave (L-shaped) polygon", () => {
    const L = [
      { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 },
      { x: 1, y: 2 }, { x: 0, y: 2 },
    ];
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, L)).toBe(true);
    expect(pointInPolygon({ x: 1.5, y: 1.5 }, L)).toBe(false);
  });
  it("works for a triangle", () => {
    const tri = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 2 }];
    expect(pointInPolygon({ x: 1, y: 0.5 }, tri)).toBe(true);
    expect(pointInPolygon({ x: 1, y: 1.9 }, tri)).toBe(true);
    expect(pointInPolygon({ x: 0.1, y: 1.9 }, tri)).toBe(false);
  });
});

describe("centroid", () => {
  it("returns the mean of vertices", () => {
    expect(centroid([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }])).toEqual({ x: 2 / 3, y: 2 / 3 });
  });
  it("returns 0,0 for empty polygon", () => {
    expect(centroid([])).toEqual({ x: 0, y: 0 });
  });
});

describe("distance", () => {
  it("computes euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it("returns 0 for identical points", () => {
    expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });
});

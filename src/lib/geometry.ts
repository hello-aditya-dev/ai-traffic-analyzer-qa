/**
 * Pure geometry helpers used by the analysis engine.
 *
 * Extracted from the mock provider so the geometry contracts (line crossing,
 * point-in-polygon) are independently testable and reusable by future real
 * providers without depending on mock-specific code.
 */

export interface Point {
  x: number;
  y: number;
}

/** Standard segment-intersection test (open intervals). */
export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): boolean {
  const ccw = (a: Point, b: Point, c: Point) =>
    (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/** Ray-casting point-in-polygon. Returns false for degenerate (<3 pt) polygons. */
export function pointInPolygon(p: Point, poly: Point[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const denom = yj - yi + 1e-9;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / denom + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Polygon centroid (arithmetic mean of vertices). */
export function centroid(poly: Point[]): Point {
  if (!poly.length) return { x: 0, y: 0 };
  const sx = poly.reduce((a, p) => a + p.x, 0) / poly.length;
  const sy = poly.reduce((a, p) => a + p.y, 0) / poly.length;
  return { x: sx, y: sy };
}

/** Distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

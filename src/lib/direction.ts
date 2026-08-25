/**
 * Direction classification helpers.
 *
 * Pure functions extracted from the mock provider so the direction contract
 * (8 compass points + opposites + wrong-way detection) is independently
 * testable and reusable by future real providers.
 */

export type CardinalDirection =
  | "north" | "south" | "east" | "west"
  | "northeast" | "northwest" | "southeast" | "southwest";

export type DirectionLabel = CardinalDirection | "inbound" | "outbound";

/**
 * Classify a movement delta into one of 8 compass directions.
 * Screen coordinates: +x = east, +y = south (down). Returns null for
 * near-zero movement.
 */
export function directionFromDelta(dx: number, dy: number): CardinalDirection | null {
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-6) return null;
  // atan2(-dy, dx): 0 = east, 90 = north, 180/-180 = west, -90 = south
  const angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
  const a = (angle + 360) % 360;
  // 8 sectors of 45°
  if (a >= 337.5 || a < 22.5) return "east";
  if (a < 67.5) return "northeast";
  if (a < 112.5) return "north";
  if (a < 157.5) return "northwest";
  if (a < 202.5) return "west";
  if (a < 247.5) return "southwest";
  if (a < 292.5) return "south";
  return "southeast";
}

const OPPOSITES: Record<CardinalDirection, CardinalDirection> = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
  northeast: "southwest",
  southwest: "northeast",
  northwest: "southeast",
  southeast: "northwest",
};

export function oppositeDirection(d: CardinalDirection): CardinalDirection {
  return OPPOSITES[d];
}

/** True if `direction` is the opposite of `allowed` (a wrong-way movement). */
export function isWrongWay(direction: CardinalDirection, allowed: CardinalDirection): boolean {
  return OPPOSITES[direction] === allowed;
}

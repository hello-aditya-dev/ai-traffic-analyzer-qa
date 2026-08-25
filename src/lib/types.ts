/**
 * Shared domain types used across the application and provider layer.
 * These mirror the Prisma models but are provider-agnostic so that the
 * VisionProvider interface never depends on the database layer.
 */

export type VehicleClass =
  | "car"
  | "motorcycle"
  | "truck"
  | "bus"
  | "bicycle"
  | "van";

export type CardinalDirection =
  | "north"
  | "south"
  | "east"
  | "west"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest";

export type DirectionLabel = CardinalDirection | "inbound" | "outbound";

export interface Point {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  objectId: string;
  objectType: VehicleClass;
  confidence: number;
  frameIndex: number;
  timestamp: number; // seconds
  box: BoundingBox;
}

export interface TrackPoint {
  frameIndex: number;
  timestamp: number;
  x: number;
  y: number;
}

export interface VehicleTrack {
  trackId: string;
  objectType: VehicleClass;
  firstSeen: number;
  lastSeen: number;
  averageConfidence: number;
  direction: DirectionLabel;
  trajectory: TrackPoint[];
  startBox: BoundingBox;
  endBox: BoundingBox;
  estimatedSpeed?: number; // km/h (estimated, NOT certified)
  zonesVisited: string[];
  crossedLines: string[];
}

export interface Zone {
  id: string;
  name: string;
  polygon: Point[];
  zoneType: string;
  color: string;
}

export interface CountLine {
  id: string;
  name: string;
  start: Point;
  end: Point;
  inboundLabel: string;
  outboundLabel: string;
  enabled: boolean;
  classes: VehicleClass[];
}

export type RuleType =
  | "COUNT_CROSSING"
  | "ZONE_ENTRY"
  | "ZONE_EXIT"
  | "STOPPED_VEHICLE"
  | "WRONG_WAY"
  | "CONGESTION"
  | "DWELL_TIME";

export type EventType =
  | "count_crossing"
  | "zone_entry"
  | "zone_exit"
  | "stopped_vehicle"
  | "wrong_way"
  | "congestion"
  | "dwell_time";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface TrafficEvent {
  id: string;
  eventType: EventType;
  severity: Severity;
  timestamp: number;
  objectId?: string;
  trackId?: string;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

export interface CongestionSnapshot {
  timestamp: number;
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  occupancy: number;
  activeVehicles: number;
  avgMovement: number;
}

export interface AnalysisResult {
  videoId: string;
  provider: string;
  durationSec: number;
  fps: number;
  width: number;
  height: number;
  detections: Detection[];
  tracks: VehicleTrack[];
  events: TrafficEvent[];
  congestion: CongestionSnapshot[];
  timeSeries: { t: number; count: number; cars: number; motorcycles: number; trucks: number; buses: number }[];
  summary: TrafficSummary;
}

export interface TrafficSummary {
  totalVehicles: number;
  cars: number;
  motorcycles: number;
  trucks: number;
  buses: number;
  bicycles: number;
  vans: number;
  inboundCount: number;
  outboundCount: number;
  peakVolume: number;
  peakVolumeTime: number;
  avgOccupancy: number;
  totalEvents: number;
  congestionLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  directionalBreakdown: Record<string, number>;
  zoneStats: Record<string, ZoneStat>;
}

export interface ZoneStat {
  zoneId: string;
  name: string;
  entered: number;
  exited: number;
  currentInside: number;
  maxOccupancy: number;
  avgOccupancy: number;
  avgDwellSec: number;
  classBreakdown: Record<string, number>;
}

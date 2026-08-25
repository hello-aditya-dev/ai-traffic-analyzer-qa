"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNav } from "../nav-context";
import { useFetch, postJSON } from "../use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SeverityBadge, fmtTime, EmptyState, VEHICLE_COLORS } from "../shared";
import { Play, Pause, SkipBack, SkipForward, Gauge, Video, Loader2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AnalysisDetail {
  analysis: {
    id: string;
    provider: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    video: { id: string; filename: string; duration: number; width: number; height: number; fps: number };
    project: { id: string; name: string; zones: { id: string; name: string; polygon: string; color: string }[]; rules: { id: string; name: string; ruleType: string; parametersJson: string | null }[] };
    events: { id: string; eventType: string; severity: string; timestamp: number; trackId: string | null; metadataJson: string | null }[];
    tracks: { id: string; trackId: string; objectType: string; firstSeen: number; lastSeen: number; averageConfidence: number; startX: number; startY: number; endX: number; endY: number; direction: string; estimatedSpeed: number | null }[];
  };
}

interface ResultData {
  result: {
    tracks: { trackId: string; objectType: string; firstSeen: number; lastSeen: number; averageConfidence: number; direction: string; estimatedSpeed: number | null; trajectory: { frameIndex: number; timestamp: number; x: number; y: number }[]; startBox: { x: number; y: number; width: number; height: number }; endBox: { x: number; y: number; width: number; height: number } }[];
    events: { id: string; eventType: string; severity: string; timestamp: number; trackId: string | null; metadata: Record<string, unknown> | null }[];
    summary: { totalVehicles: number; cars: number; motorcycles: number; trucks: number; buses: number; inboundCount: number; outboundCount: number; peakVolume: number; congestionLevel: string; totalEvents: number };
    congestion: { timestamp: number; level: string; occupancy: number; activeVehicles: number }[];
    timeSeries: { t: number; count: number }[];
    durationSec: number;
  };
}

export function WorkspaceView() {
  const { analysisId, projectId, openAnalysis, navigate } = useNav();
  // Auto-pick the latest analysis if none selected
  const { data: listData } = useFetch<{ analyses: { id: string; project: { id: string }; status: string }[] }>(!analysisId && !projectId ? "/api/analysis?status=COMPLETED" : null);

  useEffect(() => {
    if (!analysisId && listData?.analyses?.length) {
      const completed = listData.analyses.find((a) => a.status === "COMPLETED") ?? listData.analyses[0];
      if (completed) openAnalysis(completed.id, completed.project.id);
    }
  }, [analysisId, listData, openAnalysis]);

  const { data, loading, error } = useFetch<AnalysisDetail>(analysisId ? `/api/analysis/${analysisId}` : null);
  const { data: resultData, refresh } = useFetch<ResultData>(analysisId ? `/api/analysis/${analysisId}/result` : null);

  if (!analysisId) return <EmptyState title="No analysis selected" description="Open a project and run an analysis, or pick one from the Overview." icon={<Video className="h-8 w-8" />} />;
  if (loading) return <Skeleton className="h-[600px] rounded-xl" />;
  if (error) return <EmptyState title="Failed to load analysis" description={error} />;
  if (!data) return null;

  const a = data.analysis;
  const result = resultData?.result;

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{a.project.name}</h2>
            <StatusBadge status={a.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{a.video.filename} · {fmtTime(a.video.duration)} · {a.video.width}×{a.video.height} · {a.video.fps}fps</p>
        </div>
        <div className="flex items-center gap-2">
          {a.status === "QUEUED" && (
            <Button
              size="sm"
              className="gap-2"
              onClick={async () => {
                try {
                  await postJSON(`/api/analysis/${a.id}/start`);
                  toast.success("Analysis started");
                  refresh();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <Sparkles className="h-4 w-4" /> Run Analysis
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("results", { analysisId: a.id, projectId: a.project.id })}>
            View Results
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("reports", { analysisId: a.id, projectId: a.project.id })}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {a.status !== "COMPLETED" ? (
        <EmptyState
          title={a.status === "QUEUED" ? "Analysis queued" : a.status === "PROCESSING" ? "Processing…" : `Status: ${a.status}`}
          description="Run the analysis to populate the workspace with detections, tracks and events."
          icon={<Loader2 className="h-8 w-8 animate-spin" />}
        />
      ) : result ? (
        <VideoViewer analysis={a} result={result} />
      ) : (
        <Skeleton className="h-[500px] rounded-xl" />
      )}
    </div>
  );
}

/* ----------------------------- video viewer ------------------------------ */
function VideoViewer({ analysis, result }: { analysis: AnalysisDetail["analysis"]; result: ResultData["result"] }) {
  const duration = analysis.video.duration;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [overlays, setOverlays] = useState({ boxes: true, tracks: true, zones: true, lines: true, labels: true });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const zones = useMemo(
    () => analysis.project.zones.map((z) => ({ id: z.id, name: z.name, polygon: JSON.parse(z.polygon) as { x: number; y: number }[], color: z.color })),
    [analysis],
  );
  const lines = useMemo(
    () =>
      analysis.project.rules
        .filter((r) => r.ruleType === "COUNT_CROSSING")
        .map((r) => {
          const p = r.parametersJson ? (JSON.parse(r.parametersJson) as Record<string, unknown>) : {};
          return { id: r.id, name: (p.name as string) || r.name, start: p.start as { x: number; y: number }, end: p.end as { x: number; y: number } };
        })
        .filter((l) => l.start && l.end),
    [analysis],
  );
  const events = result.events;
  const tracks = result.tracks;

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        const next = t + dt * speed;
        return next >= duration ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [playing, speed, duration]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    // Background: road scene
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Grass / sidewalk margins
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H * 0.32);
    ctx.fillRect(0, H * 0.68, W, H * 0.32);

    // Road (horizontal)
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, H * 0.32, W, H * 0.36);
    // Road (vertical)
    ctx.fillRect(W * 0.42, 0, W * 0.16, H);

    // Lane markings
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([14, 14]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.5);
    ctx.lineTo(W * 0.42, H * 0.5);
    ctx.moveTo(W * 0.58, H * 0.5);
    ctx.lineTo(W, H * 0.5);
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.5, H * 0.32);
    ctx.moveTo(W * 0.5, H * 0.68);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosswalks
    ctx.fillStyle = "#475569";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(W * 0.42 + i * 4, H * 0.3, 2, H * 0.02);
      ctx.fillRect(W * 0.42 + i * 4, H * 0.68, 2, H * 0.02);
    }

    // Zones
    if (overlays.zones) {
      for (const z of zones) {
        ctx.beginPath();
        z.polygon.forEach((p, i) => {
          const x = p.x * W;
          const y = p.y * H;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = z.color + "22";
        ctx.fill();
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        // label
        const first = z.polygon[0];
        ctx.fillStyle = z.color;
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillText(z.name, first.x * W + 6, first.y * H + 16);
      }
    }

    // Lines
    if (overlays.lines) {
      for (const l of lines) {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(l.start.x * W, l.start.y * H);
        ctx.lineTo(l.end.x * W, l.end.y * H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#22d3ee";
        ctx.font = "600 10px Inter, sans-serif";
        ctx.fillText(l.name, l.start.x * W + 6, l.start.y * H - 4);
      }
    }

    // Active tracks at current time
    const active = tracks.filter((t) => t.firstSeen <= time && t.lastSeen >= time);
    for (const t of active) {
      // interpolate position along trajectory
      const pos = interpolate(t, time);
      if (!pos) continue;
      const x = pos.x * W;
      const y = pos.y * H;
      const w = (t.endBox.width || 0.06) * W;
      const h = (t.endBox.height || 0.045) * H;
      const color = VEHICLE_COLORS[t.objectType] ?? "#64748b";

      if (overlays.boxes) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        ctx.fillStyle = color + "22";
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
      }
      if (overlays.labels) {
        ctx.fillStyle = color;
        ctx.fillRect(x - w / 2, y - h / 2 - 16, 64, 14);
        ctx.fillStyle = "#fff";
        ctx.font = "600 9px JetBrains Mono, monospace";
        ctx.fillText(`${t.trackId} ${t.objectType}`, x - w / 2 + 3, y - h / 2 - 5);
      }
      if (overlays.tracks && t.trajectory.length > 1) {
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        t.trajectory.forEach((tp, i) => {
          if (tp.timestamp > time) return;
          const px = tp.x * W;
          const py = tp.y * H;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
    }

    // Selected event marker
    if (selectedEventId) {
      const ev = events.find((e) => e.id === selectedEventId);
      if (ev && Math.abs(ev.timestamp - time) < 1) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.strokeRect(W * 0.35, H * 0.35, W * 0.3, H * 0.3);
      }
    }

    // Time overlay
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W - 110, 10, 100, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "600 12px JetBrains Mono, monospace";
    ctx.fillText(fmtTime(time) + " / " + fmtTime(duration), W - 100, 26);
  }, [time, overlays, zones, lines, tracks, events, selectedEventId, duration]);

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const currentEventIndex = sortedEvents.findIndex((e) => e.id === selectedEventId);

  function seekToEvent(dir: 1 | -1) {
    if (!sortedEvents.length) return;
    let idx = currentEventIndex;
    if (idx === -1) idx = dir === 1 ? 0 : sortedEvents.length - 1;
    else idx = (idx + dir + sortedEvents.length) % sortedEvents.length;
    const ev = sortedEvents[idx];
    setSelectedEventId(ev.id);
    setTime(ev.timestamp);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {/* Canvas viewer */}
        <Card className="overflow-hidden p-0">
          <div className="relative bg-slate-950">
            <canvas ref={canvasRef} width={1280} height={720} className="block aspect-video w-full" />
          </div>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 border-t p-3">
            <Button size="icon" variant="outline" onClick={() => seekToEvent(-1)} title="Previous event">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => setPlaying((p) => !p)} title={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => seekToEvent(1)} title="Next event">
              <SkipForward className="h-4 w-4" />
            </Button>
            <div className="flex flex-1 items-center gap-3">
              <span className="font-mono text-xs tabular-nums">{fmtTime(time)}</span>
              <Slider value={[time]} min={0} max={duration} step={0.1} onValueChange={(v) => setTime(v[0])} className="flex-1" />
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{fmtTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div className="flex overflow-hidden rounded-md border">
                {[0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 text-xs font-medium ${speed === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Overlay toggles */}
          <div className="flex flex-wrap items-center gap-4 border-t bg-muted/30 px-3 py-2">
            {([
              ["boxes", "Bounding boxes"],
              ["tracks", "Trajectories"],
              ["zones", "Zones"],
              ["lines", "Count lines"],
              ["labels", "Labels"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <Switch id={key} checked={overlays[key]} onCheckedChange={(v) => setOverlays({ ...overlays, [key]: v })} />
                <Label htmlFor={key} className="text-xs">{label}</Label>
              </div>
            ))}
          </div>
        </Card>

        {/* Event timeline strip */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-12 rounded-lg bg-muted">
              {sortedEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setTime(e.timestamp);
                  }}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${(e.timestamp / duration) * 100}%` }}
                  title={`${e.eventType} @ ${fmtTime(e.timestamp)}`}
                >
                  <span className={`block h-3 w-3 rounded-full border-2 border-background ${severityColor(e.severity)}`} />
                </button>
              ))}
              <div className="absolute top-0 h-full w-0.5 bg-primary" style={{ left: `${(time / duration) * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0:00</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event detail / list */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Events ({sortedEvents.length})</CardTitle>
        </CardHeader>
        <CardContent className="scroll-thin max-h-[560px] flex-1 overflow-y-auto p-2">
          <div className="space-y-1.5">
            {sortedEvents.length === 0 && <EmptyState title="No events detected" />}
            {sortedEvents.map((e) => {
              const meta = e.metadata ? (e.metadata as Record<string, unknown>) : {};
              const active = selectedEventId === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setTime(e.timestamp);
                  }}
                  className={`block w-full rounded-lg border p-2.5 text-left transition-colors ${active ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold capitalize">{e.eventType.replace(/_/g, " ")}</span>
                    <SeverityBadge severity={e.severity} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">{fmtTime(e.timestamp)}</span>
                    {e.trackId && <span className="font-mono">{e.trackId}</span>}
                  </div>
                  {Object.keys(meta).length > 0 && (
                    <div className="mt-1.5 truncate text-[10px] text-muted-foreground">
                      {Object.entries(meta).slice(0, 2).map(([k, v]) => (
                        <span key={k} className="mr-2">{k}: {String(v).slice(0, 20)}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function interpolate(t: ResultData["result"]["tracks"][number], time: number) {
  const traj = t.trajectory;
  if (!traj.length) return null;
  if (time <= traj[0].timestamp) return traj[0];
  if (time >= traj[traj.length - 1].timestamp) return traj[traj.length - 1];
  for (let i = 1; i < traj.length; i++) {
    if (traj[i].timestamp >= time) {
      const a = traj[i - 1];
      const b = traj[i];
      const f = (time - a.timestamp) / Math.max(0.0001, b.timestamp - a.timestamp);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
  }
  return traj[traj.length - 1];
}

function severityColor(sev: string): string {
  switch (sev) {
    case "critical": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-amber-500";
    case "low": return "bg-emerald-500";
    default: return "bg-sky-500";
  }
}

void Badge;

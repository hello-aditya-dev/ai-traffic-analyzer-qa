"use client";

import { useEffect, useRef, useState } from "react";
import { useNav } from "../nav-context";
import { useFetch, postJSON, patchJSON, delJSON } from "../use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared";
import { Spline, Plus, Trash2, Save, Undo2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectData {
  project: {
    id: string;
    name: string;
    zones: { id: string; name: string; polygon: string; zoneType: string; color: string }[];
  };
}

interface ProjectList {
  projects: { id: string; name: string }[];
}

const ZONE_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#6366f1"];
const ZONE_TYPES = ["zone", "lane", "entrance", "intersection", "restricted", "parking", "loading"];

export function ZonesView() {
  const { projectId, openProject } = useNav();
  const { data: projectList } = useFetch<ProjectList>("/api/projects");

  // Auto-select first project if none chosen
  useEffect(() => {
    if (!projectId && projectList?.projects?.length) {
      openProject(projectList.projects[0].id, "zones");
    }
  }, [projectId, projectList, openProject]);

  const { data, loading, refresh } = useFetch<ProjectData>(projectId ? `/api/projects/${projectId}` : null);

  if (!projectId) return <EmptyState title="No project selected" description="Open a project to edit its zones." icon={<Spline className="h-8 w-8" />} />;
  if (loading) return <Skeleton className="h-[600px] rounded-xl" />;
  if (!data) return null;

  return <ZoneEditor key={data.project.id} project={data.project} onSaved={refresh} />;
}

function ZoneEditor({ project, onSaved }: { project: ProjectData["project"]; onSaved: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(ZONE_COLORS[0]);
  const [zoneType, setZoneType] = useState("zone");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    // road
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, H * 0.32, W, H * 0.36);
    ctx.fillRect(W * 0.42, 0, W * 0.16, H);
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([14, 14]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.5);
    ctx.lineTo(W, H * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // existing zones
    for (const z of project.zones) {
      const poly = JSON.parse(z.polygon) as { x: number; y: number }[];
      const isSelected = selectedZone === z.id;
      ctx.beginPath();
      poly.forEach((p, i) => {
        const x = p.x * W;
        const y = p.y * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = z.color + (isSelected ? "55" : "22");
      ctx.fill();
      ctx.strokeStyle = z.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = z.color;
      ctx.font = "600 12px Inter, sans-serif";
      const c = centroid(poly);
      ctx.fillText(z.name, c.x * W - 30, c.y * H);
      // vertices
      ctx.fillStyle = z.color;
      poly.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // in-progress polygon
    if (points.length) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color + "33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = p.x * W;
        const y = p.y * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      if (points.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      points.forEach((p) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 9px JetBrains Mono, monospace";
      });
    }
  }

  useEffect(() => {
    draw();
  }, [points, color, project.zones, selectedZone]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPoints((p) => [...p, { x, y }]);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Zone name is required");
      return;
    }
    if (points.length < 3) {
      toast.error("Draw at least 3 points to form a polygon");
      return;
    }
    setSaving(true);
    try {
      await postJSON(`/api/projects/${project.id}/zones`, { name, polygon: points, zoneType, color });
      toast.success("Zone saved");
      setPoints([]);
      setName("");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeZone(id: string) {
    if (!confirm("Delete this zone?")) return;
    try {
      await delJSON(`/api/zones/${id}`);
      toast.success("Zone deleted");
      setSelectedZone(null);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden p-0">
        <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Click on the scene to add polygon vertices. Minimum 3 points to save. Coordinates are normalized (0–1).
        </div>
        <div className="bg-slate-950">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onClick={handleClick}
            className="block aspect-video w-full cursor-crosshair"
          />
        </div>
        {points.length > 0 && (
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-xs text-muted-foreground">{points.length} points · click to add more</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setPoints((p) => p.slice(0, -1))}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPoints([])}>Clear</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="zname">Zone name</Label>
              <Input id="zname" placeholder="e.g. Main Intersection" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={zoneType} onValueChange={setZoneType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ZONE_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Zone ({points.length} pts)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Zones ({project.zones.length})</CardTitle>
          </CardHeader>
          <CardContent className="scroll-thin max-h-[300px] space-y-1.5 overflow-y-auto p-2">
            {project.zones.length === 0 && <EmptyState title="No zones yet" description="Draw a polygon on the scene." />}
            {project.zones.map((z) => (
              <div
                key={z.id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${selectedZone === z.id ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                onMouseEnter={() => setSelectedZone(z.id)}
                onMouseLeave={() => setSelectedZone(null)}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: z.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{z.name}</div>
                  <div className="text-[10px] capitalize text-muted-foreground">{z.zoneType}</div>
                </div>
                <button onClick={() => removeZone(z.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function centroid(poly: { x: number; y: number }[]) {
  const sx = poly.reduce((a, p) => a + p.x, 0) / poly.length;
  const sy = poly.reduce((a, p) => a + p.y, 0) / poly.length;
  return { x: sx, y: sy };
}

void Plus; void MapPin; void patchJSON;

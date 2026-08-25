"use client";

import { useEffect, useRef, useState } from "react";
import { useNav } from "../nav-context";
import { useFetch, postJSON, delJSON } from "../use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared";
import { PenTool, Trash2, Save, Undo2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectData {
  project: {
    id: string;
    name: string;
    rules: { id: string; name: string; ruleType: string; parametersJson: string | null; enabled: boolean }[];
  };
}
interface ProjectList {
  projects: { id: string; name: string }[];
}

export function LinesView() {
  const { projectId, openProject } = useNav();
  const { data: projectList } = useFetch<ProjectList>("/api/projects");

  useEffect(() => {
    if (!projectId && projectList?.projects?.length) openProject(projectList.projects[0].id, "lines");
  }, [projectId, projectList, openProject]);

  const { data, loading, refresh } = useFetch<ProjectData>(projectId ? `/api/projects/${projectId}` : null);

  if (!projectId) return <EmptyState title="No project selected" description="Open a project to edit counting lines." icon={<PenTool className="h-8 w-8" />} />;
  if (loading) return <Skeleton className="h-[600px] rounded-xl" />;
  if (!data) return null;

  return <LineEditor key={data.project.id} project={data.project} onSaved={refresh} />;
}

function LineEditor({ project, onSaved }: { project: ProjectData["project"]; onSaved: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [name, setName] = useState("");
  const [inbound, setInbound] = useState("Inbound");
  const [outbound, setOutbound] = useState("Outbound");
  const [saving, setSaving] = useState(false);

  const lines = project.rules
    .filter((r) => r.ruleType === "COUNT_CROSSING")
    .map((r) => {
      const p = r.parametersJson ? (JSON.parse(r.parametersJson) as Record<string, unknown>) : {};
      return { id: r.id, name: (p.name as string) || r.name, start: p.start as { x: number; y: number }, end: p.end as { x: number; y: number }, inboundLabel: p.inboundLabel as string, outboundLabel: p.outboundLabel as string };
    });

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
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

    // existing lines
    for (const l of lines) {
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(l.start.x * W, l.start.y * H);
      ctx.lineTo(l.end.x * W, l.end.y * H);
      ctx.stroke();
      ctx.setLineDash([]);
      // direction arrow
      const mid = { x: (l.start.x + l.end.x) / 2, y: (l.start.y + l.end.y) / 2 };
      ctx.fillStyle = "#22d3ee";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText(l.name, mid.x * W + 8, mid.y * H - 6);
      ctx.beginPath();
      ctx.arc(l.start.x * W, l.start.y * H, 5, 0, Math.PI * 2);
      ctx.arc(l.end.x * W, l.end.y * H, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // in-progress
    if (pts.length) {
      ctx.fillStyle = "#22d3ee";
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      if (pts.length === 2) {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x * W, pts[0].y * H);
        ctx.lineTo(pts[1].x * W, pts[1].y * H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  useEffect(() => {
    draw();
  }, [pts, lines]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (pts.length >= 2) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPts((p) => [...p, { x, y }]);
  }

  async function save() {
    if (!name.trim()) return toast.error("Line name is required");
    if (pts.length !== 2) return toast.error("Click two points to define the line");
    setSaving(true);
    try {
      await postJSON(`/api/projects/${project.id}/rules`, {
        name,
        ruleType: "COUNT_CROSSING",
        parameters: { name, start: pts[0], end: pts[1], inboundLabel: inbound, outboundLabel: outbound, classes: ["car", "motorcycle", "truck", "bus", "van"] },
        enabled: true,
      });
      toast.success("Counting line saved");
      setPts([]);
      setName("");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this counting line?")) return;
    try {
      await delJSON(`/api/rules/${id}`);
      toast.success("Line deleted");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden p-0">
        <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Click two points on the scene to draw a counting line. A tracked vehicle crossing it generates an event.
        </div>
        <div className="bg-slate-950">
          <canvas ref={canvasRef} width={1280} height={720} onClick={handleClick} className="block aspect-video w-full cursor-crosshair" />
        </div>
        {pts.length > 0 && (
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-xs text-muted-foreground">{pts.length}/2 points selected</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setPts((p) => p.slice(0, -1))}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPts([])}>Clear</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Counting Line</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lname">Line name</Label>
              <Input id="lname" placeholder="e.g. East-West Count Line" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="in">Inbound label</Label>
                <Input id="in" value={inbound} onChange={(e) => setInbound(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="out">Outbound label</Label>
                <Input id="out" value={outbound} onChange={(e) => setOutbound(e.target.value)} />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Line
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Lines ({lines.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {lines.length === 0 && <EmptyState title="No counting lines" description="Draw a line to start counting." />}
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2">
                <span className="h-3 w-3 shrink-0 rounded-full bg-cyan-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{l.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{l.inboundLabel} · {l.outboundLabel}</div>
                </div>
                <button onClick={() => remove(l.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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

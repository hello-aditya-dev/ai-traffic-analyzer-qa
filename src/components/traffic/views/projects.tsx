"use client";

import { useState } from "react";
import { useFetch, postJSON, delJSON } from "../use-fetch";
import { useNav } from "../nav-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, fmtDate, EmptyState } from "../shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FolderKanban, Plus, MapPin, Video, BarChart3, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectList {
  projects: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { videos: number; analyses: number };
  }[];
}

export function ProjectsView() {
  const { data, loading, refresh } = useFetch<ProjectList>("/api/projects");
  const { openProject } = useNav();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", location: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await postJSON<{ project: { id: string } }>("/api/projects", form);
      toast.success("Project created");
      setCreating(false);
      setForm({ name: "", description: "", location: "" });
      refresh();
      openProject(res.project.id, "workspace");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This removes all its videos, analyses and events.`)) return;
    try {
      await delJSON(`/api/projects/${id}`);
      toast.success("Project deleted");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading) return <SkeletonGrid />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analysis Projects</h2>
          <p className="text-sm text-muted-foreground">Organize traffic video analyses by location or study.</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Analysis Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Project name</Label>
                <Input id="name" placeholder="e.g. Central Ave & 5th St Survey" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Downtown, City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="What is this study for?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={submit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!data || data.projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first analysis project to upload video and run traffic analysis."
          icon={<FolderKanban className="h-8 w-8" />}
          action={<Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((p) => (
            <Card key={p.id} className="group relative overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    {p.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(p.id, p.name)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {p.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {p._count.videos} videos</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {p._count.analyses} analyses</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Updated {fmtDate(p.updatedAt)}</span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openProject(p.id, "workspace")}>
                    Open <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

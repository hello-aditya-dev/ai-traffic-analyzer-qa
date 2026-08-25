"use client";

import { useFetch } from "../use-fetch";
import { useNav } from "../nav-context";
import { KpiCard, StatusBadge, SeverityBadge, fmtDate, EmptyState } from "../shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { FolderKanban, Video, BarChart3, AlertTriangle, Cpu, Play, ArrowRight, Car } from "lucide-react";

interface OverviewData {
  counts: { projects: number; videos: number; analyses: number; completedAnalyses: number; events: number; tracks: number };
  classCounts: Record<string, number>;
  dirCounts: Record<string, number>;
  eventCounts: Record<string, number>;
  recentAnalyses: { id: string; provider: string; status: string; startedAt: string; project: { id: string; name: string }; video: { id: string; filename: string } }[];
  recentEvents: { id: string; eventType: string; severity: string; timestamp: number; analysis: { project: { id: string; name: string } } }[];
}

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#10b981", "#6366f1"];

export function OverviewView() {
  const { data, loading, error } = useFetch<OverviewData>("/api/stats/overview");
  const { navigate, openAnalysis } = useNav();

  if (loading) return <SkeletonGrid />;
  if (error) return <EmptyState title="Failed to load overview" description={error} />;
  if (!data) return null;

  const classData = Object.entries(data.classCounts).map(([name, value]) => ({ name, value }));
  const dirData = Object.entries(data.dirCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Projects" value={data.counts.projects} icon={<FolderKanban className="h-4 w-4" />} hint={`${data.counts.completedAnalyses} analyses done`} />
        <KpiCard label="Videos" value={data.counts.videos} icon={<Video className="h-4 w-4" />} />
        <KpiCard label="Analyses" value={data.counts.analyses} icon={<BarChart3 className="h-4 w-4" />} hint={`${data.counts.completedAnalyses} completed`} />
        <KpiCard label="Tracks" value={data.counts.tracks} icon={<Car className="h-4 w-4" />} />
        <KpiCard label="Events" value={data.counts.events} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Provider" value={<span className="text-base">mock</span>} icon={<Cpu className="h-4 w-4" />} hint="demo mode" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vehicle Classification</CardTitle>
          </CardHeader>
          <CardContent>
            {classData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {classData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No vehicle data yet" description="Run an analysis to populate classification." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Directional Flow</CardTitle>
          </CardHeader>
          <CardContent>
            {dirData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dirData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No directional data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Recent Analyses</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("projects")}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.recentAnalyses.length === 0 && <EmptyState title="No analyses yet" description="Create a project and upload a video to begin." />}
              {data.recentAnalyses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAnalysis(a.id, a.project.id)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.project.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.video.filename}</div>
                  </div>
                  <StatusBadge status={a.status} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{fmtDate(a.startedAt)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="scroll-thin max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {data.recentEvents.length === 0 && <EmptyState title="No events" />}
              {data.recentEvents.map((e) => (
                <div key={e.id} className="rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize">{e.eventType.replace(/_/g, " ")}</span>
                    <SeverityBadge severity={e.severity} />
                  </div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">{e.analysis.project.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickAction icon={<Play className="h-5 w-5" />} title="Try Demo Mode" desc="Pre-loaded sample project" onClick={() => navigate("demo")} />
            <QuickAction icon={<FolderKanban className="h-5 w-5" />} title="New Project" desc="Create an analysis project" onClick={() => navigate("projects")} />
            <QuickAction icon={<Cpu className="h-5 w-5" />} title="Configure Provider" desc="Connect an AI vision API" onClick={() => navigate("settings")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

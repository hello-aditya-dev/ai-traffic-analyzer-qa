"use client";

import { useMemo, useState } from "react";
import { useNav } from "../nav-context";
import { useFetch } from "../use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge, EmptyState, fmtTime, VEHICLE_COLORS } from "../shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search } from "lucide-react";

interface AnalysisDetail {
  analysis: {
    id: string;
    events: { id: string; eventType: string; severity: string; timestamp: number; trackId: string | null; objectId: string | null; metadataJson: string | null }[];
    project: { name: string };
  };
}

export function EventsView() {
  const { analysisId, navigate } = useNav();
  const { data, loading } = useFetch<AnalysisDetail>(analysisId ? `/api/analysis/${analysisId}` : null);
  const [filterType, setFilterType] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [search, setSearch] = useState("");

  const events = useMemo(() => {
    if (!data) return [];
    return data.analysis.events
      .filter((e) => filterType === "all" || e.eventType === filterType)
      .filter((e) => filterSev === "all" || e.severity === filterSev)
      .filter((e) => !search || e.trackId?.toLowerCase().includes(search.toLowerCase()) || e.eventType.includes(search.toLowerCase()));
  }, [data, filterType, filterSev, search]);

  if (!analysisId) return <EmptyState title="No analysis selected" description="Open an analysis to view its events." icon={<AlertTriangle className="h-8 w-8" />} />;
  if (loading) return <Skeleton className="h-[500px] rounded-xl" />;
  if (!data) return null;

  const types = Array.from(new Set(data.analysis.events.map((e) => e.eventType)));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">Events Timeline ({events.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search track / type…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-44 pl-7 text-xs" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSev} onValueChange={setFilterSev}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {["info", "low", "medium", "high", "critical"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState title="No events match your filters" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 200).map((e) => {
                  const meta = e.metadataJson ? (JSON.parse(e.metadataJson) as Record<string, unknown>) : {};
                  return (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => navigate("workspace", { analysisId })}>
                      <TableCell className="font-mono text-xs">{fmtTime(e.timestamp)}</TableCell>
                      <TableCell className="text-xs font-medium capitalize">{e.eventType.replace(/_/g, " ")}</TableCell>
                      <TableCell><SeverityBadge severity={e.severity} /></TableCell>
                      <TableCell className="font-mono text-xs">{e.trackId ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {Object.entries(meta).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: {String(v).slice(0, 24)}</span>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {events.length > 200 && <p className="mt-3 text-center text-xs text-muted-foreground">Showing first 200 of {events.length} events</p>}
        </CardContent>
      </Card>
    </div>
  );
}

void VEHICLE_COLORS;

"use client";

import { useNav } from "../nav-context";
import { useFetch } from "../use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard, EmptyState, CongestionBadge, VEHICLE_COLORS, fmtTime } from "../shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, Car, Bike, Truck, Bus, Gauge, ArrowRightLeft, Layers } from "lucide-react";

interface ResultData {
  result: {
    tracks: { trackId: string; objectType: string; firstSeen: number; lastSeen: number; direction: string; estimatedSpeed: number | null }[];
    summary: {
      totalVehicles: number; cars: number; motorcycles: number; trucks: number; buses: number; bicycles: number; vans: number;
      inboundCount: number; outboundCount: number; peakVolume: number; peakVolumeTime: number; avgOccupancy: number;
      congestionLevel: string; totalEvents: number; directionalBreakdown: Record<string, number>;
      zoneStats: Record<string, { name: string; entered: number; exited: number; currentInside: number; maxOccupancy: number; avgDwellSec: number; classBreakdown: Record<string, number> }>;
    };
    congestion: { timestamp: number; level: string; occupancy: number; activeVehicles: number }[];
    timeSeries: { t: number; count: number; cars: number; motorcycles: number; trucks: number; buses: number }[];
  };
}

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#10b981", "#6366f1"];

export function ResultsView() {
  const { analysisId } = useNav();
  const { data, loading, error } = useFetch<ResultData>(analysisId ? `/api/analysis/${analysisId}/result` : null);

  if (!analysisId) return <EmptyState title="No analysis selected" description="Open an analysis from the workspace or overview." icon={<BarChart3 className="h-8 w-8" />} />;
  if (loading) return <Skeleton className="h-[600px] rounded-xl" />;
  if (error) return <EmptyState title="Failed to load results" description={error} />;
  if (!data) return null;

  const s = data.result.summary;
  const classData = [
    { name: "Cars", value: s.cars, color: VEHICLE_COLORS.car },
    { name: "Motorcycles", value: s.motorcycles, color: VEHICLE_COLORS.motorcycle },
    { name: "Trucks", value: s.trucks, color: VEHICLE_COLORS.truck },
    { name: "Buses", value: s.buses, color: VEHICLE_COLORS.bus },
    { name: "Bicycles", value: s.bicycles, color: VEHICLE_COLORS.bicycle },
    { name: "Vans", value: s.vans, color: VEHICLE_COLORS.van },
  ].filter((d) => d.value > 0);

  const dirData = Object.entries(s.directionalBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.toUpperCase(), value }));

  const zoneRows = Object.values(s.zoneStats);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <KpiCard label="Total Vehicles" value={s.totalVehicles} icon={<Car className="h-4 w-4" />} />
        <KpiCard label="Peak Volume" value={s.peakVolume} hint={`at ${fmtTime(s.peakVolumeTime)}`} icon={<Layers className="h-4 w-4" />} />
        <KpiCard label="Inbound" value={s.inboundCount} icon={<ArrowRightLeft className="h-4 w-4" />} />
        <KpiCard label="Outbound" value={s.outboundCount} icon={<ArrowRightLeft className="h-4 w-4" />} />
        <KpiCard label="Avg Occupancy" value={`${(s.avgOccupancy * 100).toFixed(0)}%`} icon={<Gauge className="h-4 w-4" />} />
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Congestion</span>
          <div className="mt-2"><CongestionBadge level={s.congestionLevel} /></div>
          <div className="mt-1 text-xs text-muted-foreground">{s.totalEvents} events</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Traffic Volume Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.result.timeSeries}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtTime(v)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => fmtTime(Number(v))} />
                <Area type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} fill="url(#grad)" name="Vehicles" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Vehicle Classification</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={classData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={(e) => e.name}>
                  {classData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Directional Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dirData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Congestion Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.result.congestion}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtTime(v)} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip labelFormatter={(v) => fmtTime(Number(v))} formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                <Area type="stepAfter" dataKey="occupancy" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b33" name="Occupancy" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zone stats table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Zone Statistics</CardTitle></CardHeader>
        <CardContent>
          {zoneRows.length === 0 ? (
            <EmptyState title="No zones configured" description="Add zones in the Zone Editor to see occupancy metrics." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Entered</TableHead>
                  <TableHead className="text-right">Exited</TableHead>
                  <TableHead className="text-right">Inside</TableHead>
                  <TableHead className="text-right">Max Occ.</TableHead>
                  <TableHead className="text-right">Avg Dwell</TableHead>
                  <TableHead>Class breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zoneRows.map((z) => (
                  <TableRow key={z.name}>
                    <TableCell className="font-medium">{z.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.entered}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.exited}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.currentInside}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.maxOccupancy}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.avgDwellSec.toFixed(1)}s</TableCell>
                    <TableCell className="text-xs">
                      {Object.entries(z.classBreakdown).map(([k, v]) => (
                        <span key={k} className="mr-2 inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ background: VEHICLE_COLORS[k] ?? "#64748b" }} />
                          {k}: {v}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tracks sample */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Tracks (sample)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>First seen</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Est. speed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.result.tracks.slice(0, 12).map((t) => (
                <TableRow key={t.trackId}>
                  <TableCell className="font-mono text-xs">{t.trackId}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: VEHICLE_COLORS[t.objectType] ?? "#64748b" }} />
                      {t.objectType}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{fmtTime(t.firstSeen)}</TableCell>
                  <TableCell className="font-mono text-xs">{fmtTime(t.lastSeen)}</TableCell>
                  <TableCell className="text-xs uppercase">{t.direction}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.estimatedSpeed ? `${t.estimatedSpeed} km/h` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

void Bike; void Truck; void Bus;

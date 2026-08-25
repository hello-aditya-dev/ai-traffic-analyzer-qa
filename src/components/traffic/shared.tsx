"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/* ---------------------------- Status helpers ----------------------------- */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    COMPLETED: "default",
    PROCESSING: "secondary",
    QUEUED: "outline",
    FAILED: "destructive",
    CANCELLED: "outline",
    READY: "secondary",
  };
  return <Badge variant={map[status] ?? "outline"} className="font-mono text-[10px] tracking-wide">{status}</Badge>;
}

/* ------------------------------ KPI card --------------------------------- */
export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className={cn("text-muted-foreground", accent)}>{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* ----------------------------- Severity badge ---------------------------- */
const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info)}>
      {severity}
    </span>
  );
}

/* --------------------------- Congestion badge ---------------------------- */
const CONGESTION_STYLES: Record<string, string> = {
  LOW: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  MODERATE: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  HIGH: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  SEVERE: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
};

export function CongestionBadge({ level }: { level: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", CONGESTION_STYLES[level] ?? CONGESTION_STYLES.LOW)}>
      {level}
    </span>
  );
}

/* ------------------------------ Empty state ------------------------------ */
export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------ Vehicle icon ----------------------------- */
export const VEHICLE_COLORS: Record<string, string> = {
  car: "#0ea5e9",
  motorcycle: "#f59e0b",
  truck: "#a855f7",
  bus: "#ef4444",
  bicycle: "#10b981",
  van: "#6366f1",
};

export function VehicleDot({ type, size = 10 }: { type: string; size?: number }) {
  return <span className="inline-block rounded-full" style={{ width: size, height: size, background: VEHICLE_COLORS[type] ?? "#64748b" }} />;
}

/* ------------------------------ Formatters ------------------------------- */
export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

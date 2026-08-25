"use client";

import { useNav, type ViewId } from "./nav-context";
import { brand } from "@/lib/brand";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FolderKanban,
  Video,
  PenTool,
  Spline,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  GraduationCap,
  Play,
  BookOpen,
  Moon,
  Sun,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_GROUPS: { label: string; items: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }>; desc?: string }[] }[] = [
  {
    label: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard, desc: "All-projects summary" },
      { id: "projects", label: "Projects", icon: FolderKanban, desc: "Manage analysis projects" },
      { id: "demo", label: "Demo Mode", icon: Play, desc: "Pre-loaded sample" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { id: "workspace", label: "Analysis Workspace", icon: Video, desc: "Video viewer + overlays" },
      { id: "zones", label: "Zone Editor", icon: Spline, desc: "Polygon zones" },
      { id: "lines", label: "Line Editor", icon: PenTool, desc: "Counting lines" },
      { id: "results", label: "Results", icon: BarChart3, desc: "Counts & breakdowns" },
      { id: "events", label: "Events", icon: AlertTriangle, desc: "Timeline of detections" },
    ],
  },
  {
    label: "Output",
    items: [
      { id: "reports", label: "Reports", icon: FileText, desc: "HTML / PDF / CSV" },
      { id: "settings", label: "Settings", icon: Settings, desc: "AI provider config" },
      { id: "onboarding", label: "Onboarding", icon: GraduationCap, desc: "First-run guide" },
      { id: "docs", label: "Documentation", icon: BookOpen, desc: "In-app docs" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, navigate } = useNav();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <img src={brand.logoMark} alt="" className="h-8 w-8 rounded-md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{brand.name}</div>
            <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{brand.tagline}</div>
          </div>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium leading-tight">{item.label}</div>
                        {item.desc && <div className="truncate text-[10px] text-muted-foreground">{item.desc}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">Mock provider</span>
            <Badge variant="outline" className="ml-auto border-emerald-500/30 text-[9px] text-emerald-400">DEMO</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {/* Avoid SSR/CSR hydration mismatch: render BOTH icons and toggle
                visibility via the parent .dark class (set by next-themes on <html>).
                No JS-driven conditional → identical server + client markup. */}
            <Sun className="hidden h-3.5 w-3.5 dark:inline" />
            <Moon className="h-3.5 w-3.5 dark:hidden" />
            Toggle theme
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">{viewTitle(view)}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">v1.0.0</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">System operational</span>
          </div>
        </header>
        <main className="scroll-thin flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}

function viewTitle(view: ViewId): string {
  const titles: Record<ViewId, string> = {
    overview: "Overview",
    projects: "Projects",
    workspace: "Analysis Workspace",
    zones: "Zone Editor",
    lines: "Line Editor",
    results: "Results & Analytics",
    events: "Events Timeline",
    reports: "Reports & Exports",
    settings: "Settings — AI Provider",
    onboarding: "Onboarding",
    demo: "Demo Mode",
    docs: "Documentation",
  };
  return titles[view] ?? "Dashboard";
}

"use client";

import { useNav } from "../nav-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, FileText, Cpu, Settings, Shield, Layers, Download } from "lucide-react";

const DOCS = [
  { icon: FileText, title: "Getting Started", file: "GETTING_STARTED", desc: "Install, configure and run the product in minutes." },
  { icon: Layers, title: "Architecture", file: "ARCHITECTURE", desc: "How the frontend, API, provider layer and pipeline fit together." },
  { icon: Cpu, title: "AI Providers", file: "AI_PROVIDERS", desc: "The VisionProvider interface and how to add new providers." },
  { icon: Download, title: "Deployment", file: "DEPLOYMENT", desc: "Docker, native, environment variables, backups." },
  { icon: Settings, title: "Troubleshooting", file: "TROUBLESHOOTING", desc: "Common issues and their fixes." },
  { icon: Settings, title: "Customization", file: "CUSTOMIZATION", desc: "Where to change branding, defaults, providers." },
  { icon: Shield, title: "Licensing", file: "LICENSING", desc: "The 4 license tiers and what each permits." },
  { icon: Shield, title: "Security", file: "SECURITY", desc: "Security checklist and privacy-by-default posture." },
  { icon: FileText, title: "Third-Party Licenses", file: "THIRD_PARTY_LICENSES", desc: "Dependency license inventory for redistribution." },
];

export function DocsView() {
  const { navigate } = useNav();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> In-App Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Full documentation ships in the <code className="rounded bg-muted px-1 py-0.5">docs/</code> folder of the repository. Each document below is a Markdown file you can open directly. The README at the repository root is the fastest orientation.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DOCS.map((d) => {
              const Icon = d.icon;
              return (
                <a
                  key={d.file}
                  href={`/docs/${d.file}.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.desc}</div>
                  </div>
                  <code className="text-[10px] text-muted-foreground">docs/{d.file}.md</code>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Quick Concepts</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-xs text-muted-foreground sm:grid-cols-2">
          <Concept term="VisionProvider" desc="The abstraction layer between application logic and AI. Application code never calls a specific provider directly — it goes through this interface." />
          <Concept term="Mock Provider" desc="Deterministic simulator that returns realistic traffic data (vehicles, tracks, events) without any external API. Powers Demo Mode." />
          <Concept term="Analysis Pipeline" desc="Ingestion → Frame sampling → Detection → Tracking → Trajectory → Zone/Line logic → Events → Aggregation → Storage → Reports." />
          <Concept term="Counting Line" desc="A virtual line you draw. Each tracked vehicle crossing it generates an event (with inbound/outbound labels)." />
          <Concept term="Zone" desc="A polygon you draw over the scene. The engine tracks entry/exit, occupancy, dwell time and class breakdown per zone." />
          <Concept term="Estimated Speed" desc="Derived from trajectory motion and a configurable scene scale. NOT legally certified. Labeled 'Estimated Speed' in the UI." />
          <Concept term="Congestion Level" desc="LOW / MODERATE / HIGH / SEVERE — derived from occupancy, active vehicles and movement, with contributing signals shown in the UI." />
          <Concept term="Rule Engine" desc="COUNT_CROSSING, ZONE_ENTRY, ZONE_EXIT, STOPPED_VEHICLE, WRONG_WAY, CONGESTION, DWELL_TIME — each with human-readable configuration." />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="text-sm font-semibold">Need hands-on?</div>
            <div className="text-xs text-muted-foreground">Try the onboarding walkthrough or open the demo project.</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("onboarding")}>Onboarding</Button>
            <Button size="sm" onClick={() => navigate("demo")} className="gap-2">Open Demo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Concept({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="font-mono text-xs font-semibold text-foreground">{term}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

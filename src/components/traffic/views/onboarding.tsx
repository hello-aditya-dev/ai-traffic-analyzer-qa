"use client";

import { useState } from "react";
import { useNav } from "../nav-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Upload, Link2, Play, ArrowRight, Check } from "lucide-react";
import { brand } from "@/lib/brand";

export function OnboardingView() {
  const { navigate, openProject } = useNav();
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
          <div className="flex items-center gap-3">
            <img src={brand.logoMark} alt="" className="h-12 w-12 rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome to {brand.name}</h1>
              <p className="text-sm text-muted-foreground">{brand.tagline}. Let's get you analyzing traffic in minutes.</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          {/* Stepper */}
          <div className="mb-8 flex items-center justify-between">
            {["Choose mode", "Sample project", "Draw a line", "Read results"].map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${i <= step ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"}`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`ml-2 hidden text-xs sm:inline ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
                {i < 3 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How do you want to analyze video?</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ModeCard icon={<Play className="h-6 w-6" />} title="Demo Mode" desc="Pre-loaded sample. No setup, no upload." onClick={() => { setStep(1); }} highlight />
                <ModeCard icon={<Upload className="h-6 w-6" />} title="Upload Video" desc="Bring your own MP4 footage." onClick={() => navigate("projects")} />
                <ModeCard icon={<Link2 className="h-6 w-6" />} title="Connect Camera" desc="RTSP camera architecture (configurable)." onClick={() => navigate("settings")} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sample Project: Downtown Intersection Demo</h3>
              <p className="text-sm text-muted-foreground">A pre-configured 4-way intersection with zones, counting lines, rules and a completed analysis — so you can explore every feature instantly.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Duration" value="3:00" />
                <Stat label="Vehicles" value="~150" />
                <Stat label="Zones" value="4" />
                <Stat label="Count lines" value="2" />
              </div>
              <Button onClick={() => navigate("demo")} className="gap-2">Open Demo Project <ArrowRight className="h-4 w-4" /></Button>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button variant="outline" onClick={() => setStep(2)}>Next: Draw a line</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Draw a counting line</h3>
              <p className="text-sm text-muted-foreground">A counting line generates an event each time a tracked vehicle crosses it. Click two points on the scene to define start and end. The mock analysis engine will count crossings automatically.</p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <pre className="text-xs text-muted-foreground">{`       ROAD
   ↓   ↓   ↓
------------------  ← COUNT LINE
   ↑   ↑   ↑`}</pre>
              </div>
              <Button onClick={() => navigate("lines")} className="gap-2">Open Line Editor <ArrowRight className="h-4 w-4" /></Button>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="outline" onClick={() => setStep(3)}>Next: Read results</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Understand the results</h3>
              <p className="text-sm text-muted-foreground">The dashboard shows vehicle counts by class, directional flow, zone occupancy, congestion over time and an events timeline. Click any event to seek the video to that moment.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ModeCard icon={<Rocket className="h-6 w-6" />} title="Results" desc="KPIs, charts, zone stats" onClick={() => navigate("results")} />
                <ModeCard icon={<Play className="h-6 w-6" />} title="Workspace" desc="Video viewer with overlays" onClick={() => navigate("workspace")} />
                <ModeCard icon={<ArrowRight className="h-6 w-6" />} title="Reports" desc="HTML / CSV / JSON export" onClick={() => navigate("reports")} />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => navigate("overview")} className="gap-2">Go to Overview <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick, highlight }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md ${highlight ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

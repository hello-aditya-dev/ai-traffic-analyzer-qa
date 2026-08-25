"use client";

import { useState } from "react";
import { useNav } from "../nav-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "../shared";
import { FileText, FileJson, FileSpreadsheet, Download, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ReportsView() {
  const { analysisId } = useNav();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [company, setCompany] = useState("");
  const [generating, setGenerating] = useState(false);

  if (!analysisId) return <EmptyState title="No analysis selected" description="Open an analysis to generate reports." icon={<FileText className="h-8 w-8" />} />;

  function openExport(kind: "csv" | "json" | "report") {
    const params = new URLSearchParams({ analysisId });
    if (kind === "report") {
      if (title) params.set("title", title);
      if (author) params.set("author", author);
      if (company) params.set("companyName", company);
    }
    window.open(`/api/exports/${kind}?${params.toString()}`, "_blank");
  }

  async function generatePdfLike() {
    // We don't ship a PDF engine in V1; the HTML report is print-to-PDF capable.
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Open the HTML report and use your browser's Print → Save as PDF.");
      openExport("report");
    }, 800);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Professional Reports & Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Generate a client-facing HTML report (cover, methodology, executive summary, charts, zone analysis, events, findings, limitations) or export raw data as CSV / JSON. The HTML report is print-ready: use your browser's "Save as PDF" for a PDF copy.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ExportCard
              icon={<FileBarChart className="h-6 w-6" />}
              title="HTML Report"
              desc="Full professional report with charts & findings"
              onClick={() => openExport("report")}
              accent="text-teal-600 dark:text-teal-400"
            />
            <ExportCard
              icon={<FileSpreadsheet className="h-6 w-6" />}
              title="CSV Export"
              desc="Tracks, events & summary as CSV"
              onClick={() => openExport("csv")}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <ExportCard
              icon={<FileJson className="h-6 w-6" />}
              title="JSON Export"
              desc="Machine-readable full result"
              onClick={() => openExport("json")}
              accent="text-sky-600 dark:text-sky-400"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="rtitle">Report title</Label>
            <Input id="rtitle" placeholder="e.g. Downtown Intersection Traffic Study" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rauthor">Author</Label>
            <Input id="rauthor" placeholder="Prepared by" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rcompany">Company name</Label>
            <Input id="rcompany" placeholder="Your organization" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={generatePdfLike} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Generate Branded Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {[
              "Cover page", "Project information", "Methodology", "Video information",
              "Executive summary", "Traffic volume (time series)", "Vehicle classification",
              "Directional analysis", "Congestion over time", "Zone analysis", "Events log",
              "Key findings", "Limitations", "Appendix",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportCard({ icon, title, desc, onClick, accent }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 ${accent}`}>{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <Download className="h-3 w-3" /> Download
      </span>
    </button>
  );
}

/**
 * HTML report generator — produces a self-contained, professionally styled
 * HTML report for a completed analysis. Premium feature.
 *
 * Sections: cover, project info, methodology, video info, executive summary,
 * traffic volume, vehicle classification, directional analysis, time-series,
 * zone analysis, events, key findings, limitations, appendix.
 */
import type { AnalysisResult } from "@/lib/types";
import { brand } from "@/lib/brand";

interface ReportInput {
  analysisId: string;
  projectName: string;
  projectLocation?: string | null;
  projectDescription?: string | null;
  videoFilename: string;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  provider: string;
  startedAt: Date;
  completedAt?: Date | null;
  result: AnalysisResult;
  title?: string;
  author?: string;
  companyName?: string;
}

export function generateHtmlReport(input: ReportInput): string {
  const { result: r, projectName, projectLocation, projectDescription, videoFilename, videoDuration, videoWidth, videoHeight, videoFps, provider, startedAt, completedAt, title, author, companyName } = input;
  const s = r.summary;
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toLocaleString() : "—");
  const total = Math.max(1, s.totalVehicles);
  const classRows = [
    ["Cars", s.cars, ((s.cars / total) * 100).toFixed(1) + "%"],
    ["Motorcycles", s.motorcycles, ((s.motorcycles / total) * 100).toFixed(1) + "%"],
    ["Trucks", s.trucks, ((s.trucks / total) * 100).toFixed(1) + "%"],
    ["Buses", s.buses, ((s.buses / total) * 100).toFixed(1) + "%"],
    ["Bicycles", s.bicycles, ((s.bicycles / total) * 100).toFixed(1) + "%"],
    ["Vans", s.vans, ((s.vans / total) * 100).toFixed(1) + "%"],
  ].filter((row) => Number(row[1]) > 0);

  const dirRows = Object.entries(s.directionalBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([dir, count]) => `<tr><td>${escape(dir)}</td><td>${count}</td><td>${((count / total) * 100).toFixed(1)}%</td></tr>`)
    .join("");

  const timeSeriesRows = r.timeSeries
    .map((ts) => `<tr><td>${fmtTime(ts.t)}</td><td>${ts.count}</td><td>${ts.cars}</td><td>${ts.motorcycles}</td><td>${ts.trucks}</td><td>${ts.buses}</td></tr>`)
    .join("");

  const zoneRows = Object.values(s.zoneStats as Record<string, { name: string; entered: number; exited: number; avgDwellSec: number; classBreakdown: Record<string, number> }>)
    .map((z) => `<tr><td>${escape(z.name)}</td><td>${z.entered}</td><td>${z.exited}</td><td>${z.avgDwellSec.toFixed(1)}s</td><td>${Object.entries(z.classBreakdown).map(([k, v]) => `${escape(k)}: ${v}`).join(", ") || "—"}</td></tr>`)
    .join("");

  const eventRows = r.events
    .slice(0, 50)
    .map((e) => `<tr><td>${fmtTime(e.timestamp)}</td><td><span class="badge badge-${e.severity}">${escape(e.severity)}</span></td><td>${escape(e.eventType.replace(/_/g, " "))}</td><td>${e.trackId ?? "—"}</td><td>${escape(JSON.stringify(e.metadata ?? {}))}</td></tr>`)
    .join("");

  const congestionRows = r.congestion.map((c) => `<tr><td>${fmtTime(c.timestamp)}</td><td><span class="badge badge-${c.level.toLowerCase()}">${c.level}</span></td><td>${(c.occupancy * 100).toFixed(0)}%</td><td>${c.activeVehicles}</td></tr>`).join("");

  const findings = generateFindings(s, r);
  const limitations = [
    "Vehicle detection and classification rely on the configured AI provider. Accuracy varies by provider, video quality, camera angle, lighting, and weather.",
    "Speed values are ESTIMATED from trajectory motion and a configurable scene scale. They are NOT legally certified measurements and must not be used for enforcement.",
    "Direction classification is derived from pixel movement and assumes a configured camera orientation. Compass directions require manual calibration.",
    "Line crossing counts may be affected by occlusion, overlapping vehicles, and tracker jitter. The dedup logic mitigates but does not eliminate double-counting.",
    "Zone analytics depend on user-drawn polygons. Incorrectly placed zones produce incorrect occupancy and dwell metrics.",
    "This report was generated automatically by software. A qualified traffic engineer should review findings before any commercial or regulatory use.",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(title || projectName)} — Traffic Analysis Report</title>
<style>
  :root { --ink:#0f172a; --muted:#475569; --line:#e2e8f0; --bg:#f8fafc; --accent:#0f766e; --red:#dc2626; --amber:#d97706; --green:#16a34a; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--ink); margin:0; background:var(--bg); line-height:1.6; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 48px 40px; background:#fff; min-height: 100vh; }
  h1,h2,h3 { color: var(--ink); font-weight:700; line-height:1.2; }
  h1 { font-size: 34px; margin: 0 0 8px; }
  h2 { font-size: 22px; margin: 40px 0 12px; padding-bottom: 8px; border-bottom: 2px solid var(--accent); }
  h3 { font-size: 16px; margin: 24px 0 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  p { margin: 0 0 12px; color:#334155; }
  .cover { text-align:center; padding: 64px 0 48px; border-bottom: 1px solid var(--line); margin-bottom: 32px; }
  .cover .kicker { color: var(--accent); font-weight:700; letter-spacing:.16em; text-transform:uppercase; font-size: 13px; }
  .cover h1 { font-size: 42px; margin: 12px 0; }
  .cover .meta { color: var(--muted); font-size: 14px; margin-top: 16px; }
  .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px; }
  .kpi { background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:16px; }
  .kpi .v { font-size: 26px; font-weight:700; color:var(--accent); }
  .kpi .l { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing:.05em; }
  table { width:100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
  th, td { text-align:left; padding: 9px 10px; border-bottom:1px solid var(--line); }
  th { background:var(--bg); font-weight:600; color:var(--muted); text-transform:uppercase; font-size:11px; letter-spacing:.05em; }
  tr:hover td { background:#fafafa; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; text-transform:uppercase; }
  .badge-info { background:#e0f2fe; color:#0369a1; }
  .badge-low { background:#dcfce7; color:#15803d; }
  .badge-medium { background:#fef9c3; color:#a16207; }
  .badge-high { background:#ffedd5; color:#c2410c; }
  .badge-critical { background:#fee2e2; color:#b91c1c; }
  .badge-low.low, .badge-moderate { background:#dcfce7; color:#15803d; }
  .badge-high.high { background:#ffedd5; color:#c2410c; }
  .badge-severe { background:#fee2e2; color:#b91c1c; }
  .meta-list { list-style:none; padding:0; margin:0 0 24px; }
  .meta-list li { padding:6px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; font-size:14px; }
  .meta-list li span:first-child { color:var(--muted); }
  ul.findings li, ul.limit li { margin: 0 0 8px; color:#334155; }
  .foot { margin-top: 48px; padding-top: 16px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; text-align:center; }
  .bar { height:8px; background:var(--line); border-radius:4px; overflow:hidden; margin-top:4px; }
  .bar > i { display:block; height:100%; background:var(--accent); }
  @media print { .wrap { box-shadow:none; } body { background:#fff; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="cover">
    <div class="kicker">${escape(companyName || brand.name)}</div>
    <h1>${escape(title || projectName)}</h1>
    <div>Traffic Analysis Report</div>
    <div class="meta">
      ${escape(projectName)}${projectLocation ? " · " + escape(projectLocation) : ""}<br>
      Generated ${escape(fmtDate(new Date()))}${author ? " · By " + escape(author) : ""}
    </div>
  </div>

  <h2>1. Project Information</h2>
  <ul class="meta-list">
    <li><span>Project</span><span>${escape(projectName)}</span></li>
    <li><span>Location</span><span>${escape(projectLocation || "—")}</span></li>
    <li><span>Description</span><span>${escape(projectDescription || "—")}</span></li>
    <li><span>Prepared by</span><span>${escape(author || companyName || "—")}</span></li>
  </ul>

  <h2>2. Methodology</h2>
  <p>Vehicles were detected, classified, and tracked across sampled frames of the source video using the configured AI vision provider (<strong>${escape(provider)}</strong>). Trajectories were analyzed to determine direction of travel, line crossings, zone occupancy, dwell time, and anomalous events (stopped vehicles, wrong-way movement, congestion). Estimated speeds were derived from trajectory displacement and a configurable scene scale. All metrics are indicative and subject to the limitations listed in section 12.</p>

  <h2>3. Video Information</h2>
  <ul class="meta-list">
    <li><span>Filename</span><span>${escape(videoFilename)}</span></li>
    <li><span>Duration</span><span>${fmtTime(videoDuration)} (${videoDuration.toFixed(1)}s)</span></li>
    <li><span>Resolution</span><span>${videoWidth} × ${videoHeight}</span></li>
    <li><span>Frame rate</span><span>${videoFps} fps</span></li>
    <li><span>Provider</span><span>${escape(provider)}</span></li>
    <li><span>Analysis started</span><span>${escape(fmtDate(startedAt))}</span></li>
    <li><span>Analysis completed</span><span>${escape(fmtDate(completedAt))}</span></li>
  </ul>

  <h2>4. Executive Summary</h2>
  <div class="grid">
    <div class="kpi"><div class="v">${s.totalVehicles}</div><div class="l">Total Vehicles</div></div>
    <div class="kpi"><div class="v">${s.peakVolume}</div><div class="l">Peak Volume</div></div>
    <div class="kpi"><div class="v">${s.totalEvents}</div><div class="l">Events</div></div>
    <div class="kpi"><div class="v">${s.congestionLevel}</div><div class="l">Final Congestion</div></div>
  </div>
  <p>Over the ${fmtTime(videoDuration)} analysis window, <strong>${s.totalVehicles}</strong> vehicles were tracked. Peak simultaneous volume reached <strong>${s.peakVolume}</strong> vehicles at ${fmtTime(s.peakVolumeTime)}. The analysis recorded <strong>${s.totalEvents}</strong> events. Final congestion level at the end of the recording was <strong>${s.congestionLevel}</strong>. Inbound traffic: ${s.inboundCount}; outbound: ${s.outboundCount}.</p>

  <h2>5. Traffic Volume (Time Series)</h2>
  <table>
    <thead><tr><th>Time</th><th>Total</th><th>Cars</th><th>Motorcycles</th><th>Trucks</th><th>Buses</th></tr></thead>
    <tbody>${timeSeriesRows}</tbody>
  </table>

  <h2>6. Vehicle Classification</h2>
  <table>
    <thead><tr><th>Class</th><th>Count</th><th>Share</th><th>Distribution</th></tr></thead>
    <tbody>
      ${classRows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td><div class="bar"><i style="width:${row[2]}"></i></div></td></tr>`).join("")}
    </tbody>
  </table>

  <h2>7. Directional Analysis</h2>
  <table>
    <thead><tr><th>Direction</th><th>Count</th><th>Share</th></tr></thead>
    <tbody>${dirRows}</tbody>
  </table>
  <p>Inbound (primary flow): <strong>${s.inboundCount}</strong> · Outbound: <strong>${s.outboundCount}</strong>.</p>

  <h2>8. Congestion Over Time</h2>
  <table>
    <thead><tr><th>Time</th><th>Level</th><th>Occupancy</th><th>Active Vehicles</th></tr></thead>
    <tbody>${congestionRows}</tbody>
  </table>

  <h2>9. Zone Analysis</h2>
  ${zoneRows ? `<table><thead><tr><th>Zone</th><th>Entered</th><th>Exited</th><th>Avg Dwell</th><th>Class Breakdown</th></tr></thead><tbody>${zoneRows}</tbody></table>` : "<p>No zones were configured for this analysis.</p>"}

  <h2>10. Events</h2>
  <p>${r.events.length} events recorded. Showing first 50.</p>
  <table>
    <thead><tr><th>Time</th><th>Severity</th><th>Type</th><th>Track</th><th>Metadata</th></tr></thead>
    <tbody>${eventRows}</tbody>
  </table>

  <h2>11. Key Findings</h2>
  <ul class="findings">
    ${findings.map((f) => `<li>${escape(f)}</li>`).join("")}
  </ul>

  <h2>12. Limitations</h2>
  <ul class="limit">
    ${limitations.map((l) => `<li>${escape(l)}</li>`).join("")}
  </ul>

  <h2>13. Appendix</h2>
  <h3>Aggregate Counts</h3>
  <ul class="meta-list">
    <li><span>Total tracks</span><span>${r.tracks.length}</span></li>
    <li><span>Total detections</span><span>${r.detections.length || r.tracks.reduce((a, t) => a + t.trajectory.length, 0)}</span></li>
    <li><span>Time-series buckets</span><span>${r.timeSeries.length}</span></li>
    <li><span>Congestion samples</span><span>${r.congestion.length}</span></li>
  </ul>

  <div class="foot">${escape(brand.reportFooter)}<br>Version ${brand.name} · ${new Date().getFullYear()}</div>
</div>
</body>
</html>`;
}

function escape(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateFindings(s: AnalysisResult["summary"], r: AnalysisResult): string[] {
  const findings: string[] = [];
  findings.push(`A total of ${s.totalVehicles} vehicles were tracked over the recording period.`);
  const top = Object.entries(s.directionalBreakdown).sort((a, b) => b[1] - a[1])[0];
  if (top) findings.push(`The dominant direction of travel was "${top[0]}" with ${top[1]} vehicles (${((top[1] / s.totalVehicles) * 100).toFixed(1)}%).`);
  const peak = r.congestion.reduce((a, b) => (b.activeVehicles > a.activeVehicles ? b : a), r.congestion[0] ?? { activeVehicles: 0, timestamp: 0, level: "LOW", occupancy: 0, avgMovement: 0 });
  if (peak) findings.push(`Peak simultaneous occupancy of ${peak.activeVehicles} vehicles occurred at ${Math.floor(peak.timestamp / 60)}m ${Math.floor(peak.timestamp % 60)}s, classified as ${peak.level} congestion.`);
  const wrongWay = r.events.filter((e) => e.eventType === "wrong_way").length;
  if (wrongWay) findings.push(`${wrongWay} wrong-way event(s) were detected, warranting review of lane signage or signal configuration.`);
  const stopped = r.events.filter((e) => e.eventType === "stopped_vehicle").length;
  if (stopped) findings.push(`${stopped} stopped-vehicle event(s) were recorded, which may indicate incidents, queues, or loading activity.`);
  const severe = r.congestion.filter((c) => c.level === "SEVERE").length;
  if (severe) findings.push(`${severe} severe-congestion interval(s) were observed, suggesting capacity constraints during peak periods.`);
  const trucks = s.trucks + s.buses;
  if (trucks / Math.max(1, s.totalVehicles) > 0.2) findings.push(`Heavy vehicles (trucks + buses) comprised ${((trucks / Math.max(1, s.totalVehicles)) * 100).toFixed(1)}% of traffic, above typical urban thresholds — consider heavy-vehicle lane management.`);
  return findings;
}

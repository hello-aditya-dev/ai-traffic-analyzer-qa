"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetch, patchJSON } from "../use-fetch";
import { Cpu, Save, Loader2, Activity, ShieldCheck, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { config } from "@/lib/config";

interface ProviderConfig {
  config: {
    id: string;
    provider: string;
    apiUrl: string | null;
    apiKey: string | null;
    model: string | null;
    timeout: number;
    retries: number;
    frameRate: number;
    confidence: number;
    maxFrames: number;
    resolution: string;
  } | null;
}

interface HealthData {
  provider: string;
  label: string;
  health: { ok: boolean; provider: string; latencyMs?: number; message?: string };
  configured: { aiProvider: string; aiApiBaseUrl: string; aiApiKey: string; aiModel: string; defaultFrameRate: number };
}

export function SettingsView() {
  const { data: cfgData, loading, refresh } = useFetch<ProviderConfig>("/api/provider/config");
  const { data: health, refresh: refreshHealth } = useFetch<HealthData>("/api/provider/health");
  const [form, setForm] = useState<ProviderConfig["config"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (cfgData?.config) setForm(cfgData.config);
    else if (!loading && !cfgData?.config)
      setForm({ id: "", provider: "mock", apiUrl: null, apiKey: null, model: null, timeout: 30, retries: 3, frameRate: 2, confidence: 0.5, maxFrames: 5000, resolution: "720p" });
  }, [cfgData, loading]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await patchJSON("/api/provider/config", {
        provider: form.provider,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        model: form.model,
        timeout: form.timeout,
        retries: form.retries,
        frameRate: form.frameRate,
        confidence: form.confidence,
        maxFrames: form.maxFrames,
        resolution: form.resolution,
      });
      toast.success("Provider settings saved");
      refresh();
      refreshHealth();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      await refreshHealth();
      toast.success("Health check refreshed");
    } finally {
      setTesting(false);
    }
  }

  if (loading || !form) return <Skeleton className="h-[500px] rounded-xl" />;

  const activeProvider = health?.provider ?? config.aiProvider;
  const isMock = activeProvider === "mock";

  return (
    <div className="space-y-6">
      {/* Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Provider Health
          </CardTitle>
          <Button size="sm" variant="outline" onClick={test} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Test Connection
          </Button>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {health.health.ok ? (
                  <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Online
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> Offline
                  </Badge>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium">{health.label}</span>
                {health.health.latencyMs !== undefined && <span className="ml-2 text-xs text-muted-foreground">{health.health.latencyMs}ms</span>}
              </div>
              {health.health.message && <p className="text-xs text-muted-foreground">{health.health.message}</p>}
            </div>
          ) : (
            <Skeleton className="h-8" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4" /> AI Vision Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isMock && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
              <strong>Demo mode active.</strong> The mock provider generates deterministic synthetic traffic analysis — no API key required. Configure a real provider below to analyze actual video.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock / Demo (no API key)</SelectItem>
                  <SelectItem value="generic-http">Generic HTTP Vision Provider</SelectItem>
                  <SelectItem value="local-inference">Local Inference Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model identifier</Label>
              <Input id="model" placeholder="e.g. yolov8n, vehicle-detector-v2" value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apiurl">API base URL</Label>
              <Input id="apiurl" placeholder="https://api.example.com/v1" value={form.apiUrl ?? ""} onChange={(e) => setForm({ ...form, apiUrl: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apikey">API key</Label>
              <Input id="apikey" type="password" placeholder={form.apiKey ? "(set — enter new to replace)" : "sk-..."} onChange={(e) => setForm({ ...form, apiKey: e.target.value || null })} />
              <p className="text-[10px] text-muted-foreground">Stored server-side only. Never exposed to the browser.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Frame sampling rate: <span className="font-mono text-primary">{form.frameRate} FPS</span></Label>
              <Slider value={[form.frameRate]} min={0.5} max={10} step={0.5} onValueChange={(v) => setForm({ ...form, frameRate: v[0] })} />
              <p className="text-[10px] text-muted-foreground">Lower = cheaper (fewer frames analyzed). Higher = denser, more expensive.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Confidence threshold: <span className="font-mono text-primary">{(form.confidence * 100).toFixed(0)}%</span></Label>
              <Slider value={[form.confidence]} min={0.1} max={0.95} step={0.05} onValueChange={(v) => setForm({ ...form, confidence: v[0] })} />
              <p className="text-[10px] text-muted-foreground">Detections below this confidence are discarded.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Max frames per job: <span className="font-mono text-primary">{form.maxFrames}</span></Label>
              <Slider value={[form.maxFrames]} min={500} max={20000} step={500} onValueChange={(v) => setForm({ ...form, maxFrames: v[0] })} />
              <p className="text-[10px] text-muted-foreground">Hard cap to control API cost on long videos.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="timeout">Timeout (s)</Label>
                <Input id="timeout" type="number" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retries">Retries</Label>
                <Input id="retries" type="number" value={form.retries} onChange={(e) => setForm({ ...form, retries: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Resolution</Label>
            <Select value={form.resolution} onValueChange={(v) => setForm({ ...form, resolution: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["480p", "720p", "1080p", "1440p", "2160p"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Provider Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cost Control &amp; Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>• Frame sampling, max frames and resolution directly affect external API cost. Review them before each job.</p>
          <p>• API keys are stored server-side and never shipped to the client.</p>
          <p>• External AI providers may retain or log frames you send. Review their data-retention policy before processing sensitive footage.</p>
          <p>• For sensitive deployments, prefer the local-inference provider (keeps video on your machine).</p>
        </CardContent>
      </Card>
    </div>
  );
}

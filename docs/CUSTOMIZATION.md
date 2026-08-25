# Customization Guide

This document tells you **exactly where** to change the most common customization targets in **AI Traffic Analyzer**: branding, product name, default rules and zones, AI provider, report templates, navigation labels, export formats, and feature flags. Each section lists the concrete file paths.

This is a source-code product. All customization is done by editing the source. There is no admin-driven theming engine in V1 — by design, so the buyer has full control.

---

## 1. Branding, Logo, and Colors

**File:** `src/lib/brand.ts`

This is the central branding configuration file. Edit it once and the change propagates to the app shell, login/onboarding, report headers, and footer.

```ts
// src/lib/brand.ts
export const brand = {
  productName: 'AI Traffic Analyzer',
  shortName: 'Traffic AI',
  tagline: 'Self-hosted traffic intelligence from video',
  logo: {
    src: '/logo.svg',
    alt: 'AI Traffic Analyzer',
    width: 160,
    height: 40,
  },
  colors: {
    primary:    '#0f766e',  // teal-700 — primary actions, brand accents
    accent:     '#0ea5e9',  // sky-500 — charts, highlights
    success:    '#16a34a',
    warning:    '#d97706',
    danger:     '#dc2626',
    background: '#0b1220',  // dark workspace surface
    foreground: '#e5e7eb',
  },
  links: {
    documentation: '/docs',
    support:       'mailto:support@example.com',
    privacy:       '/privacy',
  },
  footerNote: 'Self-hosted traffic analytics. Your data stays on your infrastructure.',
} as const;
```

### To change the logo

1. Replace `public/logo.svg` (and any `public/logo-mark.svg`) with your asset.
2. Or point `brand.logo.src` at a different file under `public/`.

### To change the color palette

- Edit `brand.colors` in `src/lib/brand.ts`.
- The Tailwind config (`tailwind.config.ts`) references these tokens via CSS variables defined in `src/app/globals.css`. Keep the two in sync if you change semantic tokens.
- Charts (Recharts) read from the same palette so colors stay consistent.

### To change the product name everywhere

- Change `brand.productName` and `brand.shortName`.
- Update `<title>` / metadata in `src/app/layout.tsx` (Next.js metadata export).
- Update the root `README.md` and `marketing/PRODUCT_LISTING.md` if you are shipping a renamed fork.

---

## 2. Default Rules and Zones

When a new project is created, a default ruleset and an optional default zone set are applied. These defaults live in:

**File:** `src/lib/defaults/rules.ts` (default rule templates)
**File:** `src/lib/defaults/zones.ts` (default zone templates, usually empty or with a single sample counting line)

### Default rules

```ts
// src/lib/defaults/rules.ts
export const DEFAULT_RULES: RuleTemplate[] = [
  {
    name: 'Count line crossings (default)',
    ruleType: 'COUNT_CROSSING',
    parameters: { direction: 'both', minConfidence: 0.5 },
    enabled: true,
  },
  {
    name: 'Zone entries',
    ruleType: 'ZONE_ENTRY',
    enabled: true,
  },
  {
    name: 'Zone exits',
    ruleType: 'ZONE_EXIT',
    enabled: true,
  },
  {
    name: 'Stopped vehicles (>15s)',
    ruleType: 'STOPPED_VEHICLE',
    parameters: { dwellSeconds: 15 },
    enabled: true,
  },
  {
    name: 'Wrong-way detection',
    ruleType: 'WRONG_WAY',
    parameters: { directionToleranceDeg: 45 },
    enabled: false, // opt-in; depends on a configured lane direction
  },
  {
    name: 'Congestion (HIGH threshold)',
    ruleType: 'CONGESTION',
    parameters: { level: 'HIGH', vehiclesInZone: 12 },
    enabled: true,
  },
  {
    name: 'Dwell time > 30s',
    ruleType: 'DWELL_TIME',
    parameters: { seconds: 30 },
    enabled: false,
  },
];
```

Add, remove, or change defaults here. New projects pick them up automatically.

### Default zones

```ts
// src/lib/defaults/zones.ts
export const DEFAULT_ZONES: ZoneTemplate[] = [
  // Example: a full-frame analysis zone by default.
  {
    name: 'Full frame',
    polygon: [ {x:0,y:0}, {x:1,y:0}, {x:1,y:1}, {x:0,y:1} ],
    zoneType: 'zone',
    color: '#10b981',
  },
];
```

Polygons use normalized coordinates (0..1) so they are resolution-independent.

---

## 3. AI Provider Configuration

**Files:**
- `src/providers/registry.ts` — selects the active provider.
- `src/providers/mock/` — deterministic default.
- `src/providers/generic-http/` — HTTP API adapter.
- `src/providers/local-inference/` — extension point.
- `.env` and the `ProviderConfig` table — runtime settings.

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for the full reference.

### Quickest change

Edit `.env`:

```env
AI_PROVIDER=generic-http
AI_API_BASE_URL=https://your-vision-api.example.com/v1/detect
AI_API_KEY=sk-...
AI_MODEL=your-model-id
```

Restart the app. Then use **Settings → AI Provider → Test connection** to verify.

### Default provider

The default is `mock` and is set both in `.env.example` and as the fallback in `src/providers/registry.ts`. Change both if you want a different default for forks you distribute.

---

## 4. Report Templates

**Directory:** `src/lib/reports/templates/`

Each report format has its own generator:

| Format | Generator file | Notes |
| --- | --- | --- |
| HTML | `src/lib/reports/templates/html.ts` | Full standalone HTML report with embedded CSS, charts as inline SVG, brand header from `src/lib/brand.ts`. |
| CSV | `src/lib/reports/templates/csv.ts` | Counts, classes, directions, events as separate CSV sections. |
| JSON | `src/lib/reports/templates/json.ts` | Full structured export (matches DB shape). |
| PDF | `src/lib/reports/templates/pdf.ts` | Generated from the HTML template via a headless browser, where supported. Gated by the `enablePdfExport` feature flag. |

### To change the HTML report layout

1. Open `src/lib/reports/templates/html.ts`.
2. Edit the template string. All styling is inline CSS so the report is self-contained and renders identically when opened from disk or emailed.
3. Branding (logo, colors, product name, footer) is injected from `src/lib/brand.ts` — change there to update across all reports.
4. Report metadata (title, author, company name) is captured from the Report form and stored on the `Report` row.

### To add a new export format

1. Create `src/lib/reports/templates/<format>.ts` exporting a `generate(report: ReportContext): Promise<Buffer>`.
2. Register it in `src/lib/reports/registry.ts`.
3. Add the option to the report-format dropdown in the Reports UI.
4. Add a row to the third-party licenses doc if the new format pulls in a new dependency.

---

## 5. Navigation Labels

**File:** `src/components/layout/sidebar.tsx` (or `src/components/layout/nav.ts`)

The sidebar navigation is a single config array. Edit labels, icons, and routes here:

```ts
// src/components/layout/nav.ts
export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',    href: '/',                 icon: LayoutDashboard },
  { label: 'Projects',    href: '/projects',         icon: FolderKanban },
  { label: 'Demo Mode',   href: '/demo',             icon: Sparkles },
  { label: 'Zones',       href: '/projects/[id]/zones',  icon: Shapes },
  { label: 'Rules',       href: '/projects/[id]/rules',  icon: ListChecks },
  { label: 'Analysis',    href: '/projects/[id]/analysis', icon: Activity },
  { label: 'Events',      href: '/projects/[id]/events',  icon: BellRing },
  { label: 'Reports',     href: '/projects/[id]/reports',  icon: FileText },
  { label: 'Settings',    href: '/settings',         icon: Settings },
];
```

Rename labels, reorder, or hide items (e.g. set `hidden: true` based on a feature flag).

---

## 6. Export Formats

**File:** `src/lib/exports/registry.ts`

The list of available structured exports (CSV, JSON) is centralized here:

```ts
export const EXPORTS = [
  { id: 'counts-csv',   label: 'Counts (CSV)',    format: 'csv',  generator: countsCsv },
  { id: 'events-csv',   label: 'Events (CSV)',   format: 'csv',  generator: eventsCsv },
  { id: 'detections-json', label: 'Detections (JSON)', format: 'json', generator: detectionsJson },
  { id: 'full-json',    label: 'Full run (JSON)', format: 'json', generator: fullRunJson },
];
```

To add a new export:

1. Implement the generator in `src/lib/exports/generators/`.
2. Register it in the array above.
3. It appears automatically in the **Export** dropdown.

---

## 7. Feature Flags

**File:** `src/lib/feature-flags.ts`

V1 ships with a small, explicit set of feature flags so you can disable capabilities you do not want to ship in a fork.

```ts
// src/lib/feature-flags.ts
export const featureFlags = {
  enablePdfExport:     true,   // Requires a headless browser runtime
  enableClips:         false,  // Event clip extraction (alpha)
  enableRtspCameras:   false,  // Live RTSP stream architecture (UI hidden)
  enableDemoMode:      true,
  enableOnboarding:    true,
  enableWrongWayRule:  true,
  enableDwellTimeRule:  true,
  enableCongestionRule: true,
  enableEstimatedSpeed: true,  // Off by default if you must not surface speed at all
} as const;
```

Flags can be wired to environment variables to switch them per-deployment:

```ts
enablePdfExport: process.env.FF_ENABLE_PDF !== 'false',
```

Use flags instead of deleting code when you want to hide a capability — it keeps upgrades cleaner.

---

## 8. Upload Limits and Defaults

**File:** `.env` (and `src/lib/config.ts` which parses it)

| Variable | Default | Change |
| --- | --- | --- |
| `MAX_UPLOAD_MB` | `512` | Set to a higher value for long videos; ensure reverse proxy allows the body size. |
| `DEFAULT_FRAME_RATE` | `2` | Default sampling rate for new analyses. |
| `VIDEO_STORAGE_PATH` | `./storage/projects` | Move uploads off the repo directory for production. |
| `OUTPUT_STORAGE_PATH` | `./storage/exports` | Same as above. |

Per-run cost-control defaults (`maxFrames`, `resolution`, `confidence`) live in the `ProviderConfig` table and are editable from **Settings → AI Provider**.

---

## 9. Pricing and License Descriptions

**File:** `marketing/PRODUCT_LISTING.md`

The product does **not** hard-code pricing in application logic. Prices and tier descriptions are marketing metadata, kept in `marketing/PRODUCT_LISTING.md` so you can change them without touching code. The application never reads prices; if you build a storefront, integrate that separately.

The license tiers (Personal, Commercial, Agency, Extended/Reseller) are described in [docs/LICENSING.md](./LICENSING.md) and the legal text lives in the root `LICENSE.md`.

---

## 10. Database Schema

**File:** `prisma/schema.prisma`

Schema changes flow through Prisma:

```bash
# Edit prisma/schema.prisma, then:
bun run db:generate       # regenerate the client
bun run db:push           # apply schema (safe for additive changes; destructive changes warn)
```

For production migrations, prefer `prisma migrate`:

```bash
bun run db:migrate -- --name your_change
```

---

## 11. Common Rebrand Checklist (White-Label)

If you are white-labeling (under the Agency or Extended/Reseller tier — see [LICENSING.md](./LICENSING.md)):

1. Replace `public/logo.svg` and `public/logo-mark.svg`.
2. Edit `src/lib/brand.ts` (name, tagline, colors, links).
3. Edit `src/app/layout.tsx` (metadata title/description).
4. Edit `src/components/layout/nav.ts` (labels if desired).
5. Edit `marketing/PRODUCT_LISTING.md` (your storefront copy).
6. Edit root `README.md` (intro, badges).
7. Confirm `LICENSE.md` still references your tier's terms — do **not** strip the IP-ownership clause unless your license explicitly permits it.
8. Confirm `docs/THIRD_PARTY_LICENSES.md` is intact — license obligations of dependencies survive rebranding.

---

## 12. Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — pipeline and module layout.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — provider extension.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — environment variables and volumes.
- [SECURITY.md](./SECURITY.md) — safe customization (filename sanitization, etc.).
- [LICENSING.md](./LICENSING.md) — what your tier permits.

# Direct Outreach — Positioning & Templates

Concise outreach positioning for **AI Traffic Analyzer** when selling directly (not through a marketplace listing). Use this document to align sales conversations across audiences. For full product copy, see [PRODUCT_LISTING.md](./PRODUCT_LISTING.md). For tier terms, see [docs/LICENSING.md](../docs/LICENSING.md).

---

## 1. Core Pitch (one paragraph)

AI Traffic Analyzer is a self-hosted, source-code-first product that turns traffic and road video into structured traffic intelligence — vehicle counts, classifications, tracking, directional flow, zone analytics, line crossings, configurable events, and professional reports. You buy the source code, deploy it on your own infrastructure, and own the deployment. It runs end-to-end with a deterministic mock provider (no API key required) and ships with an open provider architecture so you can plug in any vision API or your own local-inference worker. No SaaS, no recurring fees, no phone-home. Tiers from $59 (Personal) to $999+ (Extended/Reseller).

---

## 2. Positioning by Audience

### 2.1 CCTV integrators

You already deploy cameras and NVRs for clients. Your clients increasingly ask "can you also tell us how many cars use this entrance?" or "can you flag wrong-way movement at our lot?" Most CCTV analytics offerings are cloud SaaS, recurring per-camera fees, vendor lock-in, and no source access. AI Traffic Analyzer is the alternative you can deploy on the same hardware you already own, rebrand for each client, and bill as your own service. The `mock` provider lets you demo the product on a sales call with zero setup. When the deal closes, plug in a real vision API or your own worker.

**Pain points addressed:** recurring SaaS fees, vendor lock-in, no source access, no way to white-label, demo time.

**Recommended tier:** Agency ($499) for most integrators; Extended/Reseller ($999+) if you intend to resell the product itself.

### 2.2 Traffic consultancies & transportation engineering firms

You deliver traffic studies, intersection analyses, and parking studies. Today you commission manual counts or buy specialized counting hardware, then hand-deliver a PDF. AI Traffic Analyzer lets you standardize on one tool across engagements: upload video, draw zones and counting lines, run analysis, export a branded HTML or PDF report. Because the source is yours, you can extend the report template to match your house style and add custom rule types as your methodology evolves.

**Pain points addressed:** inconsistent tooling across engagements, manual count overhead, report formatting, ability to add custom rules.

**Recommended tier:** Agency ($499) or Commercial ($199) for a single in-house deployment.

### 2.3 AI development agencies

You build custom software for clients and traffic/video analytics is a recurring request. Starting from zero on a vision pipeline is months of work. AI Traffic Analyzer gives you a production-grade foundation: a Next.js + TypeScript + Prisma app, a clean provider-adapter architecture, a rules engine, a reports module, and a documented extension point for your own Python/FastAPI worker. You spend your time on the differentiating work (the model, the integration, the custom rules) instead of the boilerplate (upload, probe, frame sampling, tracking, persistence, UI).

**Pain points addressed:** starting from scratch on every engagement, no reusable foundation, vendor lock-in to SaaS analytics.

**Recommended tier:** Agency ($499); Extended/Reseller ($999+) if you want to resell the product itself to your clients.

### 2.4 Transportation firms & operators

You operate parking facilities, toll plazas, logistics yards, or campus road networks. You need quantitative data on vehicle movement without handing video to a third party. AI Traffic Analyzer runs on your own servers, behind your own firewall, with the option of fully local inference. No video leaves your network. Reports are yours to keep and distribute.

**Pain points addressed:** data residency, vendor dependence, recurring fees, privacy concerns with cloud analytics.

**Recommended tier:** Commercial ($199) for a single facility; Agency ($499) for multiple facilities; Extended/Reseller ($999+) if you intend to deploy across many sites or resell.

---

## 3. Outreach Email Templates

Three short templates, one per audience. Replace the bracketed fields before sending. Keep them concise — the goal is a 15-minute discovery call, not a sale on the first email.

### 3.1 Template — CCTV Integrator

> Subject: Add analytics to your CCTV deployments — without the SaaS tax
>
> Hi [First name],
>
> I noticed [Company] installs and manages CCTV systems for [client type / sector]. A question we hear from integrators like you: "Can we also give clients vehicle counts, wrong-way alerts, and traffic reports — without signing them up to a per-camera cloud SaaS?"
>
> I'd like to show you **AI Traffic Analyzer** — a self-hosted traffic analytics product you deploy on hardware you already own. You upload footage, draw zones and counting lines, and the pipeline produces counts, classifications, directional flow, events, and branded HTML/PDF reports. It runs end-to-end with zero API keys (deterministic demo provider), and you can plug in any vision API or your own local-inference worker for real accuracy.
>
> Source code is included, so you can rebrand it per client and bill it as your own service. No recurring fees to us, no phone-home, no lock-in.
>
> Worth a 15-minute call? I can share a demo project on screen. [Scheduling link]
>
> [Your name]
> [Your company]
> [Link to PRODUCT_LISTING.md or storefront]

### 3.2 Template — Traffic Consultancy / Transportation Engineering Firm

> Subject: Standardize your traffic studies on one tool — and own the source
>
> Hi [First name],
>
> I came across [Firm]'s work on [specific study type, e.g. intersection analyses / parking studies / traffic impact assessments]. Most firms we talk to tell us the same thing: every engagement uses a different counting method, the report formatting is manual, and adding a new metric means commissioning custom tooling.
>
> I'd like to introduce **AI Traffic Analyzer** — a self-hosted product that converts traffic video into counts, classifications, directional flow, zone analytics, and configurable events (crossings, zone entry/exit, stopped vehicles, wrong-way, congestion, dwell), then exports branded HTML/CSV/JSON/PDF reports. You draw zones and counting lines over the video, run the analysis, and the report is generated for you.
>
> Because you get the full source code, you can extend the report template to match your house style and add custom rule types as your methodology evolves. It runs on a laptop for a single study or on a server for high-volume work.
>
> Worth a 15-minute call to see if it fits your workflow? [Scheduling link]
>
> [Your name]
> [Your company]
> [Link to PRODUCT_LISTING.md or storefront]

### 3.3 Template — AI Development Agency

> Subject: A reusable foundation for traffic/video analytics engagements
>
> Hi [First name],
>
> I'm reaching out because [Agency] builds custom software and I suspect you occasionally get asked to build traffic or video analytics features for clients — counts, tracking, zone analytics, alerts, reports. Most teams start from zero every time: upload, probe, frame sampling, tracker, persistence, UI, reports. That's months of boilerplate.
>
> I'd like to show you **AI Traffic Analyzer** — a production-grade Next.js + TypeScript + Prisma codebase with a clean `VisionProvider` adapter architecture, a rules engine, a reports module, and a documented extension point for your own Python/FastAPI vision worker. You spend your time on the differentiating work (the model, the integration, the custom rules), not the boilerplate.
>
> It ships with a deterministic mock provider so you can demo it on a sales call with zero setup. When you win the engagement, plug in a real vision API or your own local-inference worker — the application pipeline doesn't change.
>
- Full source code, MIT/Apache/permissive dependency stack, no lock-in.
>
> Worth a 15-minute call? [Scheduling link]
>
> [Your name]
> [Your company]
> [Link to PRODUCT_LISTING.md or storefront]

---

## 4. Objection Handling (Quick Reference)

| Objection | Response |
| --- | --- |
| "Is this a SaaS?" | No. Source-code product. You deploy it, own it, and there are no recurring fees to us. |
| "Do I need an AI API key?" | No. The mock provider runs the full pipeline with zero keys. You only need a key if you switch to a real vision API. |
| "Why TypeScript and not Python?" | V1 implements the full pipeline in TypeScript so it runs as a single Next.js process with zero external dependencies. The `VisionProvider` interface is structured so a Python/FastAPI worker can be plugged in later without changing application logic — that's a documented extension point. |
| "Is the speed measurement certified?" | No. It's a relative motion indicator and must not be used for enforcement. |
| "Can you do facial recognition?" | No, and no tier licenses that as a capability. The product is privacy-by-default. |
| "Can I white-label it?" | Yes, under Agency (limited, client-facing fork) and Extended/Reseller (full white-label) tiers. |
| "What about privacy / data residency?" | Self-hosted, optional fully local inference, no phone-home. You are responsible for legal basis. See `docs/SECURITY.md`. |
| "Why should I trust a $59 / $199 product for production?" | The price reflects the tier of rights, not the depth of the code. Personal is for evaluation; Commercial and above are for production. Read the source, run the demo, decide. |
| "What if I outgrow it?" | The source is yours. Extend the rules engine, add export formats, write your own provider adapter, plug in a real CV worker. The architecture is designed for it. |

---

## 5. Suggested Discovery Call Structure (15 minutes)

1. **2 min — Context.** What they do, what they're trying to solve.
2. **3 min — Demo (mock provider).** Open Demo Mode, run analysis, show dashboard, events, charts, HTML report.
3. **3 min — Architecture.** One slide: pipeline + provider adapter + extension point.
4. **4 min — Fit.** Map their use case to features and tiers. Identify the differentiating work they'd do.
5. **3 min — Next step.** Trial download (Personal), technical deep-dive call, or proposal.

---

## 6. Cross-References

- [PRODUCT_LISTING.md](./PRODUCT_LISTING.md) — full listing, pricing, FAQ.
- [docs/LICENSING.md](../docs/LICENSING.md) — tier definitions.
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — technical deep-dive material.
- [docs/AI_PROVIDERS.md](../docs/AI_PROVIDERS.md) — provider model.
- [docs/SECURITY.md](../docs/SECURITY.md) — privacy-by-default and data residency.

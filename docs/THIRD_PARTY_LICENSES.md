# Third-Party Licenses

**AI Traffic Analyzer** is built on top of open-source and permissively-licensed dependencies. This document lists the dependencies shipped in V1, their licenses, and how they are used. It also notes dependencies that are **not** shipped in V1 but may be added when a buyer implements the documented Python/FastAPI vision-worker extension point — those must be re-audited at that time.

The license of **AI Traffic Analyzer itself** is proprietary (see root `LICENSE.md`). This document covers **only the bundled dependencies**, whose licenses continue to apply to any redistribution of the product.

---

## 1. Dependency Table

| Dependency | Version | License | Use | Redistribution notes |
| --- | --- | --- | --- | --- |
| Next.js | 16.x | MIT | Application framework (App Router, Route Handlers, standalone build) | MIT — permissive; retain copyright notice. |
| React | 19.x | MIT | UI library | MIT — permissive; retain copyright notice. |
| React DOM | 19.x | MIT | DOM rendering | MIT — permissive. |
| TypeScript | 5.x | Apache-2.0 | Type system / language | Apache-2.0 — permissive; retain notice. Compiler output is not subject to the license. |
| Tailwind CSS | 4.x | MIT | Styling / utility-first CSS | MIT — permissive. Generated CSS is yours. |
| tailwindcss-animate / tw-animate-css | 1.x | MIT | Animation utilities | MIT — permissive. |
| @tailwindcss/postcss | 4.x | MIT | Tailwind PostCSS plugin | MIT — permissive. |
| tailwind-merge | 3.x | MIT | Class merging | MIT — permissive. |
| shadcn/ui (component sources) | — | MIT | UI component primitives copied into the project | MIT — permissive; the copied component source retains the shadcn/ui notice. |
| Radix UI primitives (accordion, dialog, dropdown, popover, select, tabs, tooltip, etc.) | 1.x / 2.x | MIT | Accessible UI primitives | MIT — permissive; retain notice. |
| @radix-ui/react-* | — | MIT | See above | MIT. |
| class-variance-authority | 0.7.x | Apache-2.0 | Variant styling for components | Apache-2.0 — permissive; retain notice. |
| clsx | 2.x | MIT | Conditional class names | MIT — permissive. |
| cmdk | 1.x | MIT | Command menu primitive | MIT — permissive. |
| @tanstack/react-query | 5.x | MIT | Server-state / data fetching | MIT — permissive. |
| @tanstack/react-table | 8.x | MIT | Table primitives | MIT — permissive. |
| @hookform/resolvers | 5.x | MIT | react-hook-form schema resolvers | MIT — permissive. |
| react-hook-form | 7.x | MIT | Forms | MIT — permissive. |
| zod | 4.x | MIT | Schema validation | MIT — permissive. |
| Prisma (CLI + Engine) | 6.x | Apache-2.0 | ORM, schema migrations, query engine | Apache-2.0 — permissive; retain notice. Query engine binaries are redistributed under the same terms. |
| @prisma/client | 6.x | Apache-2.0 | Prisma client runtime | Apache-2.0 — permissive. |
| Recharts | 2.x | MIT | Charts (time-series, pie, bar, radar) | MIT — permissive. |
| Framer Motion | 12.x | MIT | Animations (sparingly used) | MIT — permissive. |
| Lucide React (lucide-react) | 0.525.x | ISC | Icon set | ISC — permissive; retain notice. |
| date-fns | 4.x | MIT | Date formatting / arithmetic | MIT — permissive. |
| Sonner | 2.x | MIT | Toast notifications | MIT — permissive. |
| vaul | 1.x | MIT | Drawer primitive | MIT — permissive. |
| embla-carousel-react | 8.x | MIT | Carousel | MIT — permissive. |
| react-day-picker | 9.x | MIT | Date picker | MIT — permissive. |
| react-markdown | 10.x | MIT | Markdown rendering (reports, docs) | MIT — permissive. |
| react-syntax-highlighter | 15.x | MIT | Code highlighting | MIT — permissive. |
| react-resizable-panels | 3.x | MIT | Resizable panels | MIT — permissive. |
| @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities | 6.x / 10.x / 3.x | MIT | Drag-and-drop (zone/rule editor) | MIT — permissive. |
| @reactuses/core | 6.x | MIT | React utility hooks | MIT — permissive. |
| input-otp | 1.x | MIT | OTP input | MIT — permissive. |
| zustand | 5.x | MIT | Client state store | MIT — permissive. |
| next-auth | 4.x | MIT | Auth primitives (architecture for future use; not enabled in V1) | MIT — permissive. |
| next-intl | 4.x | MIT | Internationalization primitives (architecture for future use) | MIT — permissive. |
| next-themes | 0.4.x | MIT | Theme switching | MIT — permissive. |
| uuid | 11.x | MIT | ID generation | MIT — permissive. |
| sharp | 0.34.x | Apache-2.0 | Image processing (frame thumbnails) | Apache-2.0 — permissive; bundles libvips under its own license (LGPL/MIT mix — see sharp's NOTICE). |
| z-ai-web-dev-sdk | 0.0.x | MIT (per package) | Optional SDK scaffolding (not required at runtime) | MIT — permissive. May be removed if unused. |
| bun-types | 1.x | MIT | TypeScript types for Bun runtime | MIT — permissive. Dev-only. |
| eslint, eslint-config-next | 9.x / 16.x | MIT | Linting | MIT — dev-only; not redistributed in runtime. |
| SQLite | 3.x (via Prisma's query engine) | Public Domain | Embedded database | Public domain — no restriction. |
| FFmpeg | 6.x+ (external binary) | LGPL 2.1+ (default build) or GPL (depending on build flags) | Video probing and frame extraction | **External binary**, not bundled as source. Use an LGPL build to avoid GPL obligations. Verify the build flags of the FFmpeg binary you install. See §3. |

> The table reflects `package.json` at the time of writing. Run `bun pm ls` (or `npm ls --all`) in your deployment to confirm exact versions, and re-audit whenever you add or upgrade a dependency.

---

## 2. Notes on Specific Dependencies

### 2.1 Prisma

Prisma is distributed under Apache-2.0. The Prisma query engine binaries are redistributed under the same terms. Attribution requirements are minimal but must be honored in any redistribution that includes the Prisma binaries.

### 2.2 SQLite

SQLite is in the public domain. No attribution is legally required, but it is good practice to acknowledge it in documentation (this document serves that purpose).

### 2.3 sharp

`sharp` bundles prebuilt `libvips` binaries. `libvips` is LGPL. The `sharp` package itself is Apache-2.0. Dynamically linking to LGPL libraries is generally compatible with the proprietary license of AI Traffic Analyzer as long as the LGPL components remain replaceable. If you redistribute, do not statically link libvips.

### 2.4 Radix UI and shadcn/ui

The shadcn/ui component sources are copied into `src/components/ui/` and are MIT-licensed. The Radix primitives they depend on are also MIT. These are permissive and compatible with the proprietary license of AI Traffic Analyzer. The copied component source files retain their original notice in a header comment.

### 2.5 Optional / unused dependencies

`next-auth`, `next-intl`, and `z-ai-web-dev-sdk` are present in the dependency tree but are not required at runtime in V1. You may remove them to slim the dependency surface (audit the import graph before removing). Doing so does not change the license posture.

---

## 3. External Binaries Not Bundled as Source

### 3.1 FFmpeg

FFmpeg is invoked as an external binary on `PATH`. It is **not** bundled as source in this repository. The license of an FFmpeg binary depends on how it was compiled:

| FFmpeg build type | License | Notes |
| --- | --- | --- |
| Default (LGPL) | LGPL 2.1+ | Permits dynamic linking into proprietary software. Recommended. |
| Full / GPL | GPL 2+ | Introduces copyleft obligations on combined works. Avoid for proprietary redistribution unless you understand the implications. |
| With non-free codecs (e.g. libfdk_aac, libx264 in some configs) | Non-free / not redistributable | Do not use in redistributed builds. |

**Recommendation:** Use an LGPL build of FFmpeg. Most distribution-packaged FFmpeg binaries (Debian/Ubuntu, Alpine, Homebrew) are LGPL by default unless explicitly compiled otherwise. Confirm with `ffmpeg -version` (look for `--enable-gpl` or `--enable-nonfree` flags).

### 3.2 Headless Chromium (for PDF export)

PDF export, when enabled via the `enablePdfExport` feature flag, relies on a headless Chromium runtime. The license of Chromium is BSD-3-Clause (permissive). In the default Docker image, a headless Chromium is installed; in native deployments, you must install one yourself. Confirm the license of the specific build you install (most distribution-packaged Chromium binaries are BSD-3-Clause).

---

## 4. Future Dependencies (Re-Audit Required)

The following dependencies are **not** shipped in V1 but are the expected path for buyers who implement the documented **Python/FastAPI vision-worker** extension point (see [AI_PROVIDERS.md](./AI_PROVIDERS.md) §2.3 and [ARCHITECTURE.md](./ARCHITECTURE.md) §10.1). **If and when you add any of these, re-audit this document and your redistribution license posture.**

| Dependency | License (typical) | Use | Notes |
| --- | --- | --- | --- |
| Python | PSF License (BSD-style, permissive) | Language runtime | Permissive. |
| FastAPI | MIT | Web framework for the worker | Permissive. |
| Uvicorn / Starlette | BSD-3-Clause | ASGI server | Permissive. |
| Pydantic | MIT | Data validation | Permissive. |
| OpenCV (`opencv-python`) | Apache-2.0 | Computer-vision operations | Permissive. Bundled native libs have their own licenses — review. |
| NumPy | BSD-3-Clause | Numerical arrays | Permissive. |
| Pillow | HPND (MIT-like) | Image manipulation | Permissive; review HPND text. |
| PyTorch | BSD-3-Clause (PyTorch license; with CUDA EULA caveats for GPU builds) | Model inference | Permissive for CPU; GPU/CUDA builds subject to NVIDIA EULA. |
| ONNX Runtime | MIT | Model inference runtime | Permissive. |
| Ultralytics YOLO (or similar) | AGPL-3.0 (Ultralytics) or permissive alternatives | Detection models | **AGPL-3.0 has copyleft implications** for derivative works served over a network. Choose a model with a permissive license (e.g. Apache-2.0 models) if you intend to deploy commercially without open-sourcing your worker. |
| FFmpeg (Python bindings / subprocess) | LGPL/GPL (see §3.1) | Frame extraction in the worker | Same as §3.1 — use LGPL build. |

> The appearance of these names here is **not** an endorsement and **not** a claim that they are bundled. It is a forward-looking audit checklist for buyers who extend the product along the documented Python/FastAPI path.

---

## 5. License Compatibility Summary

The V1 dependency tree is composed entirely of permissive licenses (MIT, Apache-2.0, BSD-3-Clause, ISC, public domain) plus the LGPL `libvips` (via `sharp`, dynamically linked). This combination is compatible with the proprietary license of AI Traffic Analyzer and with redistribution under all four tiers in [LICENSING.md](./LICENSING.md).

The one component that requires care is **FFmpeg** (external binary) — confirm you are using an LGPL build if you redistribute.

If you add the Python/FastAPI worker and pull in **AGPL**-licensed components (e.g. some YOLO distributions), you may create copyleft obligations for the worker service. Keep the worker as a separate, decoupled process and choose permissively-licensed models to avoid entangling the application's license.

---

## 6. How to Re-Generate This List

```bash
# Production dependencies only
bun pm ls --all 2>/dev/null | grep -v devDependencies

# Or, with npm
npm ls --all --omit=dev

# License summary (with license-checker)
npx license-checker --summary
```

Re-generate this list whenever you add, remove, or upgrade a dependency. Re-audit any new license type that is not already permissive.

---

## 7. Cross-References

- Root `LICENSE.md` — proprietary license of AI Traffic Analyzer itself.
- [LICENSING.md](./LICENSING.md) — tier definitions and redistribution rules.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — extension points that may add dependencies.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — provider adapters and the local-inference worker.
- [SECURITY.md](./SECURITY.md) — dependency audit and telemetry checks.

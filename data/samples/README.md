# Sample Data & Demo Assets

This directory holds sample/demo assets referenced by the **Demo Mode** project.

## What's included

- `downtown-intersection.mp4` — *(not bundled by default)* a sample traffic video.
- `highway-9.mp4` — *(not bundled by default)* a highway survey sample.
- `mall-parking.mp4` — *(not bundled by default)* a parking-lot entrance sample.

## Demo mode works without video files

The **mock provider** generates deterministic synthetic traffic-analysis data
(vehicles, tracks, directions, line crossings, zones, events, congestion) for
the seeded "Downtown Intersection Demo" project. You can explore the entire
product — dashboard, video workspace, results, events, reports — **without
any real video file**.

The `VideoAsset` records reference filenames in this folder, but the analysis
runs against simulated trajectories rendered live on the analysis canvas.

## Adding your own footage

Drop H.264 MP4 files here and reference them from your project's video asset,
or upload through the web UI (uploads are stored under `storage/videos/`).

## Licensing note

Do **not** bundle copyrighted or YouTube footage in any redistribution of this
product. Use only:
- self-created footage,
- appropriately licensed stock footage,
- public-domain/compatible footage, or
- synthetic generated demo data (which is what ships by default).

See `docs/SECURITY.md` and `docs/THIRD_PARTY_LICENSES.md` for the full policy.

# scripts/ — maintenance helpers

## db-seed.ts
Re-seeds the demo project (Downtown Intersection Demo + Highway Survey + Mall Parking) with deterministic mock analysis results.

```bash
bun run db:seed
```

## package-release.sh
Builds a clean release ZIP excluding node_modules, .git, storage, etc.

```bash
bash scripts/package-release.sh
```

Output: `dist/AI-Traffic-Analyzer-v1.0.0.zip`

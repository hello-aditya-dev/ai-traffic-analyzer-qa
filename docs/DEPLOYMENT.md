# Deployment

This document covers production deployment of **AI Traffic Analyzer** using Docker Compose or a native runtime, environment configuration, persistent volumes, backup/restore, data locations, and switching the database to PostgreSQL.

For first-run setup, see [GETTING_STARTED.md](./GETTING_STARTED.md). For hardening, see [SECURITY.md](./SECURITY.md). For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 1. Deployment Models

| Model | When to use | Notes |
| --- | --- | --- |
| Docker Compose | Default for evaluation and most production | Single command, isolated, volumes persist |
| Native (Bun/Node) | Customization, development, constrained hosts | Requires FFmpeg on PATH |
| Standalone Next.js build | Embedded / single-host production | `next build` → standalone output |

The application is a single Next.js process. There is no separate API server in V1. The optional Python/FastAPI vision worker (see [AI_PROVIDERS.md](./AI_PROVIDERS.md) §2.3) is an extension point and not part of the default deployment.

---

## 2. Docker Compose Deployment

### 2.1 Prerequisites

- Docker 24+
- Docker Compose v2 (`docker compose` plugin)
- Sufficient disk for uploads and outputs (50 GB+ recommended for production)
- Outbound network access to your chosen vision provider (if not using `mock`)

### 2.2 Steps

```bash
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer

cp .env.example .env
# Edit .env: at minimum set AI_PROVIDER and AI_API_KEY if using generic-http

docker compose up --build -d
```

The app becomes available at `http://localhost:3000`.

### 2.3 Volumes

`docker-compose.yml` defines bind-mounted volumes so data persists across container restarts:

| Volume | Container path | Purpose |
| --- | --- | --- |
| `db_data` | `/app/db` | SQLite database file (`custom.db`) |
| `storage_videos` | `/app/storage/projects` | Uploaded videos, analysis artifacts, snapshots, reports |
| `storage_outputs` | `/app/storage/exports` | Raw structured exports |

For production, point these at a host directory or a managed volume on fast storage:

```yaml
volumes:
  - /var/traffic-ai/db:/app/db
  - /var/traffic-ai/storage:/app/storage
```

### 2.4 Reverse proxy and TLS

For internet-facing deployments, place AI Traffic Analyzer behind a reverse proxy (Caddy, Traefik, Nginx) that terminates TLS. A sample `Caddyfile` is included at the repo root:

```text
traffic.example.com {
  reverse_proxy localhost:3000
}
```

Run Caddy as a separate container or service and let it obtain certificates automatically.

### 2.5 Resource limits

In production, set memory and CPU limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

The mock provider is CPU-light. The `generic-http` provider's footprint depends on outbound concurrency and frame payloads. The (future) local-inference worker is the heavy consumer — give it its own container with GPU access if applicable.

---

## 3. Native Deployment

### 3.1 Prerequisites

- Bun 1.1+ (recommended) or Node.js 20+
- FFmpeg 6+ on `PATH`
- Write access to `db/` and `storage/`

### 3.2 Build and run

```bash
bun install
bun run db:push
bun run build
bun run start
```

`bun run start` invokes the Next.js standalone server (see `next.config.ts`: `output: "standalone"`).

### 3.3 Run as a service

Use a process manager (systemd, pm2, or `systemd-run`) to keep the app alive:

```ini
# /etc/systemd/system/traffic-ai.service
[Unit]
Description=AI Traffic Analyzer
After=network.target

[Service]
Type=simple
User=traffic
WorkingDirectory=/opt/traffic-ai-analyzer
EnvironmentFile=/opt/traffic-ai-analyzer/.env
ExecStart=/opt/traffic-ai-analyzer/node_modules/.bin/next start -p 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

(Adjust `ExecStart` to your runtime — `bun .next/standalone/server.js` for Bun.)

---

## 4. Environment Variables

All configuration is read from `.env`. The full reference:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./db/custom.db` | Prisma datasource URL. SQLite path or PostgreSQL URL. |
| `AI_PROVIDER` | `mock` | Active provider adapter: `mock`, `generic-http`, `local-inference`. |
| `AI_API_BASE_URL` | _empty_ | Base URL for `generic-http` / `local-inference` adapters. |
| `AI_API_KEY` | _empty_ | API key / bearer token sent to the provider. Server-side only. |
| `AI_MODEL` | _empty_ | Model identifier passed to the provider. |
| `VIDEO_STORAGE_PATH` | `./storage/projects` | Root directory for uploaded videos and per-project artifacts. |
| `OUTPUT_STORAGE_PATH` | `./storage/exports` | Root directory for raw structured exports (CSV/JSON). |
| `MAX_UPLOAD_MB` | `512` | Maximum upload size for video files, in megabytes. |
| `DEFAULT_FRAME_RATE` | `2` | Default frames-per-second sampling rate (overridable per run). |
| `NODE_ENV` | `production` | Node runtime environment. Set `development` for dev server. |
| `PORT` | `3000` | HTTP port the app listens on. |
| `ALLOW_INSECURE_PROVIDER_HTTP` | `false` | If `true`, permits sending API keys over plain HTTP (dev only). |
| `LOG_LEVEL` | `info` | Log verbosity: `debug`, `info`, `warn`, `error`. |

> The `ProviderConfig` database row stores runtime overrides for `apiUrl`, `apiKey`, `model`, `timeout`, `retries`, `frameRate`, `maxFrames`, `resolution`, `confidence`. The UI form writes here; env vars are the fallback. See [AI_PROVIDERS.md](./AI_PROVIDERS.md).

---

## 5. Switching to PostgreSQL

V1 ships with SQLite by default. PostgreSQL is supported for production deployments that need concurrent writers or managed backups.

### 5.1 Steps

1. Provision a PostgreSQL 14+ database.
2. Update `.env`:

   ```env
   DATABASE_URL=postgresql://user:password@postgres-host:5432/traffic_ai?schema=public
   ```

3. Update the Prisma datasource provider in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. Re-generate the client and push the schema:

   ```bash
   bun run db:generate
   bun run db:push
   ```

5. Restart the app.

### 5.2 Migrating data from SQLite

For evaluation-to-production migrations, export your SQLite data to SQL and re-import into PostgreSQL, or write a small Prisma-based script that reads from SQLite and writes to PostgreSQL. The schema is identical; only types differ (e.g. `String` JSON columns become `Json`).

---

## 6. Where Data Is Stored

### 6.1 Database

- **SQLite (default):** `db/custom.db` (relative to the app working directory). In Docker, bind-mounted as a volume.
- **PostgreSQL (optional):** your managed instance.

### 6.2 Filesystem

```text
<VIDEO_STORAGE_PATH>/                 # default: ./storage/projects
  projects/<project-id>/
    videos/<video-id>.mp4
    analysis/<analysis-id>/frames/, detections.json, tracks.json
    snapshots/<event-id>.jpg
    clips/<event-id>.mp4
    reports/<report-id>.{html,csv,json,pdf}
<OUTPUT_STORAGE_PATH>/                # default: ./storage/exports
  exports/<export-id>.{csv,json}
```

### 6.3 Logs

- Dev: `dev.log` and `server.log` (tee'd from the dev/start scripts in `package.json`).
- Docker: `docker compose logs -f traffic-ai`.
- Native/systemd: journald.

Secrets are never logged (see [SECURITY.md](./SECURITY.md)).

---

## 7. Backup and Restore

### 7.1 What to back up

| Asset | Location | Why |
| --- | --- | --- |
| Database file (SQLite) | `db/custom.db` | All project metadata, analyses, events, configurations |
| Storage tree | `storage/` | Source videos, snapshots, reports, exports |
| `.env` | repo root | Provider config, storage paths (keep secrets secure) |

### 7.2 Backup procedure (SQLite + filesystem)

```bash
# Stop the app to avoid writes during backup
docker compose stop traffic-ai

# Backup the database file
cp /var/traffic-ai/db/custom.db /backups/custom-$(date +%F).db

# Backup the storage tree
tar czf /backups/storage-$(date +%F).tar.gz /var/traffic-ai/storage

# Backup .env (store off-host, encrypted)
cp /opt/traffic-ai-analyzer/.env /backups/env-$(date +%F)

# Restart
docker compose start traffic-ai
```

For PostgreSQL, use `pg_dump`:

```bash
pg_dump "$DATABASE_URL" -F c -f /backups/traffic-ai-$(date +%F).dump
```

### 7.3 Restore procedure

```bash
docker compose stop traffic-ai

# Restore database
cp /backups/custom-2025-01-01.db /var/traffic-ai/db/custom.db

# Restore storage
tar xzf /backups/storage-2025-01-01.tar.gz -C /

# Restore .env
cp /backups/env-2025-01-01 /opt/traffic-ai-analyzer/.env

docker compose start traffic-ai
```

For PostgreSQL:

```bash
pg_restore -d "$DATABASE_URL" -c /backups/traffic-ai-2025-01-01.dump
```

### 7.4 Recommended cadence

- Daily: database + storage snapshot.
- Weekly: full off-host copy.
- After every schema migration: immediate backup before pushing to production.

---

## 8. Upgrades

1. Back up (§7.2).
2. Pull the new code:

   ```bash
   git pull origin main
   ```

3. Review `CHANGELOG.md` for breaking changes.
4. Rebuild and run any migrations:

   ```bash
   bun install
   bun run db:push     # idempotent; safe for additive schema changes
   bun run build       # native; or `docker compose up --build -d` for Docker
   ```

5. Restart.

For Docker:

```bash
docker compose up --build -d
```

---

## 9. Health Checks and Monitoring

| Check | How |
| --- | --- |
| App responds | `curl -fsS http://localhost:3000/api/health` (or `/`) |
| Database reachable | Onboarding screen status, or `sqlite3 db/custom.db ".tables"` |
| Storage writable | Upload a small test video |
| Provider healthy | Settings → AI Provider → Test connection |
| Disk free | `df -h` on the storage volume |

Add external monitoring (Uptime Kuma, Prometheus + `node_exporter`, CloudWatch) to the host. The application logs structured JSON lines at `LOG_LEVEL=info` by default.

---

## 10. Multi-Instance Considerations

V1 is designed as a single-instance deployment. If you horizontally scale:

- Move to **PostgreSQL** (SQLite does not handle concurrent writers well).
- Put `VIDEO_STORAGE_PATH` and `OUTPUT_STORAGE_PATH` on **shared/networked storage** accessible from every instance (NFS, S3 via mount, etc.).
- Place a sticky-session load balancer in front, or ensure that long-running analysis jobs are pinned to one instance (the analysis pipeline is not currently distributed).

Multi-tenant SaaS is explicitly out of scope for V1.

---

## 11. Cross-References

- [GETTING_STARTED.md](./GETTING_STARTED.md) — install and first run.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — pipeline, storage layout, provider model.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — provider configuration.
- [SECURITY.md](./SECURITY.md) — hardening checklist.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common deployment issues.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — branding, feature flags, defaults.

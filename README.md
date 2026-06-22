# SWYP Backend

Node/Express API for Somali Women and Youth for Peace Organization.

## Storage rule

Uploaded files are never stored on the VPS filesystem. The frontend requests a signed upload URL from the backend, uploads directly to Cloudflare R2, then saves only the public CDN URL, R2 key, and metadata in MongoDB.

R2 folders:

- `swyp/projects`
- `swyp/programs`
- `swyp/news`
- `swyp/team`
- `swyp/documents`
- `swyp/policies`
- `swyp/reports`
- `swyp/resources`
- `swyp/donors`
- `swyp/organization`

## Roles

- Super Admin: upload, edit, delete
- Admin: upload, edit
- Editor: upload only

## Upload API

0. `GET /api/uploads/config`

Returns non-secret upload configuration status. Use this to confirm whether Cloudflare R2 signing is ready.

```json
{
  "r2": {
    "configured": false,
    "missing": [
      "CLOUDFLARE_R2_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID"
    ],
    "prefix": "swyp"
  }
}
```

1. `POST /api/uploads/sign`

```json
{
  "folder": "projects",
  "filename": "dialogue.jpg",
  "contentType": "image/jpeg",
  "size": 204800
}
```

Returns a presigned `uploadUrl`, R2 `key`, and public CDN URL.

2. Upload the file directly to `uploadUrl` using HTTP `PUT`.

3. `POST /api/uploads/complete`

```json
{
  "folder": "projects",
  "key": "swyp/projects/...",
  "url": "https://cdn.somaliwomenyouthpeace.org/projects/...",
  "originalName": "dialogue.jpg",
  "contentType": "image/jpeg",
  "size": 204800
}
```

## Content API

Generic CRUD is available for:

`projects`, `programs`, `news`, `team`, `documents`, `policies`, `reports`, `resources`, `donors`, `organization`.

Routes:

- `GET /api/:type`
- `GET /api/:type/:id`
- `POST /api/:type`
- `PUT /api/:type/:id`
- `DELETE /api/:type/:id`

Delete operations remove attached R2 objects using their stored `media[].key` values, then remove MongoDB records.

## Setup

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Local upload folders such as `uploads/`, `public/uploads/`, or `tmp/uploads/` are intentionally ignored and must not be used. Configure R2 credentials in `.env` before using admin file uploads.

## Production

Use `NODE_ENV=production`, a random `JWT_SECRET` of at least 32 characters, `TRUST_PROXY=1` behind a single Nginx/Cloudflare proxy, and the public frontend origins in `FRONTEND_URL`. The API exposes `GET /api/health/live` for process liveness and `GET /api/health` for MongoDB readiness.

# Phase 03 — List query contract (`GET /api/records/:typeKey`)

Stable query parameters for per-type listing. Mental model aligns with v1 **`list_posts(post_type, query)`**; shape is explicit JSON for filters so clients avoid ambiguous query-string encoding.

## Authentication & authorization

- Requires authenticated user with **`records.<typeKey>.read`** (existing `requireRecordVerb`).

## Pagination

| Param | Default | Constraints |
|--------|---------|--------------|
| `limit` | `50` | Integer 1–100 |
| `offset` | `0` | Integer ≥ 0 |

Response includes `pagination: { limit, offset, total }` where **`total`** is the count matching **filters + search** (not just the current page).

## Sort

| Param | Example | Behaviour |
|--------|---------|-----------|
| `sort` | `updated_at`, `-updated_at`, `created_at`, `-created_at` | Prefix `-` → descending. Defaults to `-updated_at`. |
| `sort` | `name`, `-name` | Orders by `records.data->>'name'` **text sort** (lexicographic). |

Unknown `sort` values → **400** with message.

## Free-text search (optional)

| Param | Behaviour |
|--------|-----------|
| `q` | If non-empty string: `records.data->>'name'` **ILIKE** `%q%` (trimmed, max length 200). |

Combinable with `filters`.

## Structured filters (optional)

| Param | Format |
|--------|--------|
| `filters` | URL-encoded JSON object: **`{ "<field_key>": "<string>" }`**. Values must be **strings** for this milestone. |

**Rules**

- Only **field keys registered** on `record_type_fields` for the requested type may appear in `filters`. Unknown keys → **400**.
- Each condition is **`data->>'field_key' = value`** (string equality).
- Omit `filters` or use `{}` for no equality filters.

**Example**

```http
GET /api/records/contacts?limit=25&offset=0&sort=-updated_at&q=alex&filters=%7B%22overall_status%22%3A%22active%22%7D
```

Decoded `filters`: `{"overall_status":"active"}`.

## Response shape (unchanged from Phase 02 list)

Top-level keys:

- `type_key`
- `records`: array of `{ id, type_key, created_at, updated_at, created_by, data }`
- `pagination`

Additional optional meta (future): cursor, applied filter echo, canonical sort applied.

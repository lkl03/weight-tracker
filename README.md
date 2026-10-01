# Weight Tracker

Daily weight tracking app with a Telegram bot and a modern dashboard.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Recharts · Firebase (Firestore) · Telegram Bot API · Vercel

---

## Features

- **Dashboard** with weight evolution chart, 7-day / 30-day moving averages, weekly/monthly averages, daily delta, and 10 summary cards (BMI, streak, goal diff, etc.)
- **History table** with full CRUD — filter by period/year/month, search notes, inline edit, delete, CSV export
- **Telegram bot** — send `HH:MM PESO` to register a weigh-in; bot compares with previous entry and replies with contextual feedback
- **Daily reminder** — Vercel Cron job at 23:00 Buenos Aires time: if no entry for the day, auto-fills with previous weight and notifies via Telegram
- **586 historical records** imported from the original Excel (2024-03-04 → 2026-05-01)

---

## Why Firestore (not a JSON file)

Vercel's serverless runtime has a **read-only filesystem** — writes made at runtime are not persisted between function invocations or deployments. A `.json` file works only as a static seed; it cannot be the source of truth for runtime writes.

The data is a single daily number, so a document store is plenty. **Firestore** (Firebase project `weight-tracker-lkl`, region `southamerica-east1`) is used because:
- Free tier covers this app many times over (1 GiB storage, 50k reads / 20k writes per day)
- All access goes through the Next.js server with the Admin SDK; client access is denied by `firestore.rules`
- No infrastructure to manage

> Originally ran on Supabase. Migrated to Firestore on 2026-10-01 (document ids = original Supabase UUIDs, field names unchanged); the one-off migration script is in commit 11e6dee. The old Supabase project was paused after a verified backup.

---

## Environment Variables

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project id (`weight-tracker-lkl`) |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (one line, `
` escaped, quoted) |
| `TELEGRAM_BOT_TOKEN` | Token from BotFather |
| `TELEGRAM_ALLOWED_CHAT_ID` | Your Telegram numeric chat ID |
| `TELEGRAM_WEBHOOK_SECRET` | Random string to validate webhook calls |
| `CRON_SECRET` | Random string to protect the cron endpoint |
| `APP_PASSWORD` | Password to log in to the dashboard, history and entries API |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app (used in bot help) |

Copy `.env.local.example` to `.env.local` and fill in all values.

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/lkl03/weight-tracker.git
cd weight-tracker
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Deploy Firestore rules + indexes (only needed once per project)
firebase deploy --only firestore

# 4. Seed historical data (586 records from Excel)
npm run seed

# 5. Start dev server
npm run dev
# Open http://localhost:3000
```

---

## Firebase Setup

1. Firebase project: `weight-tracker-lkl` · Firestore (native mode) in `southamerica-east1`
2. `firebase deploy --only firestore` publishes `firestore.rules` (deny all client access) and `firestore.indexes.json` (composite index on `date` + `time`)
3. Server credentials: service account `weight-tracker-server@weight-tracker-lkl.iam.gserviceaccount.com` with role **Cloud Datastore User**. Create a key with:
   ```bash
   gcloud iam service-accounts keys create key.json --iam-account=weight-tracker-server@weight-tracker-lkl.iam.gserviceaccount.com
   ```
   and copy `project_id`, `client_email`, `private_key` into the `FIREBASE_*` variables. Delete `key.json` afterwards.

**Data model:** collection `weight_entries`, one document per weigh-in, id = UUID. Fields: `date` (YYYY-MM-DD), `time` (HH:MM:SS), `weight_kg` (number), `notes`, `source` (`telegram` | `manual` | `auto-filled` | `import`), `created_at`, `updated_at` (ISO strings).

---

## Telegram Bot Setup

### 1. Create the bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. `Weight Tracker Luca`) and a username (e.g. `lucaweightbot`)
4. Copy the token → `TELEGRAM_BOT_TOKEN`

### 2. Get your chat ID

1. Start a conversation with your bot (send any message to activate it)
2. Open: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":XXXXXXXXX}` — that number is your `TELEGRAM_ALLOWED_CHAT_ID`

### 3. Set the webhook

After deploying to Vercel, run this once (replace values):

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/telegram",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

Expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`

### 4. Test the bot

Send these messages to your bot:

```
ayuda
```
→ Shows help guide with examples

```
8:55 73.2
```
→ Registers today's weight at 8:55, compares with previous entry

---

## Cron Job (Daily Reminder at 23:00 Buenos Aires)

`vercel.json` configures a Vercel Cron Job:

```json
{ "crons": [{ "path": "/api/cron", "schedule": "0 2 * * *" }] }
```

`0 2 * * *` = 02:00 UTC = **23:00 America/Argentina/Buenos_Aires**

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` — just set `CRON_SECRET` in Vercel environment variables.

**Behavior:**
- Entry exists for today → skips silently
- No entry today → auto-fills with yesterday's weight (tagged `auto-filled`), sends Telegram notification

---

## Deploy to Vercel

Connect the GitHub repo in the Vercel dashboard, or:

```bash
npm i -g vercel
vercel --prod
```

Set all 9 environment variables in **Vercel → Project → Settings → Environment Variables**.

After deploying, set the Telegram webhook URL to `https://your-app.vercel.app/api/telegram`.

---

## Access

The whole app is behind a single password (`APP_PASSWORD`). `src/proxy.ts` checks an httpOnly session cookie (30 days, HMAC keyed by the password) on every page and API route; logged-out visitors are sent to `/login`, and API calls get `401`. Changing `APP_PASSWORD` logs out all sessions.

`/api/telegram` and `/api/cron` are exempt from the cookie check because they authenticate with their own secrets (`TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`).

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth` | Log in (`{ password }`) — sets the session cookie |
| `DELETE` | `/api/auth` | Log out |
| `GET` | `/api/entries` | List all entries (`from`, `to`, `limit` params) — requires session |
| `POST` | `/api/entries` | Create entry |
| `PATCH` | `/api/entries/:id` | Update entry |
| `DELETE` | `/api/entries/:id` | Delete entry |
| `POST` | `/api/telegram` | Telegram webhook |
| `GET` | `/api/cron` | Daily reminder (called by Vercel Cron) |

---

## Historical Data Import

- **Source:** `CONTROLPESODIARIO_DASH.xlsx` → sheet `2024-25-26`
- **Records:** 586 entries
- **Range:** 2024-03-04 → 2026-05-01
- **Min:** 67 kg · **Max:** 79.8 kg
- All imported records are tagged `source: "import"`

To re-import: `npm run seed` (uses upsert — safe to run multiple times)

---

## Profile Config

- **Name:** Luca · **DOB:** 14/02/2003 · **Height:** 180 cm · **Goal:** 72 kg

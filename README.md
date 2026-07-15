# Church Devotion App

A daily devotion mobile app for a single church, built with Expo (React Native) and Supabase.

## Features

- **Today** — daily devotion with scripture, reflection, and a bookmark toggle
- **Reading Plans** — multi-day plans members can start and track progress on
- **Prayer Wall** — members post prayer requests (optionally anonymous) and tap to say they're praying
- **Hymn Book** — searchable hymn lyrics with favorites
- **Profile** — daily reminder notification settings, saved devotions, sign out
- **Admin dashboard** (role-gated) — church staff can write/schedule devotions, manage reading plans and hymns, and moderate prayer requests, all from the app itself — no separate CMS needed

## Stack

- Expo SDK 57 + expo-router (file-based navigation, `Stack.Protected` for auth/role gating)
- Supabase (Postgres, Auth, Row Level Security) via `@supabase/supabase-js`
- `expo-notifications` for local daily reminders + Expo push token registration

## 1. Create your Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration in order:
   - `supabase/migrations/0001_init.sql` — creates all tables, RLS policies, and triggers
   - `supabase/seed.sql` (optional) — adds a couple of sample devotions and hymns so the app isn't empty on first run
3. Go to Project Settings → API and copy the **Project URL** and **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Install and run

```bash
npm install
npm run start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go on a physical device.

> Node 20.19.4+ is recommended (Expo SDK 57's React Native tooling requires it). Node 20.18 works for install/typecheck but you may see engine warnings.

## 4. Make yourself an admin

Sign up in the app normally, then in the Supabase SQL editor run:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

You'll find your user's UUID under Authentication → Users. Once promoted, the **Admin dashboard** link appears on the Profile tab.

## 5. Push notifications (optional, for real devices)

The daily reminder is a **local** notification scheduled on-device from each member's Profile settings — no server needed for that part to work.

To also enable Expo push tokens (needed if you later want the admin panel to push a notification to everyone when a new devotion is published):

1. Run `eas init` (requires an [Expo account](https://expo.dev)) to generate a project ID.
2. Paste that ID into `app.json` → `expo.extra.eas.projectId`.
3. Push tokens are then saved automatically per-device to the `push_tokens` table on sign-in.

Sending a push to all tokens would be a small Supabase Edge Function that calls Expo's push API (`https://exp.host/--/api/v2/push/send`) with the tokens from that table — not included yet since it needs a live, authenticated Supabase project to deploy.

## Project structure

```
app/
  (auth)/          sign in / sign up
  (tabs)/          Today, Plans, Prayer, Hymns, Profile
  admin/           role-gated CMS: devotions, plans, hymns, prayer moderation
  devotion/[id]     devotion detail (from bookmarks)
  bookmarks.tsx     saved devotions list
src/
  lib/             supabase client, notifications helpers
  hooks/           auth context
  components/      shared UI (Button, TextField, Card)
  types/           hand-written types matching the SQL schema
supabase/
  migrations/      schema + RLS policies
  seed.sql         sample content
```

## Localization

The app ships in English, French, Yoruba, Igbo, and Hausa. **English and French
UI text have been reviewed; Yoruba, Igbo, and Hausa are best-effort
translations of the interface chrome that have not been reviewed by a native
speaker** — treat them as a starting point and have someone fluent check
`src/locales/{yo,ig,ha}/common.json` before relying on them in production.
Devotion and scripture content is always admin-authored per language (see
`devotions.language` and `devotion_scripture_versions`), never
machine-translated.

## Known trade-offs (MVP scope)

- The admin CMS lives inside the same mobile app rather than a separate web dashboard, so church staff can manage content from a phone or tablet without any extra tooling.
- Analytics, bulk devotion scheduling, and offline caching are intentionally minimal (a handful of stat cards, sequential draft creation, and cache-first reads for Today/Hymns only) rather than general-purpose systems — see the codebase for what's actually implemented.
- Sermon audio requires uploading files to Supabase Storage and pasting the public URL into the admin sermon editor; there's no in-app upload flow.
- Home-screen widget support is Android-only; iOS WidgetKit support would need to be authored on a Mac and isn't included.

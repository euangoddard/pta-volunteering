# PTA Volunteering 🙌

Volunteer signups for **Sandhills Community Primary School** PTA events.

A PTA admin creates an event with one or more time slots. The app generates a
hard-to-guess shareable link (nanoid + event-name slug, e.g.
`/e/VnsAiXeazOr2OwXzjPdpN/summer-fair-2026/`). Parents open the link and sign
up for slots — no account or login needed. The admin area shows who has
volunteered for which slot.

Built with [Qwik City](https://qwik.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
and [Cloudflare Workers](https://workers.cloudflare.com/), storing data in
[D1](https://developers.cloudflare.com/d1/) with a
[KV](https://developers.cloudflare.com/kv/) lookup for canonical event links.

## Features

- **Events with multiple time slots** — each slot has an optional label
  (e.g. "Cake stall"), start/end times and a helper capacity.
- **Hard-to-guess URLs** — event ids are 21-character nanoids; signup pages
  are `noindex`. A wrong or missing slug redirects to the canonical URL
  (id → slug resolved via KV).
- **No-auth public signup** — name + email (validated), optional phone/note,
  one or more slots per signup. Works without JavaScript too.
- **Capacity enforcement** — the capacity check happens inside the SQL
  `INSERT`, so concurrent signups can never overfill a slot. Full slots are
  shown greyed out.
- **Basic-auth admin** — `/admin/` lists events, creates events with dynamic
  slot rows, shows the shareable link (copy button), the volunteer roster per
  slot, and supports removing volunteers / deleting events.

## Local development

```shell
npm install
cp .dev.vars.example .dev.vars   # then edit the admin credentials
npm run db:migrate               # apply D1 migrations to the local database
npm run dev                      # http://localhost:5173
```

- The admin area is at `/admin/`, protected with the `ADMIN_USERNAME` /
  `ADMIN_PASSWORD` from `.dev.vars`.
- In dev mode the app uses wrangler's platform proxy (miniflare), so D1 and
  KV work locally and persist under `.wrangler/state/` — the same state that
  `wrangler d1 execute DB --local ...` and `npm run db:migrate` operate on.
- To test the actual Workers runtime with the production build:

```shell
npm run build
npm run serve                    # wrangler dev → http://localhost:8787
```

## Deploying

1. Create the real resources and paste their ids into `wrangler.jsonc`:

   ```shell
   wrangler d1 create pta-volunteering        # → d1_databases[0].database_id
   wrangler kv namespace create EVENT_LINKS   # → kv_namespaces[0].id
   ```

2. Apply migrations to the remote database:

   ```shell
   npm run db:migrate.remote
   ```

3. Set the admin credentials as secrets:

   ```shell
   wrangler secret put ADMIN_USERNAME
   wrangler secret put ADMIN_PASSWORD
   ```

4. Build and deploy:

   ```shell
   npm run build
   npm run deploy
   ```

After changing bindings in `wrangler.jsonc`, regenerate types with
`npm run cf-typegen`.

## Project structure

```
├── migrations/            D1 SQL migrations (events, slots, volunteers)
├── src/
│   ├── lib/
│   │   ├── db.ts          Data access (create/list events, signups, roster)
│   │   ├── format.ts      Date / slot label formatting
│   │   ├── ids.ts         nanoid ids + name slugs
│   │   └── platform.ts    Cloudflare bindings (with vite-dev miniflare proxy)
│   └── routes/
│       ├── index.tsx              Public landing page
│       ├── e/[id]/                id-only link → canonical URL (via KV)
│       ├── e/[id]/[slug]/         Public signup page (no auth)
│       └── admin/                 Basic-auth admin (list / new / detail)
└── wrangler.jsonc         Worker config: D1 + KV bindings, assets
```

## Brand

Styling follows the [Sandhills Community Primary School](https://www.sandhillsprimary.org/)
brand: deep plum `#571226`, burnt orange `#c64d08`, Open Sans, and the school
motto — _Respect · Resilience · Relationships · Responsibility_.

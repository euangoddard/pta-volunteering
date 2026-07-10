# PTA Volunteering

Volunteer signups for Sandhills Community Primary School PTA events. Built
with Qwik City and Tailwind CSS 4 on Cloudflare Workers, with D1 (data) and
KV (canonical event links). See README.md for setup, deployment, and project
structure.

## Design Context

### Users

- **Parents/carers** (primary): busy adults opening a private signup link from
  email, the school newsletter, or a class group chat — usually on a phone,
  often in a spare moment. Their job: pick a time slot and sign up in under a
  minute, with no account or login. Signing up should feel like being thanked
  for helping, not filling in a form.
- **PTA admins** (secondary): a handful of volunteers using the basic-auth
  `/admin/` area to create events with time slots, share links (copy button +
  QR), and check the volunteer roster. Their job: set up an event quickly and
  see at a glance who's helping when.

### Brand Personality

Warm, welcoming, community-minded. The app follows the Sandhills Community
Primary School identity but with a friendlier, softer PTA expression than the
school website itself — a neighbourly "lend a hand" voice, gratitude-forward
copy ("Thank you for lending a hand!"), and the school motto woven in:
_Respect · Resilience · Relationships · Responsibility_.

Three words: **warm, trustworthy, effortless**.

### Aesthetic Direction

- **Palette**: school brand colours — deep plum `#571226` (Tailwind `plum-*`
  scale) as the anchor, burnt orange `#c64d08` (`flame-*` scale) as the
  accent. Full 50–950 scales are defined in `src/global.css` via Tailwind 4
  `@theme`. Light backgrounds are `plum-50`; body text is `gray-800`.
- **Typography**: Open Sans everywhere (`--font-sans`).
- **Feel**: soft cards (rounded-2xl, subtle borders, light shadows) on a warm
  plum-tinted background; a bold plum header with a flame underline; friendly
  emoji accents (🙌) used sparingly.
- **Theme**: light mode only — no dark mode.
- **Anti-references**: not corporate SaaS, not a sterile form-builder, not
  childish/clip-art despite the primary-school context. Institutional
  stiffness is as wrong as excessive whimsy.

### Design Principles

1. **One-minute signup** — every design decision on public pages serves a
   parent completing a signup fast on a phone. No steps, fields, or flourishes
   that slow that down (phone number is intentionally required).
2. **Works without JavaScript** — public signup must remain fully functional
   with JS disabled; progressive enhancement only.
3. **Gratitude over bureaucracy** — copy and visuals should make volunteers
   feel appreciated. Confirmations celebrate; errors are kind and specific.
4. **School colours, PTA warmth** — stay within the plum/flame palette and
   Open Sans, but express them softly; the brand is a constraint, not a cage.
5. **Accessible by default (WCAG AA)** — AA contrast, visible focus states,
   semantic HTML, keyboard-friendly forms, mobile-first layouts. Full slots
   are communicated by more than colour alone.

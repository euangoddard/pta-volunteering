import { newId, slugify } from "./ids";

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  group_id: string | null;
  created_at: string;
}

export interface EventGroupRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}

export interface SlotRecord {
  id: string;
  event_id: string;
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  position: number;
}

export interface VolunteerRecord {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  created_at: string;
}

export interface SlotWithCount extends SlotRecord {
  volunteer_count: number;
}

export interface SlotWithVolunteers extends SlotWithCount {
  volunteers: VolunteerRecord[];
}

export interface NewSlot {
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
}

export interface NewEvent {
  name: string;
  description: string;
  event_date: string;
  location: string;
  group_id: string | null;
  slots: NewSlot[];
}

export function eventPath(event: Pick<EventRecord, "id" | "slug">): string {
  return `/e/${event.id}/${event.slug}/`;
}

export function groupPath(group: Pick<EventGroupRecord, "id" | "slug">): string {
  return `/g/${group.id}/${group.slug}/`;
}

// Group entries share the EVENT_LINKS namespace with events; the prefix keeps
// a group id from ever resolving as an event link (and vice versa).
const GROUP_LINK_PREFIX = "group:";

export async function createEvent(env: Env, data: NewEvent): Promise<EventRecord> {
  const id = newId();
  const slug = slugify(data.name);
  const statements = [
    env.DB.prepare(
      `INSERT INTO events (id, slug, name, description, event_date, location, group_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, slug, data.name, data.description, data.event_date, data.location, data.group_id),
    ...data.slots.map((slot, i) =>
      env.DB.prepare(
        `INSERT INTO slots (id, event_id, label, starts_at, ends_at, capacity, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(newId(), id, slot.label, slot.starts_at, slot.ends_at, slot.capacity, i),
    ),
  ];
  await env.DB.batch(statements);
  // Remember the canonical slug so shared links with a stale slug still resolve.
  await env.EVENT_LINKS.put(id, slug);
  const event = await getEvent(env, id);
  if (!event) {
    throw new Error("Event was not created");
  }
  return event;
}

export async function getEvent(env: Env, id: string): Promise<EventRecord | null> {
  return env.DB.prepare(`SELECT * FROM events WHERE id = ?`)
    .bind(id)
    .first<EventRecord>();
}

export async function getCanonicalSlug(env: Env, id: string): Promise<string | null> {
  return env.EVENT_LINKS.get(id);
}

export interface NewEventGroup {
  name: string;
  description: string;
}

export async function createGroup(
  env: Env,
  data: NewEventGroup,
): Promise<EventGroupRecord> {
  const id = newId();
  const slug = slugify(data.name);
  await env.DB.prepare(
    `INSERT INTO event_groups (id, slug, name, description) VALUES (?, ?, ?, ?)`,
  )
    .bind(id, slug, data.name, data.description)
    .run();
  // Remember the canonical slug so shared links with a stale slug still resolve.
  await env.EVENT_LINKS.put(GROUP_LINK_PREFIX + id, slug);
  const group = await getGroup(env, id);
  if (!group) {
    throw new Error("Event group was not created");
  }
  return group;
}

export async function getGroup(env: Env, id: string): Promise<EventGroupRecord | null> {
  return env.DB.prepare(`SELECT * FROM event_groups WHERE id = ?`)
    .bind(id)
    .first<EventGroupRecord>();
}

export async function getCanonicalGroupSlug(env: Env, id: string): Promise<string | null> {
  return env.EVENT_LINKS.get(GROUP_LINK_PREFIX + id);
}

export interface EventGroupListItem extends EventGroupRecord {
  event_count: number;
}

export async function listGroups(env: Env): Promise<EventGroupListItem[]> {
  const { results } = await env.DB.prepare(
    `SELECT g.*,
        (SELECT COUNT(*) FROM events e WHERE e.group_id = g.id) AS event_count
     FROM event_groups g ORDER BY g.created_at DESC`,
  ).all<EventGroupListItem>();
  return results;
}

export async function setEventGroup(
  env: Env,
  eventId: string,
  groupId: string | null,
): Promise<void> {
  await env.DB.prepare(`UPDATE events SET group_id = ? WHERE id = ?`)
    .bind(groupId, eventId)
    .run();
}

/** Deletes a group; its events survive, just no longer grouped. */
export async function deleteGroup(env: Env, id: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`UPDATE events SET group_id = NULL WHERE group_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM event_groups WHERE id = ?`).bind(id),
  ]);
  await env.EVENT_LINKS.delete(GROUP_LINK_PREFIX + id);
}

export async function getSlotsWithCounts(env: Env, eventId: string): Promise<SlotWithCount[]> {
  const { results } = await env.DB.prepare(
    `SELECT s.*, (SELECT COUNT(*) FROM volunteers v WHERE v.slot_id = s.id) AS volunteer_count
     FROM slots s WHERE s.event_id = ? ORDER BY s.position`,
  )
    .bind(eventId)
    .all<SlotWithCount>();
  return results;
}

export async function getSlotsWithVolunteers(
  env: Env,
  eventId: string,
): Promise<SlotWithVolunteers[]> {
  const slots = await getSlotsWithCounts(env, eventId);
  const { results: volunteers } = await env.DB.prepare(
    `SELECT v.* FROM volunteers v
     JOIN slots s ON s.id = v.slot_id
     WHERE s.event_id = ? ORDER BY v.created_at`,
  )
    .bind(eventId)
    .all<VolunteerRecord>();
  return slots.map((slot) => ({
    ...slot,
    volunteers: volunteers.filter((v) => v.slot_id === slot.id),
  }));
}

export interface EventListItem extends EventRecord {
  slot_count: number;
  capacity_total: number;
  volunteer_count: number;
}

const EVENT_LIST_SELECT = `SELECT e.*,
    (SELECT COUNT(*) FROM slots s WHERE s.event_id = e.id) AS slot_count,
    (SELECT COALESCE(SUM(s.capacity), 0) FROM slots s WHERE s.event_id = e.id) AS capacity_total,
    (SELECT COUNT(*) FROM volunteers v JOIN slots s ON s.id = v.slot_id WHERE s.event_id = e.id) AS volunteer_count
  FROM events e`;

export async function listEvents(env: Env): Promise<EventListItem[]> {
  const { results } = await env.DB.prepare(
    `${EVENT_LIST_SELECT} ORDER BY e.event_date DESC, e.created_at DESC`,
  ).all<EventListItem>();
  return results;
}

/** Events in a group, soonest first (chronological for the landing page). */
export async function listGroupEvents(env: Env, groupId: string): Promise<EventListItem[]> {
  const { results } = await env.DB.prepare(
    `${EVENT_LIST_SELECT} WHERE e.group_id = ? ORDER BY e.event_date ASC, e.created_at ASC`,
  )
    .bind(groupId)
    .all<EventListItem>();
  return results;
}

export interface SignupResult {
  slotId: string;
  ok: boolean;
}

/**
 * Adds a volunteer to each selected slot, skipping any slot that is already
 * full. The capacity check happens inside the INSERT itself so concurrent
 * signups cannot overfill a slot.
 */
export async function addVolunteer(
  env: Env,
  eventId: string,
  slotIds: string[],
  volunteer: { name: string; email: string; phone: string; note: string },
): Promise<SignupResult[]> {
  const results: SignupResult[] = [];
  for (const slotId of slotIds) {
    const res = await env.DB.prepare(
      `INSERT INTO volunteers (id, slot_id, name, email, phone, note)
       SELECT ?, s.id, ?, ?, ?, ?
       FROM slots s
       WHERE s.id = ? AND s.event_id = ?
         AND (SELECT COUNT(*) FROM volunteers v WHERE v.slot_id = s.id) < s.capacity`,
    )
      .bind(
        newId(),
        volunteer.name,
        volunteer.email,
        volunteer.phone,
        volunteer.note,
        slotId,
        eventId,
      )
      .run();
    results.push({ slotId, ok: res.meta.changes > 0 });
  }
  return results;
}

export async function removeVolunteer(env: Env, eventId: string, volunteerId: string): Promise<void> {
  await env.DB.prepare(
    `DELETE FROM volunteers WHERE id = ?
       AND slot_id IN (SELECT id FROM slots WHERE event_id = ?)`,
  )
    .bind(volunteerId, eventId)
    .run();
}

export async function deleteEvent(env: Env, id: string): Promise<void> {
  // No FK pragma guarantee on D1, so delete children explicitly.
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM volunteers WHERE slot_id IN (SELECT id FROM slots WHERE event_id = ?)`,
    ).bind(id),
    env.DB.prepare(`DELETE FROM slots WHERE event_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM events WHERE id = ?`).bind(id),
  ]);
  await env.EVENT_LINKS.delete(id);
}

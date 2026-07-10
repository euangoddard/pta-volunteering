-- Migration number: 0001 	 init
CREATE TABLE events (
  id TEXT PRIMARY KEY, -- nanoid, forms the hard-to-guess share URL
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL, -- ISO date (YYYY-MM-DD)
  location TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE slots (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL, -- HH:MM
  ends_at TEXT NOT NULL, -- HH:MM
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_slots_event ON slots(event_id);

CREATE TABLE volunteers (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_volunteers_slot ON volunteers(slot_id);

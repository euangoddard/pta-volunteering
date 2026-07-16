-- Migration number: 0002 	 event_groups
CREATE TABLE event_groups (
  id TEXT PRIMARY KEY, -- nanoid, forms the hard-to-guess share URL
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Each event belongs to at most one group.
ALTER TABLE events ADD COLUMN group_id TEXT REFERENCES event_groups(id);
CREATE INDEX idx_events_group ON events(group_id);

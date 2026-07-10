import { nanoid } from "nanoid";

/** Hard-to-guess identifier used in shareable URLs and as primary keys. */
export function newId(): string {
  return nanoid();
}

/** URL-friendly slug of an event name, e.g. "Summer Fair 2026!" -> "summer-fair-2026". */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event"
  );
}

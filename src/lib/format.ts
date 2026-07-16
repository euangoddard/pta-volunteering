import type { SlotRecord } from "./db";

/** Today's ISO date (YYYY-MM-DD) in the school's timezone. */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(
    new Date(),
  );
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function slotLabel(
  slot: Pick<SlotRecord, "label" | "starts_at" | "ends_at">,
): string {
  const time = `${slot.starts_at}–${slot.ends_at}`;
  return slot.label ? `${slot.label} (${time})` : time;
}

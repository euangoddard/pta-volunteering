import type { SlotRecord } from "./db";

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

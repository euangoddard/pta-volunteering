import { z } from "@builder.io/qwik-city";
import type { EditedSlot } from "./db";

/** Zod shape shared by the create and edit event forms. */
export const eventFormSchema = {
  name: z.string().trim().min(1, "Please give the event a name"),
  description: z.string().optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a date for the event"),
  location: z.string().optional(),
  group_id: z.string().optional(),
  slotId: z.array(z.string()).optional(),
  slotLabel: z.array(z.string()).optional(),
  slotStart: z.array(z.string()).optional(),
  slotEnd: z.array(z.string()).optional(),
  slotCapacity: z.array(z.string()).optional(),
};

export interface SlotFormFields {
  slotId?: string[];
  slotLabel?: string[];
  slotStart?: string[];
  slotEnd?: string[];
  slotCapacity?: string[];
}

/**
 * Turns the parallel slot arrays submitted by the event form into slots.
 * Fully empty rows are ignored. Returns an error message if a row is invalid.
 */
export function parseSlots(
  data: SlotFormFields,
): { slots: EditedSlot[] } | { error: string } {
  const ids = data.slotId ?? [];
  const labels = data.slotLabel ?? [];
  const starts = data.slotStart ?? [];
  const ends = data.slotEnd ?? [];
  const capacities = data.slotCapacity ?? [];
  const slots: EditedSlot[] = [];
  for (let i = 0; i < starts.length; i++) {
    const id = ids[i]?.trim() || undefined;
    const starts_at = starts[i]?.trim() ?? "";
    const ends_at = ends[i]?.trim() ?? "";
    const capacity = Number.parseInt(capacities[i] ?? "", 10);
    const label = labels[i]?.trim() ?? "";
    if (!id && !starts_at && !ends_at && !label) {
      continue; // fully empty new row — ignore
    }
    if (!starts_at || !ends_at || !Number.isFinite(capacity) || capacity < 1) {
      return {
        error: `Slot ${i + 1} needs a start time, an end time and at least 1 volunteer.`,
      };
    }
    slots.push({ id, label, starts_at, ends_at, capacity });
  }
  if (slots.length === 0) {
    return { error: "Please add at least one time slot." };
  }
  return { slots };
}

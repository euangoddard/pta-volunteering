import { component$, useStore } from "@builder.io/qwik";
import type { EventGroupRecord, EventRecord, SlotWithCount } from "~/lib/db";

export const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-flame-500 focus:ring-2 focus:ring-flame-200 focus:outline-none";

interface SlotRow {
  key: number;
  id?: string;
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  volunteer_count: number;
}

interface EventFormFieldsProps {
  /** Existing event when editing; omitted when creating. */
  event?: Pick<EventRecord, "name" | "description" | "event_date" | "location">;
  /** Existing slots when editing; omitted when creating. */
  slots?: SlotWithCount[];
  groups: Pick<EventGroupRecord, "id" | "name">[];
  selectedGroupId: string;
  nameError?: string;
  dateError?: string;
}

/**
 * The event details + time slots fields shared by the create and edit forms.
 * Render inside a <Form>; parse the submission with `parseSlots`.
 */
export const EventFormFields = component$<EventFormFieldsProps>((props) => {
  const initialRows: SlotRow[] = props.slots?.length
    ? props.slots.map((slot, i) => ({
        key: i,
        id: slot.id,
        label: slot.label,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        capacity: slot.capacity,
        volunteer_count: slot.volunteer_count,
      }))
    : [
        {
          key: 0,
          label: "",
          starts_at: "",
          ends_at: "",
          capacity: 2,
          volunteer_count: 0,
        },
      ];
  const state = useStore({ nextKey: initialRows.length, rows: initialRows });

  return (
    <>
      <section class="space-y-4">
        <h2 class="text-plum-700 text-lg font-bold">Event details</h2>
        <div>
          <label
            for="name"
            class="mb-1 block text-sm font-semibold text-gray-700"
          >
            Event name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Summer Fair"
            value={props.event?.name}
            class={inputClass}
          />
          {props.nameError && (
            <p class="mt-1 text-sm text-red-600">{props.nameError}</p>
          )}
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="event_date"
              class="mb-1 block text-sm font-semibold text-gray-700"
            >
              Date
            </label>
            <input
              id="event_date"
              name="event_date"
              type="date"
              required
              value={props.event?.event_date}
              class={inputClass}
            />
            {props.dateError && (
              <p class="mt-1 text-sm text-red-600">{props.dateError}</p>
            )}
          </div>
          <div>
            <label
              for="location"
              class="mb-1 block text-sm font-semibold text-gray-700"
            >
              Location <span class="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. School playground"
              value={props.event?.location}
              class={inputClass}
            />
          </div>
        </div>
        <div>
          <label
            for="description"
            class="mb-1 block text-sm font-semibold text-gray-700"
          >
            Description{" "}
            <span class="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What's happening and why you need helpers"
            value={props.event?.description}
            class={inputClass}
          />
        </div>
        {props.groups.length > 0 && (
          <div>
            <label
              for="group_id"
              class="mb-1 block text-sm font-semibold text-gray-700"
            >
              Event group{" "}
              <span class="font-normal text-gray-400">(optional)</span>
            </label>
            <select id="group_id" name="group_id" class={inputClass}>
              <option value="" selected={props.selectedGroupId === ""}>
                No group
              </option>
              {props.groups.map((group) => (
                <option
                  key={group.id}
                  value={group.id}
                  selected={group.id === props.selectedGroupId}
                >
                  {group.name}
                </option>
              ))}
            </select>
            <p class="mt-1 text-sm text-gray-500">
              Grouped events appear together on the group's shared page.
            </p>
          </div>
        )}
      </section>

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-plum-700 text-lg font-bold">Time slots</h2>
          <button
            type="button"
            onClick$={() => {
              state.rows.push({
                key: state.nextKey++,
                label: "",
                starts_at: "",
                ends_at: "",
                capacity: 2,
                volunteer_count: 0,
              });
            }}
            class="border-flame-600 text-flame-600 hover:bg-flame-50 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
          >
            + Add slot
          </button>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Add one slot per shift you need covering. "Helpers needed" is how many
          volunteers can sign up for that slot.
        </p>
        <div class="mt-4 space-y-4">
          {state.rows.map((row, i) => (
            <div
              key={row.key}
              class="border-plum-100 bg-plum-50/50 rounded-xl border p-4"
            >
              <input type="hidden" name="slotId[]" value={row.id ?? ""} />
              <div class="mb-3 flex items-center justify-between gap-2">
                <span class="text-plum-600 text-sm font-bold">
                  Slot {i + 1}
                  {row.volunteer_count > 0 && (
                    <span class="ml-2 font-normal text-gray-500">
                      · {row.volunteer_count} signed up
                    </span>
                  )}
                </span>
                {state.rows.length > 1 && row.volunteer_count === 0 && (
                  <button
                    type="button"
                    onClick$={() => {
                      state.rows.splice(i, 1);
                    }}
                    class="text-sm font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-gray-600">
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    name="slotLabel[]"
                    placeholder="e.g. Cake stall"
                    value={row.label}
                    class={inputClass}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-gray-600">
                    Start
                  </label>
                  <input
                    type="time"
                    name="slotStart[]"
                    required
                    value={row.starts_at}
                    class={inputClass}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-gray-600">
                    End
                  </label>
                  <input
                    type="time"
                    name="slotEnd[]"
                    required
                    value={row.ends_at}
                    class={inputClass}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-gray-600">
                    Helpers needed
                  </label>
                  <input
                    type="number"
                    name="slotCapacity[]"
                    min={Math.max(1, row.volunteer_count)}
                    value={row.capacity}
                    required
                    class={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {props.slots && props.slots.some((s) => s.volunteer_count > 0) && (
          <p class="mt-3 text-sm text-gray-500">
            Slots with signups can't be removed, and their helpers needed can't
            go below the number already signed up. Remove volunteers from the
            event page first if you need to.
          </p>
        )}
      </section>
    </>
  );
});

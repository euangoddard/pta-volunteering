import { component$, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Form,
  routeAction$,
  routeLoader$,
  zod$,
  z,
} from "@builder.io/qwik-city";
import type { NewSlot } from "~/lib/db";
import { createEvent, getGroup, listGroups } from "~/lib/db";
import { getEnv } from "~/lib/platform";

export const useGroupOptions = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  return {
    groups: await listGroups(env),
    // /admin/new/?group=<id> preselects the group (linked from group pages).
    preselected: ev.url.searchParams.get("group") ?? "",
  };
});

export const useCreateEvent = routeAction$(
  async (data, ev) => {
    const labels = data.slotLabel ?? [];
    const starts = data.slotStart ?? [];
    const ends = data.slotEnd ?? [];
    const capacities = data.slotCapacity ?? [];
    const slots: NewSlot[] = [];
    for (let i = 0; i < starts.length; i++) {
      const starts_at = starts[i]?.trim() ?? "";
      const ends_at = ends[i]?.trim() ?? "";
      const capacity = Number.parseInt(capacities[i] ?? "", 10);
      const label = labels[i]?.trim() ?? "";
      if (!starts_at && !ends_at && !label) {
        continue; // fully empty row — ignore
      }
      if (
        !starts_at ||
        !ends_at ||
        !Number.isFinite(capacity) ||
        capacity < 1
      ) {
        return ev.fail(400, {
          message: `Slot ${i + 1} needs a start time, an end time and at least 1 volunteer.`,
        });
      }
      slots.push({ label, starts_at, ends_at, capacity });
    }
    if (slots.length === 0) {
      return ev.fail(400, {
        message: "Please add at least one time slot.",
      });
    }
    const env = await getEnv(ev);
    const group_id = data.group_id || null;
    if (group_id && !(await getGroup(env, group_id))) {
      return ev.fail(400, { message: "That event group no longer exists." });
    }
    const event = await createEvent(env, {
      name: data.name.trim(),
      description: data.description?.trim() ?? "",
      event_date: data.event_date,
      location: data.location?.trim() ?? "",
      group_id,
      slots,
    });
    throw ev.redirect(302, `/admin/events/${event.id}/`);
  },
  zod$({
    name: z.string().trim().min(1, "Please give the event a name"),
    description: z.string().optional(),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a date for the event"),
    location: z.string().optional(),
    group_id: z.string().optional(),
    slotLabel: z.array(z.string()).optional(),
    slotStart: z.array(z.string()).optional(),
    slotEnd: z.array(z.string()).optional(),
    slotCapacity: z.array(z.string()).optional(),
  }),
);

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-flame-500 focus:ring-2 focus:ring-flame-200 focus:outline-none";

export default component$(() => {
  const action = useCreateEvent();
  const groupOptions = useGroupOptions();
  const state = useStore({ nextKey: 1, rows: [0] });

  return (
    <div class="mx-auto max-w-2xl">
      <h1 class="text-plum-700 mb-6 text-2xl font-bold">Create a new event</h1>

      <Form
        action={action}
        class="border-plum-100 space-y-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
      >
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
              class={inputClass}
            />
            {action.value?.fieldErrors?.name && (
              <p class="mt-1 text-sm text-red-600">
                {action.value.fieldErrors.name}
              </p>
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
                class={inputClass}
              />
              {action.value?.fieldErrors?.event_date && (
                <p class="mt-1 text-sm text-red-600">
                  {action.value.fieldErrors.event_date}
                </p>
              )}
            </div>
            <div>
              <label
                for="location"
                class="mb-1 block text-sm font-semibold text-gray-700"
              >
                Location{" "}
                <span class="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. School playground"
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
              class={inputClass}
            />
          </div>
          {groupOptions.value.groups.length > 0 && (
            <div>
              <label
                for="group_id"
                class="mb-1 block text-sm font-semibold text-gray-700"
              >
                Event group{" "}
                <span class="font-normal text-gray-400">(optional)</span>
              </label>
              <select id="group_id" name="group_id" class={inputClass}>
                <option value="">No group</option>
                {groupOptions.value.groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                    selected={group.id === groupOptions.value.preselected}
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
                state.rows.push(state.nextKey++);
              }}
              class="border-flame-600 text-flame-600 hover:bg-flame-50 rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
            >
              + Add slot
            </button>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Add one slot per shift you need covering. "Helpers needed" is how
            many volunteers can sign up for that slot.
          </p>
          <div class="mt-4 space-y-4">
            {state.rows.map((key, i) => (
              <div
                key={key}
                class="border-plum-100 bg-plum-50/50 rounded-xl border p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-plum-600 text-sm font-bold">
                    Slot {i + 1}
                  </span>
                  {state.rows.length > 1 && (
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
                      min={1}
                      value={2}
                      required
                      class={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {action.value?.failed && action.value?.message && (
          <p
            role="alert"
            class="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {action.value.message}
          </p>
        )}

        <button
          type="submit"
          disabled={action.isRunning}
          class="bg-flame-600 hover:bg-flame-500 w-full rounded-xl px-6 py-3 text-lg font-bold text-white shadow-sm transition disabled:opacity-50"
        >
          {action.isRunning ? "Creating…" : "Create event"}
        </button>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "New event · PTA Admin",
};

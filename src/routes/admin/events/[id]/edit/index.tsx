import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Form,
  Link,
  routeAction$,
  routeLoader$,
  zod$,
} from "@builder.io/qwik-city";
import {
  getEvent,
  getGroup,
  getSlotsWithCounts,
  listGroups,
  updateEvent,
} from "~/lib/db";
import { eventFormSchema, parseSlots } from "~/lib/event-form";
import { slotLabel } from "~/lib/format";
import { getEnv } from "~/lib/platform";
import { EventFormFields } from "~/components/event-form/event-form";

export const useEditEventData = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  const event = await getEvent(env, ev.params.id);
  if (!event) {
    throw ev.error(404, "Event not found");
  }
  return {
    event,
    slots: await getSlotsWithCounts(env, event.id),
    groups: await listGroups(env),
  };
});

export const useUpdateEvent = routeAction$(async (data, ev) => {
  const parsed = parseSlots(data);
  if ("error" in parsed) {
    return ev.fail(400, { message: parsed.error });
  }
  const env = await getEnv(ev);
  const event = await getEvent(env, ev.params.id);
  if (!event) {
    return ev.fail(404, { message: "This event no longer exists." });
  }
  const group_id = data.group_id || null;
  if (group_id && !(await getGroup(env, group_id))) {
    return ev.fail(400, { message: "That event group no longer exists." });
  }

  // Protect existing signups: slots with volunteers can't be removed or
  // shrunk below the number already signed up.
  const existing = await getSlotsWithCounts(env, event.id);
  for (const slot of parsed.slots) {
    if (slot.id && !existing.some((s) => s.id === slot.id)) {
      return ev.fail(400, {
        message:
          "One of the slots was removed while you were editing. Please reload and try again.",
      });
    }
  }
  for (const current of existing) {
    const edited = parsed.slots.find((s) => s.id === current.id);
    if (!edited && current.volunteer_count > 0) {
      return ev.fail(400, {
        message: `${slotLabel(current)} has volunteers signed up, so it can't be removed.`,
      });
    }
    if (edited && edited.capacity < current.volunteer_count) {
      return ev.fail(400, {
        message: `${slotLabel(current)} already has ${current.volunteer_count} volunteers, so it needs at least ${current.volunteer_count} helpers.`,
      });
    }
  }

  await updateEvent(env, event.id, {
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
    event_date: data.event_date,
    location: data.location?.trim() ?? "",
    group_id,
    slots: parsed.slots,
  });
  throw ev.redirect(302, `/admin/events/${event.id}/`);
}, zod$(eventFormSchema));

export default component$(() => {
  const action = useUpdateEvent();
  const data = useEditEventData();
  const { event, slots, groups } = data.value;

  return (
    <div class="mx-auto max-w-2xl">
      <Link
        href={`/admin/events/${event.id}/`}
        class="hover:text-plum-700 text-sm font-semibold text-gray-500"
      >
        ← Back to event
      </Link>
      <h1 class="text-plum-700 mt-2 mb-6 text-2xl font-bold">Edit event</h1>

      <Form
        action={action}
        class="border-plum-100 space-y-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
      >
        <EventFormFields
          event={event}
          slots={slots}
          groups={groups}
          selectedGroupId={event.group_id ?? ""}
          nameError={action.value?.fieldErrors?.name}
          dateError={action.value?.fieldErrors?.event_date}
        />

        {action.value?.failed && action.value?.message && (
          <p
            role="alert"
            class="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {action.value.message}
          </p>
        )}

        <div class="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/admin/events/${event.id}/`}
            class="border-plum-200 text-plum-700 hover:bg-plum-50 rounded-xl border px-6 py-3 text-center text-lg font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={action.isRunning}
            class="bg-flame-600 hover:bg-flame-500 grow rounded-xl px-6 py-3 text-lg font-bold text-white shadow-sm transition disabled:opacity-50"
          >
            {action.isRunning ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const { event } = resolveValue(useEditEventData);
  return { title: `Edit ${event.name} · PTA Admin` };
};

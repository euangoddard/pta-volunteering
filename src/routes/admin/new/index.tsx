import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$, zod$ } from "@builder.io/qwik-city";
import { createEvent, getGroup, listGroups } from "~/lib/db";
import { eventFormSchema, parseSlots } from "~/lib/event-form";
import { getEnv } from "~/lib/platform";
import { EventFormFields } from "~/components/event-form/event-form";

export const useGroupOptions = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  return {
    groups: await listGroups(env),
    // /admin/new/?group=<id> preselects the group (linked from group pages).
    preselected: ev.url.searchParams.get("group") ?? "",
  };
});

export const useCreateEvent = routeAction$(async (data, ev) => {
  const parsed = parseSlots(data);
  if ("error" in parsed) {
    return ev.fail(400, { message: parsed.error });
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
    slots: parsed.slots,
  });
  throw ev.redirect(302, `/admin/events/${event.id}/`);
}, zod$(eventFormSchema));

export default component$(() => {
  const action = useCreateEvent();
  const groupOptions = useGroupOptions();

  return (
    <div class="mx-auto max-w-2xl">
      <h1 class="text-plum-700 mb-6 text-2xl font-bold">Create a new event</h1>

      <Form
        action={action}
        class="border-plum-100 space-y-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
      >
        <EventFormFields
          groups={groupOptions.value.groups}
          selectedGroupId={groupOptions.value.preselected}
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

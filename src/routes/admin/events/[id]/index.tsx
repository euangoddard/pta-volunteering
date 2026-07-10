import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Form,
  Link,
  routeAction$,
  routeLoader$,
  zod$,
  z,
} from "@builder.io/qwik-city";
import {
  deleteEvent,
  eventPath,
  getEvent,
  getSlotsWithVolunteers,
  removeVolunteer,
} from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { formatDate, slotLabel } from "~/lib/format";
import { ShareQr } from "~/components/share-qr/share-qr";

export const useEventDetail = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  const event = await getEvent(env, ev.params.id);
  if (!event) {
    throw ev.error(404, "Event not found");
  }
  const slots = await getSlotsWithVolunteers(env, event.id);
  return {
    event,
    slots,
    shareUrl: new URL(eventPath(event), ev.url.origin).href,
  };
});

export const useRemoveVolunteer = routeAction$(
  async (data, ev) => {
    const env = await getEnv(ev);
    await removeVolunteer(env, ev.params.id, data.volunteerId);
    return { success: true };
  },
  zod$({ volunteerId: z.string().min(1) }),
);

export const useDeleteEvent = routeAction$(async (_data, ev) => {
  const env = await getEnv(ev);
  await deleteEvent(env, ev.params.id);
  throw ev.redirect(302, "/admin/");
});

export default component$(() => {
  const data = useEventDetail();
  const removeAction = useRemoveVolunteer();
  const deleteAction = useDeleteEvent();
  const copied = useSignal(false);
  const confirmingDelete = useSignal(false);
  const { event, slots, shareUrl } = data.value;
  const totalVolunteers = slots.reduce((n, s) => n + s.volunteer_count, 0);
  const totalCapacity = slots.reduce((n, s) => n + s.capacity, 0);

  return (
    <div class="space-y-6">
      <div>
        <Link
          href="/admin/"
          class="hover:text-plum-700 text-sm font-semibold text-gray-500"
        >
          ← All events
        </Link>
        <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-plum-700 text-2xl font-bold">{event.name}</h1>
            <p class="text-gray-500">
              {formatDate(event.event_date)}
              {event.location && <> · {event.location}</>}
            </p>
          </div>
          <span
            class={[
              "rounded-full px-4 py-1.5 font-bold",
              totalVolunteers >= totalCapacity
                ? "bg-green-100 text-green-700"
                : "bg-flame-100 text-flame-700",
            ]}
          >
            {totalVolunteers} / {totalCapacity} volunteers
          </span>
        </div>
        {event.description && (
          <p class="mt-3 whitespace-pre-line text-gray-600">
            {event.description}
          </p>
        )}
      </div>

      <div class="border-plum-100 rounded-xl border bg-white p-5 shadow-sm">
        <h2 class="text-plum-700 font-bold">Shareable signup link</h2>
        <p class="mt-1 text-sm text-gray-500">
          Anyone with this link can sign up — no login needed. Share it via the
          newsletter or class group chats.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <code class="bg-plum-50 text-plum-800 min-w-0 grow overflow-x-auto rounded-lg px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick$={async () => {
              await navigator.clipboard.writeText(shareUrl);
              copied.value = true;
              setTimeout(() => (copied.value = false), 2000);
            }}
            class="bg-plum-700 hover:bg-plum-600 rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
          >
            {copied.value ? "Copied!" : "Copy link"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener"
            class="border-plum-200 text-plum-700 hover:bg-plum-50 rounded-lg border px-4 py-2 text-sm font-semibold transition"
          >
            Preview
          </a>
        </div>
        <div class="border-plum-100 mt-4 border-t pt-4">
          <ShareQr
            url={shareUrl}
            title={`Volunteer: ${event.name}`}
            text={`Can you lend a hand at ${event.name}? Pick a slot here:`}
          />
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-plum-700 text-xl font-bold">Who's volunteering</h2>
        {slots.map((slot) => (
          <div
            key={slot.id}
            class="border-plum-100 overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            <div class="border-plum-100 bg-plum-50/60 flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <p class="text-plum-700 font-bold">{slotLabel(slot)}</p>
              <span
                class={[
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  slot.volunteer_count >= slot.capacity
                    ? "bg-green-100 text-green-700"
                    : "bg-flame-100 text-flame-700",
                ]}
              >
                {slot.volunteer_count} / {slot.capacity} filled
              </span>
            </div>
            {slot.volunteers.length === 0 ? (
              <p class="px-5 py-4 text-sm text-gray-500 italic">
                No one's signed up yet — share the link above to get the word
                out.
              </p>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="text-xs tracking-wide text-gray-400 uppercase">
                      <th class="px-5 py-2 font-semibold">Name</th>
                      <th class="px-5 py-2 font-semibold">Contact</th>
                      <th class="px-5 py-2 font-semibold">Note</th>
                      <th class="px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slot.volunteers.map((v) => (
                      <tr key={v.id} class="border-plum-50 border-t">
                        <td class="px-5 py-3 font-semibold text-gray-800">
                          {v.name}
                        </td>
                        <td class="px-5 py-3 text-gray-600">
                          <a
                            href={`mailto:${v.email}`}
                            class="text-flame-600 hover:underline"
                          >
                            {v.email}
                          </a>
                          {v.phone && (
                            <span class="block text-gray-500">{v.phone}</span>
                          )}
                        </td>
                        <td class="max-w-60 px-5 py-3 text-gray-500">
                          {v.note}
                        </td>
                        <td class="px-5 py-3 text-right">
                          <Form action={removeAction}>
                            <input
                              type="hidden"
                              name="volunteerId"
                              value={v.id}
                            />
                            <button
                              type="submit"
                              class="-my-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                              aria-label={`Remove ${v.name} from this slot`}
                            >
                              Remove
                            </button>
                          </Form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <div class="rounded-xl border border-red-100 bg-red-50/50 p-5">
        <h2 class="font-bold text-red-700">Danger zone</h2>
        {confirmingDelete.value ? (
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <p class="text-sm font-semibold text-red-700">
              Delete "{event.name}" and all its signups permanently?
            </p>
            <Form action={deleteAction}>
              <button
                type="submit"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
              >
                Yes, delete it
              </button>
            </Form>
            <button
              type="button"
              onClick$={() => (confirmingDelete.value = false)}
              class="text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick$={() => (confirmingDelete.value = true)}
            class="mt-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Delete event…
          </button>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const { event } = resolveValue(useEventDetail);
  return { title: `${event.name} · PTA Admin` };
};

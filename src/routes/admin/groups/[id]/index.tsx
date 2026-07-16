import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { deleteGroup, getGroup, groupPath, listGroupEvents } from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { formatDate, todayISO } from "~/lib/format";
import { ShareLinkCard } from "~/components/share-link-card/share-link-card";

export const useGroupDetail = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  const group = await getGroup(env, ev.params.id);
  if (!group) {
    throw ev.error(404, "Event group not found");
  }
  const events = await listGroupEvents(env, group.id);
  return {
    group,
    events,
    today: todayISO(),
    shareUrl: new URL(groupPath(group), ev.url.origin).href,
  };
});

export const useDeleteGroup = routeAction$(async (_data, ev) => {
  const env = await getEnv(ev);
  await deleteGroup(env, ev.params.id);
  throw ev.redirect(302, "/admin/groups/");
});

export default component$(() => {
  const data = useGroupDetail();
  const deleteAction = useDeleteGroup();
  const confirmingDelete = useSignal(false);
  const { group, events, today, shareUrl } = data.value;

  return (
    <div class="space-y-6">
      <div>
        <Link
          href="/admin/groups/"
          class="hover:text-plum-700 text-sm font-semibold text-gray-500"
        >
          ← All groups
        </Link>
        <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 class="text-plum-700 text-2xl font-bold">{group.name}</h1>
          <span class="bg-plum-100 text-plum-700 rounded-full px-4 py-1.5 font-bold">
            {events.length} event{events.length === 1 ? "" : "s"}
          </span>
        </div>
        {group.description && (
          <p class="mt-3 whitespace-pre-line text-gray-600">
            {group.description}
          </p>
        )}
      </div>

      <ShareLinkCard
        url={shareUrl}
        heading="Shareable group link"
        description="One link that lists every event in this group — share it via the newsletter or class group chats."
        shareTitle={`Volunteer: ${group.name}`}
        shareText={`Can you lend a hand with ${group.name}? Pick an event here:`}
      />

      <div class="space-y-3">
        <h2 class="text-plum-700 text-xl font-bold">Events in this group</h2>
        <p class="text-sm text-gray-500">
          Add an event to this group from its page, or pick the group when
          creating a{" "}
          <Link
            href={`/admin/new/?group=${group.id}`}
            class="text-flame-600 font-semibold underline-offset-2 hover:underline"
          >
            new event
          </Link>
          .
        </p>
        {events.length === 0 ? (
          <div class="border-plum-200 rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
            <p class="text-plum-700 font-semibold">
              No events in this group yet
            </p>
            <p class="mt-1 text-sm">
              The shared page will show events here as soon as you add some.
            </p>
          </div>
        ) : (
          <ul class="space-y-3">
            {events.map((event) => {
              const isPast = event.event_date < today;
              return (
                <li key={event.id}>
                  <Link
                    href={`/admin/events/${event.id}/`}
                    class={[
                      "hover:border-flame-400 block rounded-xl border p-5 shadow-sm transition hover:shadow",
                      isPast
                        ? "border-gray-200 bg-gray-50"
                        : "border-plum-100 bg-white",
                    ]}
                  >
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p
                          class={[
                            "text-lg font-bold",
                            isPast ? "text-gray-500" : "text-plum-700",
                          ]}
                        >
                          {event.name}
                        </p>
                        <p class="text-sm text-gray-500">
                          {formatDate(event.event_date)}
                          {event.location && <> · {event.location}</>}
                        </p>
                      </div>
                      <div class="flex items-center gap-2 text-sm">
                        {isPast && (
                          <span class="rounded-full bg-gray-200 px-3 py-1 font-semibold text-gray-500">
                            Past
                          </span>
                        )}
                        <span
                          class={[
                            "rounded-full px-3 py-1 font-semibold",
                            event.volunteer_count >= event.capacity_total
                              ? "bg-green-100 text-green-700"
                              : "bg-flame-100 text-flame-700",
                          ]}
                        >
                          {event.volunteer_count} / {event.capacity_total}{" "}
                          volunteers
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div class="rounded-xl border border-red-100 bg-red-50/50 p-5">
        <h2 class="font-bold text-red-700">Danger zone</h2>
        <p class="mt-1 text-sm text-red-600/80">
          Deleting a group doesn't delete its events — they just leave the
          group, and their own signup links keep working.
        </p>
        {confirmingDelete.value ? (
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <p class="text-sm font-semibold text-red-700">
              Delete "{group.name}" and its shared link permanently?
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
            Delete group…
          </button>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const { group } = resolveValue(useGroupDetail);
  return { title: `${group.name} · PTA Admin` };
};

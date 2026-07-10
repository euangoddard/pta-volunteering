import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { listEvents } from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { formatDate } from "~/lib/format";

export const useEvents = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  return listEvents(env);
});

export default component$(() => {
  const events = useEvents();

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-plum-700 text-2xl font-bold">Events</h1>
        <Link
          href="/admin/new/"
          class="bg-flame-600 hover:bg-flame-500 rounded-lg px-4 py-2 font-semibold text-white shadow-sm transition"
        >
          + New event
        </Link>
      </div>

      {events.value.length === 0 ? (
        <div class="border-plum-200 rounded-2xl border border-dashed bg-white p-10 text-center text-gray-500">
          <p class="text-plum-700 text-lg font-semibold">No events yet</p>
          <p class="mt-2">
            Create your first event and share the signup link with parents.
          </p>
        </div>
      ) : (
        <ul class="space-y-3">
          {events.value.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}/`}
                class="border-plum-100 hover:border-flame-400 block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-plum-700 text-lg font-bold">{event.name}</p>
                    <p class="text-sm text-gray-500">
                      {formatDate(event.event_date)}
                      {event.location && <> · {event.location}</>}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="bg-plum-100 text-plum-700 rounded-full px-3 py-1 font-semibold">
                      {event.slot_count} slot{event.slot_count === 1 ? "" : "s"}
                    </span>
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
          ))}
        </ul>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin · PTA Volunteering",
};

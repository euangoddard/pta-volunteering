import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { EventListItem } from "~/lib/db";
import { eventPath, getGroup, groupPath, listGroupEvents } from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { formatDate, todayISO } from "~/lib/format";
import { ShareQr } from "~/components/share-qr/share-qr";
import { EventNotFound } from "~/components/event-not-found/event-not-found";

export const useGroupData = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  const group = await getGroup(env, ev.params.id);
  if (!group) {
    // Render a friendly dead-end rather than a bare error response.
    ev.status(404);
    return { notFound: true as const };
  }
  if (group.slug !== ev.params.slug) {
    throw ev.redirect(302, groupPath(group));
  }
  const events = await listGroupEvents(env, group.id);
  const today = todayISO();
  return {
    notFound: false as const,
    group,
    upcoming: events.filter((e) => e.event_date >= today),
    past: events.filter((e) => e.event_date < today),
    shareUrl: new URL(groupPath(group), ev.url.origin).href,
  };
});

const UpcomingEventCard = component$<{ event: EventListItem }>(({ event }) => {
  const remaining = event.capacity_total - event.volunteer_count;
  const isFull = remaining <= 0;
  return (
    <a
      href={eventPath(event)}
      class="border-plum-200 hover:border-flame-400 hover:bg-flame-50 flex items-center gap-3 rounded-xl border bg-white p-4 transition"
    >
      <span class="grow">
        <span class="block font-semibold text-gray-800">{event.name}</span>
        <span class="block text-sm text-gray-500">
          {formatDate(event.event_date)}
          {event.location && <> · {event.location}</>}
        </span>
        <span
          class={[
            "block text-sm",
            isFull ? "font-semibold text-gray-500" : "text-gray-500",
          ]}
        >
          {isFull
            ? "Full — thank you everyone!"
            : `${remaining} helper place${remaining === 1 ? "" : "s"} still to fill`}
        </span>
      </span>
      {!isFull && (
        <span class="bg-flame-100 text-flame-700 shrink-0 rounded-full px-3 py-1 text-xs font-bold">
          {remaining} left
        </span>
      )}
      <span class="text-flame-600 shrink-0 text-xl" aria-hidden="true">
        →
      </span>
    </a>
  );
});

const PastEventCard = component$<{ event: EventListItem }>(({ event }) => {
  return (
    <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <span class="grow">
        <span class="block font-semibold text-gray-500">{event.name}</span>
        <span class="block text-sm text-gray-400">
          {formatDate(event.event_date)}
          {event.location && <> · {event.location}</>}
        </span>
      </span>
      <span class="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
        Past event
      </span>
    </div>
  );
});

export default component$(() => {
  const data = useGroupData();
  if (data.value.notFound) {
    return <EventNotFound subject="that page" />;
  }
  const { group, upcoming, past, shareUrl } = data.value;

  return (
    <div class="mx-auto max-w-2xl">
      <div class="border-plum-100 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div class="bg-plum-700 px-6 py-6 text-white sm:px-8">
          <p class="text-flame-300 text-xs font-semibold tracking-widest uppercase">
            Can you lend a hand? 🙌
          </p>
          <h1 class="mt-1 text-2xl font-bold sm:text-3xl">{group.name}</h1>
          <p class="text-plum-200 mt-2 text-sm">
            Pick an event below to see the time slots and sign up — it only
            takes a minute.
          </p>
        </div>

        <div class="px-6 py-6 sm:px-8">
          {group.description && (
            <p class="mb-6 whitespace-pre-line text-gray-600">
              {group.description}
            </p>
          )}

          {upcoming.length === 0 ? (
            <div class="border-plum-200 rounded-xl border border-dashed p-6 text-center text-gray-500">
              <p class="text-plum-700 font-semibold">
                No upcoming events right now
              </p>
              <p class="mt-1 text-sm">
                Check back soon — new events will appear here as the PTA adds
                them.
              </p>
            </div>
          ) : (
            <div class="space-y-2">
              {upcoming.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details class="group mt-6">
              <summary class="hover:text-plum-700 cursor-pointer text-sm font-semibold text-gray-500 underline-offset-2 select-none hover:underline">
                <span class="group-open:hidden">
                  Show {past.length} past event{past.length === 1 ? "" : "s"}
                </span>
                <span class="hidden group-open:inline">Hide past events</span>
              </summary>
              <div class="mt-3 space-y-2">
                {past.map((event) => (
                  <PastEventCard key={event.id} event={event} />
                ))}
              </div>
            </details>
          )}

          <div class="border-plum-100 mt-8 rounded-xl border p-5">
            <h2 class="text-plum-700 font-bold">
              Know someone else who could help?
            </h2>
            <p class="mt-1 mb-4 text-sm text-gray-500">
              Pass this page on — they can scan the QR code or you can share it
              straight from here.
            </p>
            <ShareQr
              url={shareUrl}
              title={`Volunteer: ${group.name}`}
              text={`Can you lend a hand with ${group.name}? Pick an event here:`}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useGroupData);
  if (data.notFound) {
    return {
      title: "Page not found · Sandhills PTA",
      meta: [{ name: "robots", content: "noindex" }],
    };
  }
  const { group } = data;
  return {
    title: `Volunteer: ${group.name} · Sandhills PTA`,
    meta: [
      {
        name: "description",
        content: `See all the ${group.name} events and sign up to help. No account needed — it only takes a minute.`,
      },
      {
        name: "robots",
        content: "noindex", // private, hard-to-guess link
      },
    ],
  };
};

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { listGroups } from "~/lib/db";
import { getEnv } from "~/lib/platform";

export const useGroups = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  return listGroups(env);
});

export default component$(() => {
  const groups = useGroups();

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-plum-700 text-2xl font-bold">Event groups</h1>
        <Link
          href="/admin/groups/new/"
          class="bg-flame-600 hover:bg-flame-500 rounded-lg px-4 py-2 font-semibold text-white shadow-sm transition"
        >
          + New group
        </Link>
      </div>

      <p class="mb-6 text-gray-500">
        A group collects related events behind one shareable link — handy for a
        series like "Summer Fair weekend" or a term of cake sales.
      </p>

      {groups.value.length === 0 ? (
        <div class="border-plum-200 rounded-2xl border border-dashed bg-white p-10 text-center text-gray-500">
          <p class="text-plum-700 text-lg font-semibold">No groups yet</p>
          <p class="mt-2">
            Create a group, add events to it, and share one link that lists them
            all.
          </p>
        </div>
      ) : (
        <ul class="space-y-3">
          {groups.value.map((group) => (
            <li key={group.id}>
              <Link
                href={`/admin/groups/${group.id}/`}
                class="border-plum-100 hover:border-flame-400 block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="text-plum-700 text-lg font-bold">{group.name}</p>
                  <span class="bg-plum-100 text-plum-700 rounded-full px-3 py-1 text-sm font-semibold">
                    {group.event_count} event
                    {group.event_count === 1 ? "" : "s"}
                  </span>
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
  title: "Event groups · PTA Admin",
};

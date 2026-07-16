import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, zod$, z } from "@builder.io/qwik-city";
import { createGroup } from "~/lib/db";
import { getEnv } from "~/lib/platform";

export const useCreateGroup = routeAction$(
  async (data, ev) => {
    const env = await getEnv(ev);
    const group = await createGroup(env, {
      name: data.name.trim(),
      description: data.description?.trim() ?? "",
    });
    throw ev.redirect(302, `/admin/groups/${group.id}/`);
  },
  zod$({
    name: z.string().trim().min(1, "Please give the group a name"),
    description: z.string().optional(),
  }),
);

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-flame-500 focus:ring-2 focus:ring-flame-200 focus:outline-none";

export default component$(() => {
  const action = useCreateGroup();

  return (
    <div class="mx-auto max-w-2xl">
      <Link
        href="/admin/groups/"
        class="hover:text-plum-700 text-sm font-semibold text-gray-500"
      >
        ← All groups
      </Link>
      <h1 class="text-plum-700 mt-2 mb-6 text-2xl font-bold">
        Create an event group
      </h1>

      <Form
        action={action}
        class="border-plum-100 space-y-6 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label
            for="name"
            class="mb-1 block text-sm font-semibold text-gray-700"
          >
            Group name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Summer Fair weekend"
            class={inputClass}
          />
          {action.value?.fieldErrors?.name && (
            <p class="mt-1 text-sm text-red-600">
              {action.value.fieldErrors.name}
            </p>
          )}
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
            placeholder="Shown at the top of the shared page, above the list of events"
            class={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={action.isRunning}
          class="bg-flame-600 hover:bg-flame-500 w-full rounded-xl px-6 py-3 text-lg font-bold text-white shadow-sm transition disabled:opacity-50"
        >
          {action.isRunning ? "Creating…" : "Create group"}
        </button>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "New group · PTA Admin",
};

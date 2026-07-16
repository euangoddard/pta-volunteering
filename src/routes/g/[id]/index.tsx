import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { getCanonicalGroupSlug } from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { EventNotFound } from "~/components/event-not-found/event-not-found";

/**
 * Shared links sometimes get truncated to just the id. Look up the canonical
 * slug in KV and redirect to the full group page URL. Unknown ids fall through
 * to a friendly "not found" page (with a 404 status).
 */
export const onGet: RequestHandler = async (ev) => {
  const env = await getEnv(ev);
  const slug = await getCanonicalGroupSlug(env, ev.params.id);
  if (slug) {
    throw ev.redirect(302, `/g/${ev.params.id}/${slug}/`);
  }
  ev.status(404);
};

export default component$(() => {
  return <EventNotFound subject="that page" />;
});

export const head: DocumentHead = {
  title: "Page not found · Sandhills PTA",
  meta: [{ name: "robots", content: "noindex" }],
};

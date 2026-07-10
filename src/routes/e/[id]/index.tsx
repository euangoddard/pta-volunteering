import type { RequestHandler } from "@builder.io/qwik-city";
import { getCanonicalSlug } from "~/lib/db";
import { getEnv } from "~/lib/platform";

/**
 * Shared links sometimes get truncated to just the id. Look up the canonical
 * slug in KV and redirect to the full signup URL.
 */
export const onGet: RequestHandler = async (ev) => {
  const env = await getEnv(ev);
  const slug = await getCanonicalSlug(env, ev.params.id);
  if (!slug) {
    throw ev.error(404, "Event not found");
  }
  throw ev.redirect(302, `/e/${ev.params.id}/${slug}/`);
};

import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { Link, useLocation } from "@builder.io/qwik-city";
import { getEnv } from "~/lib/platform";

/**
 * Everything under /admin/ requires HTTP basic auth. Credentials come from
 * the ADMIN_USERNAME / ADMIN_PASSWORD bindings (.dev.vars locally, worker
 * secrets in production).
 */
export const onRequest: RequestHandler = async (ev) => {
  const env = await getEnv(ev);
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    throw ev.error(
      500,
      "Admin credentials are not configured (ADMIN_USERNAME / ADMIN_PASSWORD)",
    );
  }
  const expected = `Basic ${btoa(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD}`)}`;
  const provided = ev.request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    ev.headers.set(
      "WWW-Authenticate",
      'Basic realm="PTA Admin", charset="UTF-8"',
    );
    ev.cacheControl({ noCache: true, noStore: true });
    throw ev.send(401, "Authentication required");
  }
};

/** Constant-time string comparison to avoid leaking credential prefixes. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i % ab.length] ?? 0) ^ (bb[i % bb.length] ?? 0);
  }
  return diff === 0;
}

export default component$(() => {
  const loc = useLocation();
  const isNew = loc.url.pathname.startsWith("/admin/new");
  return (
    <div>
      <nav class="border-plum-100 mb-6 flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
        <div class="flex items-center gap-4">
          <Link
            href="/admin/"
            aria-current={!isNew ? "page" : undefined}
            class={[
              "font-semibold",
              !isNew ? "text-plum-700" : "hover:text-plum-700 text-gray-500",
            ]}
          >
            Events
          </Link>
          <Link
            href="/admin/new/"
            aria-current={isNew ? "page" : undefined}
            class={[
              "font-semibold",
              isNew ? "text-plum-700" : "hover:text-plum-700 text-gray-500",
            ]}
          >
            New event
          </Link>
        </div>
        <span class="bg-plum-100 text-plum-700 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase">
          Admin
        </span>
      </nav>
      <Slot />
    </div>
  );
});

import type { RequestEventBase } from "@builder.io/qwik-city";

/**
 * Returns the Cloudflare bindings (D1, KV, secrets) for the current request.
 *
 * In production the Workers runtime provides them on `platform.env`. In
 * `vite dev` there is no Workers runtime, so we lazily spin up wrangler's
 * platform proxy (miniflare) instead — it reads wrangler.jsonc and .dev.vars
 * and persists D1/KV data under .wrangler/state so `wrangler d1 ... --local`
 * commands operate on the same data.
 */
export async function getEnv(ev: RequestEventBase): Promise<Env> {
  const env = (ev.platform as { env?: Env }).env;
  if (env?.DB) {
    return env;
  }
  if (import.meta.env.DEV) {
    return getDevEnv();
  }
  throw new Error("Cloudflare bindings are not available");
}

let devEnvPromise: Promise<Env> | undefined;

function getDevEnv(): Promise<Env> {
  devEnvPromise ??= import("wrangler").then(async ({ getPlatformProxy }) => {
    const proxy = await getPlatformProxy<Env>({ persist: true });
    return proxy.env;
  });
  return devEnvPromise;
}

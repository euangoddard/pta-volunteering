import { cloudflarePagesAdapter as cloudflareWorkersAdapter } from "@builder.io/qwik-city/adapters/cloudflare-pages/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.cloudflare-pages.tsx", "@qwik-city-plan"],
        // `wrangler` is only ever dynamically imported for local dev (see
        // src/lib/platform.ts) and isn't available in the Workers runtime.
        // Rollup still statically discovers that dynamic import though, so
        // without this it tries to bundle wrangler's whole CLI (miniflare,
        // sharp, youch, ...) into the production worker, producing hundreds
        // of "externalized node built-in module" warnings.
        external: ["wrangler"],
      },
    },
    plugins: [cloudflareWorkersAdapter()],
  };
});

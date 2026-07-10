import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="mx-auto max-w-xl text-center">
      <div class="border-plum-100 rounded-2xl border bg-white p-8 shadow-sm sm:p-10">
        <div
          class="bg-flame-100 mx-auto mb-5 flex size-16 items-center justify-center rounded-full text-3xl"
          aria-hidden="true"
        >
          🔍
        </div>
        <h1 class="text-plum-700 text-2xl font-bold sm:text-3xl">
          We can't find that page
        </h1>
        <p class="mt-4 text-gray-600">
          The link may not have copied across in full, or the event may have
          finished and been taken down. Try the link again from the newsletter
          or your class group chat.
        </p>
        <p class="mt-4 text-sm text-gray-500">
          <a
            href="/"
            class="text-flame-600 font-semibold underline-offset-2 hover:underline"
          >
            Back to the home page
          </a>
        </p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Page not found · Sandhills PTA",
  meta: [{ name: "robots", content: "noindex" }],
};

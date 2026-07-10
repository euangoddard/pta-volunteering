import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="mx-auto max-w-xl text-center">
      <div class="border-plum-100 rounded-2xl border bg-white p-8 shadow-sm sm:p-10">
        <div class="bg-flame-100 mx-auto mb-5 flex size-16 items-center justify-center rounded-full text-3xl">
          🙌
        </div>
        <h1 class="text-plum-700 text-2xl font-bold sm:text-3xl">
          Lend a hand at our school events
        </h1>
        <p class="mt-4 text-gray-600">
          The PTA shares a private signup link for each event — check your
          email, the newsletter or the class group chat for the link, then pick
          a time slot that suits you. No account needed.
        </p>
        <p class="mt-4 text-sm text-gray-500">
          Organising an event?{" "}
          <a
            href="/admin/"
            class="text-flame-600 font-semibold underline-offset-2 hover:underline"
          >
            Go to the admin area
          </a>
          .
        </p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "PTA Volunteering · Sandhills Community Primary School",
  meta: [
    {
      name: "description",
      content: "Volunteer for Sandhills Community Primary School PTA events.",
    },
  ],
};

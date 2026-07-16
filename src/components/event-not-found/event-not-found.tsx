import { component$ } from "@builder.io/qwik";

export interface EventNotFoundProps {
  /** What couldn't be found, e.g. "that event" (default) or "that page". */
  subject?: string;
}

/**
 * Friendly dead-end for shared links that don't resolve — usually a link
 * that didn't copy across in full, or an event that has been taken down.
 */
export const EventNotFound = component$<EventNotFoundProps>(
  ({ subject = "that event" }) => {
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
            We can't find {subject}
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
  },
);

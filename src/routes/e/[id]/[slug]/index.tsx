import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Form,
  routeAction$,
  routeLoader$,
  zod$,
  z,
} from "@builder.io/qwik-city";
import {
  addVolunteer,
  eventPath,
  getEvent,
  getSlotsWithCounts,
} from "~/lib/db";
import { getEnv } from "~/lib/platform";
import { formatDate, slotLabel } from "~/lib/format";
import { ShareQr } from "~/components/share-qr/share-qr";

export const useEventData = routeLoader$(async (ev) => {
  const env = await getEnv(ev);
  const event = await getEvent(env, ev.params.id);
  if (!event) {
    throw ev.error(404, "Event not found");
  }
  if (event.slug !== ev.params.slug) {
    throw ev.redirect(302, eventPath(event));
  }
  const slots = await getSlotsWithCounts(env, event.id);
  return {
    event,
    slots,
    shareUrl: new URL(eventPath(event), ev.url.origin).href,
  };
});

export const useSignup = routeAction$(
  async (data, ev) => {
    const env = await getEnv(ev);
    const event = await getEvent(env, ev.params.id);
    if (!event) {
      return ev.fail(404, { message: "This event no longer exists." });
    }
    const results = await addVolunteer(env, event.id, data.slotIds ?? [], {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() ?? "",
      note: data.note?.trim() ?? "",
    });
    const slots = await getSlotsWithCounts(env, event.id);
    const labelOf = (slotId: string) => {
      const slot = slots.find((s) => s.id === slotId);
      return slot ? slotLabel(slot) : "Unknown slot";
    };
    const confirmed = results.filter((r) => r.ok).map((r) => labelOf(r.slotId));
    const full = results.filter((r) => !r.ok).map((r) => labelOf(r.slotId));
    if (confirmed.length === 0) {
      return ev.fail(409, {
        message:
          "Sorry — the slot(s) you picked just filled up. Please choose another time.",
      });
    }
    return { success: true as const, name: data.name.trim(), confirmed, full };
  },
  zod$({
    name: z.string().trim().min(1, "Please tell us your name"),
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z.string().optional(),
    note: z.string().max(500).optional(),
    slotIds: z
      .array(z.string())
      .min(1, "Please pick at least one time slot")
      .optional()
      .refine((v) => v && v.length > 0, "Please pick at least one time slot"),
  }),
);

export default component$(() => {
  const data = useEventData();
  const signup = useSignup();
  const { event, slots, shareUrl } = data.value;
  const done = signup.value?.success === true;

  return (
    <div class="mx-auto max-w-2xl">
      <div class="border-plum-100 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div class="bg-plum-700 px-6 py-6 text-white sm:px-8">
          <p class="text-flame-300 text-xs font-semibold tracking-widest uppercase">
            We need your help!
          </p>
          <h1 class="mt-1 text-2xl font-bold sm:text-3xl">{event.name}</h1>
          <p class="text-plum-200 mt-2 text-sm">
            {formatDate(event.event_date)}
            {event.location && <> · {event.location}</>}
          </p>
        </div>

        <div class="px-6 py-6 sm:px-8">
          {event.description && (
            <p class="mb-6 whitespace-pre-line text-gray-600">
              {event.description}
            </p>
          )}

          {done ? (
            <div class="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <div class="text-4xl">🎉</div>
              <h2 class="mt-2 text-xl font-bold text-green-800">
                Thank you, {signup.value?.name}!
              </h2>
              <p class="mt-2 text-green-700">You're signed up for:</p>
              <ul class="mt-2 font-semibold text-green-800">
                {signup.value?.confirmed?.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
              {!!signup.value?.full?.length && (
                <p class="mt-3 text-sm text-amber-700">
                  Unfortunately these slots had just filled up:{" "}
                  {signup.value.full.join(", ")}
                </p>
              )}
              <p class="mt-4 text-sm text-green-700">
                The PTA will be in touch nearer the time. Thank you for
                supporting our school!
              </p>
              <div class="border-plum-100 mt-6 rounded-xl border bg-white p-5 text-left">
                <h3 class="text-plum-700 font-bold">
                  Know someone else who could help?
                </h3>
                <p class="mt-1 mb-4 text-sm text-gray-500">
                  Pass the signup page on — they can scan the QR code or you can
                  share it straight from here.
                </p>
                <ShareQr
                  url={shareUrl}
                  title={`Volunteer: ${event.name}`}
                  text={`Can you lend a hand at ${event.name}? Pick a slot here:`}
                />
              </div>
            </div>
          ) : (
            <Form action={signup} class="space-y-6">
              <fieldset>
                <legend class="text-plum-700 text-lg font-bold">
                  1. Pick your time slot(s)
                </legend>
                <div class="mt-3 space-y-2">
                  {slots.map((slot) => {
                    const remaining = slot.capacity - slot.volunteer_count;
                    const isFull = remaining <= 0;
                    return (
                      <label
                        key={slot.id}
                        class={[
                          "flex items-center gap-3 rounded-xl border p-4 transition",
                          isFull
                            ? "border-gray-200 bg-gray-50 opacity-60"
                            : "border-plum-200 hover:border-flame-400 hover:bg-flame-50 cursor-pointer bg-white",
                        ]}
                      >
                        <input
                          type="checkbox"
                          name="slotIds[]"
                          value={slot.id}
                          disabled={isFull}
                          class="accent-flame-600 size-5"
                        />
                        <span class="grow">
                          <span class="block font-semibold text-gray-800">
                            {slotLabel(slot)}
                          </span>
                          <span
                            class={[
                              "block text-sm",
                              isFull
                                ? "font-semibold text-gray-500"
                                : "text-gray-500",
                            ]}
                          >
                            {isFull
                              ? "Full — thank you everyone!"
                              : `${remaining} of ${slot.capacity} place${slot.capacity === 1 ? "" : "s"} left`}
                          </span>
                        </span>
                        {!isFull && (
                          <span class="bg-flame-100 text-flame-700 rounded-full px-3 py-1 text-xs font-bold">
                            {remaining} left
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {signup.value?.fieldErrors?.slotIds && (
                  <p class="mt-2 text-sm font-semibold text-red-600">
                    Please pick at least one time slot
                  </p>
                )}
              </fieldset>

              <fieldset class="space-y-4">
                <legend class="text-plum-700 text-lg font-bold">
                  2. Your details
                </legend>
                <div>
                  <label
                    for="name"
                    class="mb-1 block text-sm font-semibold text-gray-700"
                  >
                    Your name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autocomplete="name"
                    class="focus:border-flame-500 focus:ring-flame-200 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                  />
                  {signup.value?.fieldErrors?.name && (
                    <p class="mt-1 text-sm text-red-600">
                      {signup.value.fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    for="email"
                    class="mb-1 block text-sm font-semibold text-gray-700"
                  >
                    Email address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autocomplete="email"
                    class="focus:border-flame-500 focus:ring-flame-200 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                  />
                  {signup.value?.fieldErrors?.email && (
                    <p class="mt-1 text-sm text-red-600">
                      {signup.value.fieldErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    for="phone"
                    class="mb-1 block text-sm font-semibold text-gray-700"
                  >
                    Phone{" "}
                    <span class="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autocomplete="tel"
                    class="focus:border-flame-500 focus:ring-flame-200 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    for="note"
                    class="mb-1 block text-sm font-semibold text-gray-700"
                  >
                    Anything we should know?{" "}
                    <span class="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={2}
                    maxLength={500}
                    class="focus:border-flame-500 focus:ring-flame-200 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
              </fieldset>

              {signup.value?.failed && signup.value?.message && (
                <p class="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {signup.value.message}
                </p>
              )}

              <button
                type="submit"
                disabled={signup.isRunning}
                class="bg-flame-600 hover:bg-flame-500 w-full rounded-xl px-6 py-3 text-lg font-bold text-white shadow-sm transition disabled:opacity-50"
              >
                {signup.isRunning ? "Signing you up…" : "Count me in!"}
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const { event } = resolveValue(useEventData);
  return {
    title: `Volunteer: ${event.name} · Sandhills PTA`,
    meta: [
      {
        name: "description",
        content: `Pick a time slot and sign up to help at ${event.name}. No account needed — it only takes a minute.`,
      },
      {
        name: "robots",
        content: "noindex", // private, hard-to-guess link
      },
    ],
  };
};

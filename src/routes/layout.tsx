import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex min-h-screen flex-col">
      <header class="border-flame-600 bg-plum-700 border-b-4 text-white">
        <div class="mx-auto flex max-w-4xl items-center gap-4 px-4 py-5 sm:px-6">
          <Link
            href="/"
            class="text-plum-700 flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-extrabold shadow-md"
            aria-label="PTA Volunteering home"
          >
            S
          </Link>
          <div>
            <p class="text-plum-200 text-xs font-semibold tracking-widest uppercase">
              Sandhills Community Primary School
            </p>
            <p class="text-xl font-bold sm:text-2xl">PTA Volunteering</p>
          </div>
        </div>
      </header>

      <div class="bg-plum-900 text-plum-200 py-1.5 text-center text-[11px] font-semibold tracking-[0.2em] uppercase">
        Respect · Resilience · Relationships · Responsibility
      </div>

      <main class="mx-auto w-full max-w-4xl grow px-4 py-8 sm:px-6">
        <Slot />
      </main>

      <footer class="bg-plum-900 text-plum-300 py-6 text-center text-sm">
        <p>
          Sandhills Community Primary School PTA · Thank you for lending a hand!
        </p>
      </footer>
    </div>
  );
});

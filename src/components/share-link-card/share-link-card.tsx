import { component$, useSignal } from "@builder.io/qwik";
import { ShareQr } from "~/components/share-qr/share-qr";

export interface ShareLinkCardProps {
  /** Absolute URL being shared. */
  url: string;
  /** Card heading, e.g. "Shareable signup link". */
  heading: string;
  /** Short explanation of who to share the link with. */
  description: string;
  /** Title shown in the native share sheet. */
  shareTitle: string;
  /** Message shown alongside the link in the native share sheet. */
  shareText: string;
}

/**
 * Admin card for a shareable public link: the URL with copy + preview
 * buttons, and a QR code with image-copy / native-share support.
 */
export const ShareLinkCard = component$<ShareLinkCardProps>(
  ({ url, heading, description, shareTitle, shareText }) => {
    const copied = useSignal(false);

    return (
      <div class="border-plum-100 rounded-xl border bg-white p-5 shadow-sm">
        <h2 class="text-plum-700 font-bold">{heading}</h2>
        <p class="mt-1 text-sm text-gray-500">{description}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <code class="bg-plum-50 text-plum-800 min-w-0 grow overflow-x-auto rounded-lg px-3 py-2 text-sm">
            {url}
          </code>
          <button
            type="button"
            onClick$={async () => {
              await navigator.clipboard.writeText(url);
              copied.value = true;
              setTimeout(() => (copied.value = false), 2000);
            }}
            class="bg-plum-700 hover:bg-plum-600 rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
          >
            {copied.value ? "Copied!" : "Copy link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener"
            class="border-plum-200 text-plum-700 hover:bg-plum-50 rounded-lg border px-4 py-2 text-sm font-semibold transition"
          >
            Preview
          </a>
        </div>
        <div class="border-plum-100 mt-4 border-t pt-4">
          <ShareQr url={url} title={shareTitle} text={shareText} />
        </div>
      </div>
    );
  },
);

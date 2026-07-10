import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { renderSVG } from "uqr";

export interface ShareQrProps {
  /** Absolute URL the QR code points at. */
  url: string;
  /** Title shown in the native share sheet. */
  title?: string;
  /** Message shown alongside the link in the native share sheet. */
  text?: string;
}

const QR_PNG_SIZE = 512;

function qrSvg(url: string): string {
  return renderSVG(url, { border: 2, ecc: "M" });
}

function qrPngBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = QR_PNG_SIZE;
      canvas.height = QR_PNG_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, QR_PNG_SIZE, QR_PNG_SIZE);
      ctx.drawImage(image, 0, 0, QR_PNG_SIZE, QR_PNG_SIZE);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("QR render failed")),
        "image/png",
      );
    };
    image.onerror = () => reject(new Error("QR render failed"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(url))}`;
  });
}

/**
 * QR code for a link, with copy-to-clipboard (as an image, falling back to
 * the link text) and native share-sheet support where available.
 */
export const ShareQr = component$<ShareQrProps>(({ url, title, text }) => {
  const copied = useSignal<"image" | "link" | null>(null);
  const canShare = useSignal(false);

  // Web Share availability is only knowable in the browser.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    canShare.value = typeof navigator.share === "function";
  });

  const copyQr$ = $(async () => {
    try {
      // ClipboardItem takes the pending blob so Safari keeps the user gesture.
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": qrPngBlob(url) }),
      ]);
      copied.value = "image";
    } catch {
      // Image clipboard is unsupported in some browsers (e.g. Firefox).
      await navigator.clipboard.writeText(url);
      copied.value = "link";
    }
    setTimeout(() => (copied.value = null), 2000);
  });

  const share$ = $(async () => {
    const data: ShareData = { title, text, url };
    try {
      const file = new File([await qrPngBlob(url)], "signup-qr.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ ...data, files: [file] })) {
        await navigator.share({ ...data, files: [file] });
        return;
      }
    } catch {
      // Fall through to a link-only share.
    }
    await navigator.share(data).catch(() => {
      // User dismissed the share sheet.
    });
  });

  return (
    <div class="flex flex-col items-center gap-4 sm:flex-row">
      <div
        class="border-plum-100 w-36 shrink-0 rounded-xl border bg-white p-2 shadow-sm [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={qrSvg(url)}
      />
      <div class="flex flex-col items-center gap-2 sm:items-start">
        <div class="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick$={copyQr$}
            class="bg-plum-700 hover:bg-plum-600 rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
          >
            {copied.value ? "Copied!" : "Copy QR code"}
          </button>
          {canShare.value && (
            <button
              type="button"
              onClick$={share$}
              class="border-plum-200 text-plum-700 hover:bg-plum-50 rounded-lg border px-4 py-2 text-sm font-semibold transition"
            >
              Share…
            </button>
          )}
        </div>
        <p class="text-xs text-gray-400">
          {copied.value === "link"
            ? "Link copied to your clipboard."
            : "Scan it with a phone camera to open the signup page."}
        </p>
      </div>
    </div>
  );
});

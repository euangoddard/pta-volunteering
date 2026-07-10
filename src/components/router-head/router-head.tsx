import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  const description = head.meta.find((m) => m.name === "description")?.content;
  const isAdmin = loc.url.pathname.startsWith("/admin");

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={loc.url.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#761212" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/x-icon" sizes="16x16" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {isAdmin && <meta name="robots" content="noindex" />}

      <meta property="og:site_name" content="Sandhills PTA Volunteering" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={loc.url.href} />
      <meta property="og:title" content={head.title} />
      {description && <meta property="og:description" content={description} />}
      <meta
        property="og:image"
        content={new URL("/og-image.png", loc.url).href}
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Sandhills Community Primary School PTA Volunteering"
      />
      <meta name="twitter:card" content="summary_large_image" />

      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML
            ? {}
            : { dangerouslySetInnerHTML: s.style })}
        />
      ))}

      {head.scripts.map((s) => (
        <script
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML
            ? {}
            : { dangerouslySetInnerHTML: s.script })}
        />
      ))}
    </>
  );
});

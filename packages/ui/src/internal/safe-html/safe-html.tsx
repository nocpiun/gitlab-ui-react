/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/directives/safe_html/safe_html.js
 * packages/gitlab-ui/src/directives/safe_html/constants.js
 *
 * Adaptation: a React component instead of a Vue directive. In the browser it
 * sanitizes with DOMPurify using the upstream configuration and inserts the
 * resulting DOM fragment directly (RETURN_DOM_FRAGMENT), avoiding the extra
 * serialize/parse round trip of `dangerouslySetInnerHTML` (upstream mXSS
 * mitigation, see gitlab-org/gitlab-ui MRs 1782 and 2127).
 *
 * Deliberate deviation: DOMPurify requires a DOM, and upstream's directive is
 * client-only, so on the server its input would pass through unsanitized.
 * This component fails closed instead: without a DOM it renders the escaped
 * plain-text `fallback` (or an empty container) and never the raw HTML.
 */

import DOMPurify, { type Config } from "dompurify";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Upstream constants.js: https://gitlab.com/gitlab-org/gitlab-ui/-/issues/1421#note_617098438
const FORBIDDEN_DATA_ATTRS = [
  "data-remote",
  "data-url",
  "data-type",
  "data-method",
  "data-disable-with",
  "data-disabled",
  "data-disable",
  "data-turbo",
];
const FORBIDDEN_TAGS = ["style", "mstyle", "form"];

const DOMPURIFY_CONFIG = {
  ALLOW_UNKNOWN_PROTOCOLS: true,
  FORBID_ATTR: FORBIDDEN_DATA_ATTRS,
  FORBID_TAGS: FORBIDDEN_TAGS,
} satisfies Config;

function sanitizeToFragment(html: string): DocumentFragment | null {
  // Without a DOM, DOMPurify's default export is an unconfigured factory
  // without `sanitize`; fail closed instead of passing the input through.
  if(typeof DOMPurify.sanitize !== "function") {
    return null;
  }
  return DOMPurify.sanitize(html, { ...DOMPURIFY_CONFIG, RETURN_DOM_FRAGMENT: true as const });
}

// Layout effect so the sanitized content is in place before paint; on the
// server there is no DOM to mutate, so a plain effect avoids React's
// useLayoutEffect-on-the-server warning.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type SafeHtmlProps = {
  /**
   * Plain text rendered when the HTML cannot be sanitized (server rendering).
   * Callers should pass a meaningful fallback, such as the option text.
   */
  fallback?: string;
  /** HTML string to sanitize and render inside a `<span>`. */
  html: string;
};

export default function SafeHtml({ fallback, html }: SafeHtmlProps) {
  const contentRef = useRef<HTMLSpanElement>(null);
  const [showFallback, setShowFallback] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    if(!content) {
      return;
    }
    const fragment = sanitizeToFragment(html);
    if(fragment) {
      // This span never has React children, so the fragment can be replaced
      // wholesale without detaching a node that React still tracks.
      content.replaceChildren(fragment);
      setShowFallback(false);
    } else {
      content.replaceChildren();
      setShowFallback(true);
    }
  }, [html]);

  // The fallback remains in a React-owned subtree while sanitized HTML is
  // inserted into a separate, imperatively owned subtree. The initial state
  // is deterministic for SSR and hydration; the layout effect switches to the
  // sanitized content before paint when DOMPurify is available.
  return (
    <span>
      <span hidden={!showFallback}>{fallback ?? null}</span>
      <span ref={contentRef} hidden={showFallback} />
    </span>
  );
}

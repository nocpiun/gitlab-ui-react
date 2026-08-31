/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/directives/safe_html/safe_html.js
 * packages/gitlab-ui/src/directives/safe_html/constants.js
 *
 * Adaptation: a React component instead of a Vue directive. Sanitizes with
 * DOMPurify using the upstream configuration and renders the result via
 * `dangerouslySetInnerHTML`; upstream's `RETURN_DOM_FRAGMENT` option only
 * changes the return type and is not needed here. DOMPurify requires a DOM:
 * without one (server-side rendering) the input passes through unchanged
 * (DOMPurify's own documented fallback), matching upstream's client-only
 * directive.
 */

import DOMPurify from "dompurify";

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
};

function sanitize(html: string): string {
  // Without a DOM, DOMPurify's default export is an unconfigured factory
  // without `sanitize`; pass the input through like its own fallback.
  return typeof DOMPurify.sanitize === "function" ? DOMPurify.sanitize(html, DOMPURIFY_CONFIG) : html;
}

export type SafeHtmlProps = {
  /** HTML string to sanitize and render inside a `<span>`. */
  html: string;
};

export default function SafeHtml({ html }: SafeHtmlProps) {
  return <span dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;
}

/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/markdown/markdown.spec.js
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlMarkdown from "./markdown";

describe("GlMarkdown", () => {
  it("renders the markdown class without compact styling by default or when disabled", () => {
    const defaultMarkup = renderToStaticMarkup(<GlMarkdown />);
    const disabledMarkup = renderToStaticMarkup(<GlMarkdown compact={false} />);

    expect(defaultMarkup).toContain("class=\"gl-markdown\"");
    expect(disabledMarkup).toContain("class=\"gl-markdown\"");
    expect(defaultMarkup).not.toContain("gl-compact-markdown");
    expect(disabledMarkup).not.toContain("gl-compact-markdown");
  });

  it("applies compact markdown styling when compact is true", () => {
    const markup = renderToStaticMarkup(<GlMarkdown compact />);

    expect(markup).toContain(
      "class=\"gl-markdown gl-compact-markdown\"",
    );
  });

  it("preserves semantic children", () => {
    const markup = renderToStaticMarkup(
      <GlMarkdown>
        <h2>Release notes</h2>
        <p>Read the changes before upgrading.</p>
        <pre><code>pnpm install</code></pre>
      </GlMarkdown>,
    );

    expect(markup).toContain("<h2>Release notes</h2>");
    expect(markup).toContain("<p>Read the changes before upgrading.</p>");
    expect(markup).toContain("<pre><code>pnpm install</code></pre>");
  });

  it("merges consumer classes and passes native div attributes through", () => {
    const markup = renderToStaticMarkup(
      <GlMarkdown
        className="custom-markdown"
        data-testid="markdown"
        id="release-notes" />,
    );

    expect(markup).toContain("id=\"release-notes\"");
    expect(markup).toContain("data-testid=\"markdown\"");
    expect(markup).toContain("class=\"gl-markdown custom-markdown\"");
  });
});

import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SafeHtml from "./safe-html";

// These tests run in a Node environment without a DOM, so they also prove the
// component never touches `window`/`document` during server rendering.
describe("SafeHtml (server rendering)", () => {
  it("fails closed: never emits the raw HTML", () => {
    const markup = renderToStaticMarkup(
      <SafeHtml fallback="fallback" html={"<strong>HTML</strong><script>alert(1)</script>"} />,
    );

    expect(markup).not.toContain("<strong>");
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("alert(1)");
  });

  it("renders the plain-text fallback in a React-owned subtree", () => {
    const markup = renderToStaticMarkup(
      <SafeHtml fallback="fallback text" html="<strong>HTML</strong>" />,
    );

    expect(markup).toBe("<span><span>fallback text</span><span hidden=\"\"></span></span>");
  });

  it("escapes a fallback that itself looks like markup", () => {
    const markup = renderToStaticMarkup(
      <SafeHtml fallback={"<img src=x onerror=\"alert(1)\">"} html="<b>html</b>" />,
    );

    expect(markup).toBe(
      "<span><span>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</span><span hidden=\"\"></span></span>",
    );
  });

  it("renders empty fallback and content containers when no fallback is provided", () => {
    const markup = renderToStaticMarkup(<SafeHtml html={"<script>alert(1)</script>"} />);

    expect(markup).toBe("<span><span></span><span hidden=\"\"></span></span>");
  });

  it("produces identical output with renderToString (hydration contract)", () => {
    const element = <SafeHtml fallback="fallback" html={"<strong>HTML</strong><script>alert(1)</script>"} />;

    expect(renderToString(element)).toBe(renderToStaticMarkup(element));
  });
});

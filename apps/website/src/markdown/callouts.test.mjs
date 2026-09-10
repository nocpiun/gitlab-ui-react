import { describe, expect, it } from "vitest";
import { markdownToJs, mdxToJs } from "satteri";
import { calloutsPlugin } from "./callouts.mjs";

function compile(source) {
  const { code } = mdxToJs(source, {
    mdastPlugins: [calloutsPlugin],
  });

  return code;
}

describe("calloutsPlugin", () => {
  it.each([
    ["NOTE", "Note", "info"],
    ["TIP", "Tip", "tip"],
    ["IMPORTANT", "Important", "info"],
    ["WARNING", "Warning", "warning"],
    ["CAUTION", "Caution", "danger"],
  ])("maps %s callouts to a GlAlert-compatible variant", (marker, title, variant) => {
    const code = compile(`> [!${marker}]\n> Callout body.`);

    expect(code).toContain("const { DocsCallout } = _components;");
    expect(code).toContain(`title: "${title}"`);
    expect(code).toContain(`variant: "${variant}"`);
    expect(code).not.toContain(`[!${marker}]`);
  });

  it("preserves rich Markdown content after removing the marker", () => {
    const code = compile([
      "> [!warning]",
      "> **Important text** with [a link](https://example.com).",
      ">",
      "> A second paragraph.",
    ].join("\n"));

    expect(code).toContain("_components.strong");
    expect(code).toContain("href: \"https://example.com\"");
    expect(code).toContain("A second paragraph.");
    expect(code).not.toContain("[!warning]");
  });

  it("leaves ordinary blockquotes unchanged", () => {
    const code = compile("> An ordinary quotation.");

    expect(code).toContain("_components.blockquote");
    expect(code).not.toContain("DocsCallout");
  });

  it("also transforms callouts in plain Markdown", () => {
    const { code } = markdownToJs("> [!NOTE]\n> Plain Markdown.", {
      mdastPlugins: [calloutsPlugin],
    });

    expect(code).toContain("DocsCallout");
    expect(code).not.toContain("[!NOTE]");
  });
});

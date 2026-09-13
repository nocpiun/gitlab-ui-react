import { describe, expect, it, vi } from "vitest";
import {
  docsMarkdownPath,
  docsMarkdownStaticPaths,
  renderDocsMarkdown,
  renderLlmsTxt,
  type DocsContentEntry,
} from "./llm";

function docsEntry(
  id: string,
  title: string,
  body = "",
  description?: string,
): DocsContentEntry {
  return {
    body,
    data: {
      ...(description ? { description } : {}),
      title,
    },
    id,
  };
}

describe("renderDocsMarkdown", () => {
  it("preserves Markdown and expands examples outside code fences", () => {
    const getExampleSource = vi.fn((filename: string) => (
      filename === "button/ButtonExample.tsx"
        ? "export default function Example() {\r\n  return <button />;\r\n}\r\n"
        : undefined
    ));
    const entry = docsEntry(
      "en/components/button",
      "Button",
      [
        "## Usage",
        "",
        "> [!warning]",
        "> Use an accessible name.",
        "",
        "```md",
        "<DocsExample filename=\"literal.tsx\" title=\"Literal\"/>",
        "```",
        "",
        "<DocsExample",
        "  filename=\"button/ButtonExample.tsx\"",
        "  title=\"Example button\"",
        "  storybookId=\"ui-base-button--default\"/>",
      ].join("\r\n"),
      "Triggers an action.",
    );

    const markdown = renderDocsMarkdown(entry, getExampleSource);

    expect(markdown).toContain("# Button\n\n> Triggers an action.\n\n## Usage");
    expect(markdown).toContain("> [!warning]\n> Use an accessible name.");
    expect(markdown).toContain(
      "```md\n<DocsExample filename=\"literal.tsx\" title=\"Literal\"/>\n```",
    );
    expect(markdown).toContain(
      "[View in Storybook](https://glui-story.nocp.space/?path=/story/ui-base-button--default)",
    );
    expect(markdown).toContain(
      "```tsx\nexport default function Example() {\n  return <button />;\n}\n```",
    );
    expect(markdown).not.toContain("\r");
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
    expect(getExampleSource).toHaveBeenCalledOnce();
    expect(getExampleSource).toHaveBeenCalledWith("button/ButtonExample.tsx");
  });

  it("localizes the Storybook label and omits the link when no ID is provided", () => {
    const withStorybook = renderDocsMarkdown(
      docsEntry(
        "zh/components/button",
        "按钮",
        [
          "<DocsExample",
          "  filename=\"button/ButtonExample.tsx\"",
          "  title=\"按钮示例\"",
          "  storybookId=\"ui-base-button--default\"/>",
        ].join("\n"),
      ),
      () => "export default () => <button />;",
    );
    const withoutStorybook = renderDocsMarkdown(
      docsEntry(
        "zh/components/button",
        "按钮",
        "<DocsExample filename=\"button/ButtonExample.tsx\" title=\"按钮示例\"/>",
      ),
      () => "export default () => <button />;",
    );

    expect(withStorybook).toContain("# 按钮");
    expect(withStorybook).not.toContain("### 按钮示例");
    expect(withStorybook).toContain(
      "[在 Storybook 中查看](https://glui-story.nocp.space/?path=/story/ui-base-button--default)",
    );
    expect(withoutStorybook).not.toContain("Storybook");
  });

  it("preserves DocsExample syntax inside inline code", () => {
    const getExampleSource = vi.fn();
    const body = [
      "Use `<DocsExample filename=\"button/ButtonExample.tsx\" title=\"Example\" />` here.",
      "",
      "Use ``<DocsExample filename=\"button/`Example.tsx\" title=\"Example\" />`` too.",
    ].join("\n");

    expect(renderDocsMarkdown(
      docsEntry("en/components/button", "Button", body),
      getExampleSource,
    )).toContain(body);
    expect(getExampleSource).not.toHaveBeenCalled();
  });

  it("removes leading MDX imports while preserving documented and rendered component code", () => {
    const body = [
      "import { GlButton } from \"gitlab-ui-react/button\";",
      "import {",
      "  PackageManagerTabs,",
      "} from \"../../apps/website/src/components/package-manager-tabs\";",
      "",
      "```tsx",
      "import { GlButton } from \"gitlab-ui-react/button\";",
      "```",
      "",
      "<div className=\"my-7\">",
      "  <GlButton>Hello World</GlButton>",
      "</div>",
    ].join("\n");

    const markdown = renderDocsMarkdown(docsEntry("en/installation", "Installation", body));

    expect(markdown).not.toContain("PackageManagerTabs,");
    expect(markdown.match(/import \{ GlButton \}/g)).toHaveLength(1);
    expect(markdown).toContain(
      "```tsx\nimport { GlButton } from \"gitlab-ui-react/button\";\n```",
    );
    expect(markdown).toContain("<GlButton>Hello World</GlButton>");
  });

  it("expands package manager tabs outside code fences", () => {
    const body = [
      "Use `<PackageManagerTabs dependencies=\"inline\" />` literally.",
      "",
      "```mdx",
      "<PackageManagerTabs dependencies=\"fenced\" />",
      "```",
      "",
      "<PackageManagerTabs",
      "  client:load",
      "  dependencies=\"gitlab-ui-react @gitlab-ui-react/styles\"/>",
    ].join("\n");

    const markdown = renderDocsMarkdown(docsEntry("en/installation", "Installation", body));

    expect(markdown).toContain(
      "Use `<PackageManagerTabs dependencies=\"inline\" />` literally.",
    );
    expect(markdown).toContain(
      "```mdx\n<PackageManagerTabs dependencies=\"fenced\" />\n```",
    );
    expect(markdown).toContain(
      "**pnpm**\n\n```sh\npnpm add gitlab-ui-react @gitlab-ui-react/styles\n```",
    );
    expect(markdown).toContain(
      "**npm**\n\n```sh\nnpm install gitlab-ui-react @gitlab-ui-react/styles\n```",
    );
    expect(markdown).toContain(
      "**yarn**\n\n```sh\nyarn add gitlab-ui-react @gitlab-ui-react/styles\n```",
    );
  });

  it("fails when source content or a referenced example is missing", () => {
    expect(() => renderDocsMarkdown({ data: { title: "Missing" }, id: "en/missing" }))
      .toThrow("Documentation entry \"en/missing\" has no source body");
    expect(() => renderDocsMarkdown(
      docsEntry(
        "en/components/button",
        "Button",
        "<DocsExample filename=\"button/Missing.tsx\" title=\"Missing\"/>",
      ),
      () => undefined,
    )).toThrow("Unknown example file \"button/Missing.tsx\"");
  });

  it("fails when a DocsExample is malformed", () => {
    expect(() => renderDocsMarkdown(
      docsEntry(
        "en/components/button",
        "Button",
        "<DocsExample filename=\"button/ButtonExample.tsx\"/>",
      ),
      () => "source",
    )).toThrow("DocsExample requires non-empty filename and title attributes");
  });

  it("fails when PackageManagerTabs is malformed", () => {
    expect(() => renderDocsMarkdown(
      docsEntry(
        "en/installation",
        "Installation",
        "<PackageManagerTabs client:load />",
      ),
    )).toThrow("PackageManagerTabs requires a non-empty dependencies attribute");
  });
});

describe("renderLlmsTxt", () => {
  it("groups locales and sorts introduction before normalized document IDs", () => {
    const entries = [
      docsEntry("zh/installation", "安装", "", "安装组件库。"),
      docsEntry("en/installation", "Installation", "", "Install the library."),
      docsEntry("en/components/button", "Button"),
      docsEntry("zh", "介绍", "", "React 组件库。"),
      docsEntry("en", "Introduction", "", "A React component library."),
    ];

    expect(renderLlmsTxt(entries, new URL("https://example.com/nested/path"))).toBe([
      "# GitLab UI React",
      "",
      "> A type-safe React implementation of GitLab's Pajamas Design System.",
      "",
      "## English documentation",
      "",
      "- [Introduction](https://example.com/docs.md): A React component library.",
      "- [Button](https://example.com/docs/components/button.md)",
      "- [Installation](https://example.com/docs/installation.md): Install the library.",
      "",
      "## 简体中文文档",
      "",
      "- [介绍](https://example.com/zh/docs.md): React 组件库。",
      "- [安装](https://example.com/zh/docs/installation.md): 安装组件库。",
      "",
      "## Optional",
      "",
      "- [Website](https://example.com/): GitLab UI React website and documentation.",
      "- [GitHub repository](https://github.com/nocpiun/gitlab-ui-react): Source code for GitLab UI React.",
      "- [Storybook](https://glui-story.nocp.space): Interactive component examples.",
      "",
    ].join("\n"));
  });
});

describe("docsMarkdownPath", () => {
  it("appends .md to localized canonical documentation paths", () => {
    expect(docsMarkdownPath("en", "index")).toBe("/docs.md");
    expect(docsMarkdownPath("en", "components/button")).toBe("/docs/components/button.md");
    expect(docsMarkdownPath("zh", "index")).toBe("/zh/docs.md");
    expect(docsMarkdownPath("zh", "components/button")).toBe("/zh/docs/components/button.md");
  });

  it("generates one static route for every localized document", () => {
    const entries = [
      docsEntry("en", "Introduction"),
      docsEntry("zh/components/button", "Button"),
    ];

    expect(docsMarkdownStaticPaths(entries)).toEqual([
      {
        params: { slug: "docs" },
        props: { entry: entries[0] },
      },
      {
        params: { slug: "zh/docs/components/button" },
        props: { entry: entries[1] },
      },
    ]);
  });
});

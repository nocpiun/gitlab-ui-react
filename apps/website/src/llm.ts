import { githubRepoUrl, storybookUrl } from "./global";
import {
  docPath,
  localeFromDocId,
  locales,
  normalizeDocId,
  type Locale,
} from "./i18n/config";

export type DocsContentEntry = {
  body?: string;
  data: {
    description?: string;
    title: string;
  };
  id: string;
};

type ExampleSourceResolver = (filename: string) => string | undefined;

type DocsExampleAttributes = {
  filename: string;
  storybookId?: string;
  title: string;
};

const exampleSourceModules = import.meta.glob<string>("../../../examples/**/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

function normalizeLineEndings(value: string) {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function relativeExamplePath(path: string) {
  const normalizedPath = path.replaceAll("\\", "/");
  const examplesDirectory = "examples/";
  const directoryIndex = normalizedPath.lastIndexOf(examplesDirectory);

  if(directoryIndex === -1) {
    throw new Error(`[LLM] Unable to resolve example path "${path}".`);
  }

  return normalizedPath.slice(directoryIndex + examplesDirectory.length);
}

const exampleSourcesByPath = new Map(
  Object.entries(exampleSourceModules).map(([path, source]) => [
    relativeExamplePath(path),
    normalizeLineEndings(source),
  ]),
);

function resolveExampleSource(filename: string) {
  return exampleSourcesByPath.get(filename);
}

function parseDocsExampleAttributes(source: string): DocsExampleAttributes {
  const attributes = new Map<string, string>();
  const attributePattern = /([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let cursor = 0;

  for(const match of source.matchAll(attributePattern)) {
    const index = match.index;

    if(source.slice(cursor, index).trim()) {
      throw new Error(`[LLM] Invalid DocsExample attributes: ${source.trim()}`);
    }

    const name = match[1];
    const value = match[2] ?? match[3] ?? "";

    if(attributes.has(name)) {
      throw new Error(`[LLM] Duplicate DocsExample attribute "${name}".`);
    }

    attributes.set(name, value);
    cursor = index + match[0].length;
  }

  if(source.slice(cursor).trim()) {
    throw new Error(`[LLM] Invalid DocsExample attributes: ${source.trim()}`);
  }

  const supportedAttributes = new Set(["filename", "storybookId", "title"]);

  for(const name of attributes.keys()) {
    if(!supportedAttributes.has(name)) {
      throw new Error(`[LLM] Unsupported DocsExample attribute "${name}".`);
    }
  }

  const filename = attributes.get("filename");
  const title = attributes.get("title");

  if(!filename || !title) {
    throw new Error("[LLM] DocsExample requires non-empty filename and title attributes.");
  }

  const storybookId = attributes.get("storybookId");

  return {
    filename,
    ...(storybookId ? { storybookId } : {}),
    title,
  };
}

function renderDocsExample(
  attributes: DocsExampleAttributes,
  locale: Locale,
  getExampleSource: ExampleSourceResolver,
) {
  const source = getExampleSource(attributes.filename);

  if(source === undefined) {
    throw new Error(`[LLM] Unknown example file "${attributes.filename}".`);
  }

  const sections: string[] = [];

  if(attributes.storybookId) {
    const linkLabel = locale === "zh" ? "在 Storybook 中查看" : "View in Storybook";
    sections.push(
      `[${linkLabel}](${storybookUrl}/?path=/story/${attributes.storybookId})`,
    );
  }

  sections.push("```tsx\n" + normalizeLineEndings(source).trimEnd() + "\n```");
  return sections.join("\n\n");
}

function expandDocsExamples(
  body: string,
  locale: Locale,
  getExampleSource: ExampleSourceResolver,
) {
  const lines = normalizeLineEndings(body).split("\n");
  const output: string[] = [];
  let fence: { character: string; length: number } | undefined;

  for(let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

    if(fenceMatch) {
      const marker = fenceMatch[1];

      if(!fence) {
        fence = { character: marker[0], length: marker.length };
      } else if(
        marker[0] === fence.character
        && marker.length >= fence.length
        && fenceMatch[2].trim() === ""
      ) {
        fence = undefined;
      }

      output.push(line);
      continue;
    }

    if(fence || !line.includes("<DocsExample")) {
      output.push(line);
      continue;
    }

    if(!/^\s*<DocsExample\b/.test(line)) {
      throw new Error("[LLM] DocsExample must be a standalone block.");
    }

    const tagLines = [line];

    while(!tagLines.at(-1)?.includes("/>") && index + 1 < lines.length) {
      index += 1;
      tagLines.push(lines[index]);
    }

    const tag = tagLines.join("\n");
    const tagMatch = tag.match(/^\s*<DocsExample\b([\s\S]*?)\/>\s*$/);

    if(!tagMatch) {
      throw new Error(`[LLM] Invalid DocsExample block: ${tag.trim()}`);
    }

    output.push(
      renderDocsExample(
        parseDocsExampleAttributes(tagMatch[1]),
        locale,
        getExampleSource,
      ),
    );
  }

  return output.join("\n");
}

export function docsMarkdownPath(locale: Locale, id: string) {
  return docPath(locale, id) + ".md";
}

export function docsMarkdownStaticPaths(entries: readonly DocsContentEntry[]) {
  return entries.map((entry) => {
    const locale = localeFromDocId(entry.id);
    const markdownPath = docsMarkdownPath(locale, normalizeDocId(entry.id));

    return {
      params: {
        slug: markdownPath.slice(1, -".md".length),
      },
      props: { entry },
    };
  });
}

export function renderDocsMarkdown(
  entry: DocsContentEntry,
  getExampleSource: ExampleSourceResolver = resolveExampleSource,
) {
  if(entry.body === undefined) {
    throw new Error(`[LLM] Documentation entry "${entry.id}" has no source body.`);
  }

  const locale = localeFromDocId(entry.id);
  const sections = [`# ${entry.data.title}`];

  if(entry.data.description) sections.push(`> ${entry.data.description}`);

  const body = expandDocsExamples(entry.body, locale, getExampleSource).trim();
  if(body) sections.push(body);

  return sections.join("\n\n").trimEnd() + "\n";
}

function compareDocEntries(left: DocsContentEntry, right: DocsContentEntry) {
  const leftId = normalizeDocId(left.id);
  const rightId = normalizeDocId(right.id);

  if(leftId === "index") return rightId === "index" ? 0 : -1;
  if(rightId === "index") return 1;
  return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
}

function docsLinksForLocale(
  entries: readonly DocsContentEntry[],
  locale: Locale,
  site: URL,
) {
  return entries
    .filter((entry) => localeFromDocId(entry.id) === locale)
    .toSorted(compareDocEntries)
    .map((entry) => {
      const id = normalizeDocId(entry.id);
      const url = new URL(docsMarkdownPath(locale, id), site);
      const description = entry.data.description ? `: ${entry.data.description}` : "";

      return `- [${entry.data.title}](${url})${description}`;
    })
    .join("\n");
}

export function renderLlmsTxt(entries: readonly DocsContentEntry[], site: URL) {
  const siteRoot = new URL("/", site);
  const sectionTitles: Record<Locale, string> = {
    en: "English documentation",
    zh: "简体中文文档",
  };
  const sections = [
    "# GitLab UI React",
    "> A type-safe React implementation of GitLab's Pajamas Design System.",
    ...locales.map((locale) => (
      `## ${sectionTitles[locale]}\n\n${docsLinksForLocale(entries, locale, siteRoot)}`
    )),
    [
      "## Optional",
      "",
      `- [Website](${siteRoot}): GitLab UI React website and documentation.`,
      `- [GitHub repository](${githubRepoUrl}): Source code for GitLab UI React.`,
      `- [Storybook](${storybookUrl}): Interactive component examples.`,
    ].join("\n"),
  ];

  return sections.join("\n\n").trimEnd() + "\n";
}

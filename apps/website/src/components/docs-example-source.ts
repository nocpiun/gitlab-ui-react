import { createHighlighter } from "shiki";

const exampleSources = import.meta.glob<string>("@examples/**/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});
const sourceCodeThemes = {
  light: "github-light",
  dark: "github-dark",
} as const;
const sourceHighlighter = await createHighlighter({
  langs: ["tsx"],
  themes: Object.values(sourceCodeThemes),
});

function relativeExamplePath(path: string) {
  const normalizedPath = path.replaceAll("\\", "/");
  const examplesDirectory = "examples/";
  const directoryIndex = normalizedPath.lastIndexOf(examplesDirectory);

  if(directoryIndex === -1) {
    throw new Error(`[DocsExample] Unable to resolve example path "${path}".`);
  }

  return normalizedPath.slice(directoryIndex + examplesDirectory.length);
}

const highlightedSourcesByPath = new Map(
  Object.entries(exampleSources).map(([path, source]) => [
    relativeExamplePath(path),
    sourceHighlighter.codeToHtml(source, { lang: "tsx", themes: sourceCodeThemes }),
  ]),
);

export function getHighlightedExampleSource(filename: string) {
  const highlightedSource = highlightedSourcesByPath.get(filename);

  if(highlightedSource === undefined) {
    const availableExamples = [...highlightedSourcesByPath.keys()].sort().join(", ");
    throw new Error(
      `[DocsExample] Unknown example file "${filename}". Available files: ${availableExamples}`,
    );
  }

  return highlightedSource;
}

import type { ComponentType } from "react";
import { GlButton, GlCard, GlCardContent, GlCardHeader } from "gitlab-ui-react";
import { createHighlighter } from "shiki";

type ExampleModule = {
  default: ComponentType;
};

export type DocsExampleProps = {
  filename: string;
  title: string;
};

const exampleModules = import.meta.glob<ExampleModule>("@examples/*.tsx", {
  eager: true,
});
const exampleSources = import.meta.glob<string>("@examples/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});
const sourceHighlighter = await createHighlighter({
  langs: ["tsx"],
  themes: ["github-dark"],
});

function filenameFromPath(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}

const examplesByFilename = new Map(
  Object.entries(exampleModules).map(([path, module]) => [
    filenameFromPath(path),
    module.default,
  ]),
);
const highlightedSourcesByFilename = new Map(
  Object.entries(exampleSources).map(([path, source]) => [
    filenameFromPath(path),
    sourceHighlighter.codeToHtml(source, { lang: "tsx", theme: "github-dark" }),
  ]),
);

export function DocsExample({ filename, title }: DocsExampleProps) {
  const Example = examplesByFilename.get(filename);
  const highlightedSource = highlightedSourcesByFilename.get(filename);

  if(!Example || highlightedSource === undefined) {
    const availableExamples = [...examplesByFilename.keys()].sort().join(", ");
    throw new Error(
      `[DocsExample] Unknown example file "${filename}". Available files: ${availableExamples}`,
    );
  }

  return (
    <GlCard className="my-7" data-docs-example>
      <GlCardHeader className="flex items-center justify-between gap-3 pr-1 pt-1 pb-2">
        <span className="text-300 font-bold">{title}</span>
        <GlButton
          aria-pressed="false"
          category="tertiary"
          data-docs-example-toggle
          size="small"
          icon="code"/>
      </GlCardHeader>
      <GlCardContent data-docs-example-component>
        <Example />
      </GlCardContent>
      <div
        className="docs-example-source mt-3"
        data-docs-example-source
        dangerouslySetInnerHTML={{ __html: highlightedSource }}
        hidden />
    </GlCard>
  );
}

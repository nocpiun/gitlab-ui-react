import type { ComponentType } from "react";
import { GlButton, GlCard, GlCardContent, GlCardHeader, GlLink } from "gitlab-ui-react";
import { createHighlighter } from "shiki";

type ExampleModule = {
  default: ComponentType;
};

export type DocsExampleProps = {
  filename: string;
  title: string;
  storybookId?: string;
};

const exampleModules = import.meta.glob<ExampleModule>("@examples/*.tsx", {
  eager: true,
});
const exampleSources = import.meta.glob<string>("@examples/*.tsx", {
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
    sourceHighlighter.codeToHtml(source, { lang: "tsx", themes: sourceCodeThemes }),
  ]),
);

export function DocsExample({ filename, title, storybookId }: DocsExampleProps) {
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
        <div className="flex items-center gap-3">
          {storybookId && (
            <GlLink
              showExternalIcon
              href={"https://glui-story.nocp.space/?path=/story/"+ storybookId}
              target="_blank">
              Storybook
            </GlLink>
          )}
          <GlButton
            aria-pressed="false"
            category="tertiary"
            data-docs-example-toggle
            size="small"
            icon="code"/>
        </div>
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

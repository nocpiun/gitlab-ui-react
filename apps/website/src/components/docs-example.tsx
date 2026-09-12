import { type ComponentType, useId } from "react";
import { GlButton } from "gitlab-ui-react/button";
import { GlCard, GlCardContent, GlCardHeader } from "gitlab-ui-react/card";
import { GlLink } from "gitlab-ui-react/link";
import { createHighlighter } from "shiki";
import { formatTemplate, type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

type ExampleModule = {
  default: ComponentType;
};

export type DocsExampleProps = {
  filename: string;
  locale: Locale;
  title: string;
  storybookId?: string;
};

const exampleModules = import.meta.glob<ExampleModule>("@examples/**/*.tsx", {
  eager: true,
});
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

const examplesByPath = new Map(
  Object.entries(exampleModules).map(([path, module]) => [
    relativeExamplePath(path),
    module.default,
  ]),
);
const highlightedSourcesByPath = new Map(
  Object.entries(exampleSources).map(([path, source]) => [
    relativeExamplePath(path),
    sourceHighlighter.codeToHtml(source, { lang: "tsx", themes: sourceCodeThemes }),
  ]),
);

export function DocsExample({ filename, locale, title, storybookId }: DocsExampleProps) {
  const sourceId = useId();
  const messages = siteMessages[locale].docs.example;
  const hideSourceLabel = formatTemplate(messages.hideSource, { title });
  const showSourceLabel = formatTemplate(messages.showSource, { title });
  const Example = examplesByPath.get(filename);
  const highlightedSource = highlightedSourcesByPath.get(filename);

  if(!Example || highlightedSource === undefined) {
    const availableExamples = [...examplesByPath.keys()].sort().join(", ");
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
              aria-label={messages.storybookLinkLabel}
              showExternalIcon
              href={"https://glui-story.nocp.space/?path=/story/"+ storybookId}
              target="_blank">
              Storybook
            </GlLink>
          )}
          <GlButton
            aria-controls={sourceId}
            aria-label={showSourceLabel}
            aria-pressed="false"
            category="tertiary"
            data-docs-example-toggle
            data-docs-example-hide-label={hideSourceLabel}
            data-docs-example-show-label={showSourceLabel}
            data-docs-example-title={title}
            size="small"
            icon="code"/>
        </div>
      </GlCardHeader>
      <GlCardContent data-docs-example-component data-pagefind-ignore="index">
        <Example />
      </GlCardContent>
      <div
        id={sourceId}
        className="docs-example-source mt-3"
        data-docs-example-source
        dangerouslySetInnerHTML={{ __html: highlightedSource }}
        hidden />
    </GlCard>
  );
}

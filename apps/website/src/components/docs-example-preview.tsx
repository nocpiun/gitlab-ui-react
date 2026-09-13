import { type ComponentType } from "react";

type ExampleModule = {
  default: ComponentType;
};

export type DocsExamplePreviewProps = {
  filename: string;
};

const exampleModules = import.meta.glob<ExampleModule>("@examples/**/*.tsx", {
  eager: true,
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

export function DocsExamplePreview({ filename }: DocsExamplePreviewProps) {
  const Example = examplesByPath.get(filename);

  if(!Example) {
    const availableExamples = [...examplesByPath.keys()].sort().join(", ");
    throw new Error(
      `[DocsExample] Unknown example file "${filename}". Available files: ${availableExamples}`,
    );
  }

  return <Example />;
}

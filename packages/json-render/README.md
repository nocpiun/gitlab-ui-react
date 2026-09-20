# @gitlab-ui-react/json-render

GitLab UI React components prepared for [`json-render`](https://github.com/vercel-labs/json-render). The package exposes model-friendly Zod definitions and the matching React component functions.

This package is a GitLab UI integration. Its JSON contracts follow GitLab component semantics and do not reproduce the shadcn preset's component API, implementation, layout primitives, or Tailwind classes.

## Installation

```sh
pnpm add @gitlab-ui-react/json-render gitlab-ui-react @gitlab-ui-react/styles \
  @json-render/core @json-render/react react react-dom zod
```

Import the GitLab UI stylesheet once in the application entry point. The preset deliberately does not import CSS as a side effect.

```ts
import "@gitlab-ui-react/styles";
```

## Catalog and registry

```tsx
import { defineCatalog } from "@json-render/core";
import {
  JSONUIProvider,
  Renderer,
  defineRegistry,
} from "@json-render/react";
import { schema } from "@json-render/react/schema";
import {
  gitlabComponents,
  gitlabComponentDefinitions,
} from "@gitlab-ui-react/json-render";
import "@gitlab-ui-react/styles";

const catalog = defineCatalog(schema, {
  components: gitlabComponentDefinitions,
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  components: gitlabComponents,
});

const spec = {
  root: "save",
  elements: {
    save: {
      type: "GlButton",
      props: {
        label: "Save changes",
        category: "primary",
        variant: "confirm",
      },
      children: [],
    },
  },
};

export function GeneratedUI() {
  return (
    <JSONUIProvider registry={registry}>
      <Renderer registry={registry} spec={spec} />
    </JSONUIProvider>
  );
}
```

For server-only catalog and prompt generation, use the dedicated entry. It imports only Zod and does not load React or GitLab UI:

```ts
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { gitlabComponentDefinitions } from "@gitlab-ui-react/json-render/catalog";

export const catalog = defineCatalog(schema, {
  components: gitlabComponentDefinitions,
  actions: {},
});
```

## Included components

- Containers and navigation: `GlCard`, `GlButtonGroup`, `GlAccordion`, `GlTabs`, `GlPagination`
- Display and feedback: `GlAlert`, `GlAttributeList`, `GlAvatar`, `GlBadge`, `GlLoadingIcon`, `GlMarkdown`, `GlProgressBar`, `GlSkeletonLoader`, `GlTable`
- Actions: `GlButton`, `GlLink`
- Forms: `GlForm`, `GlFormField`, `GlFormFieldGroup`, `GlFormFieldSet`, `GlFormInputGroup`, `GlFormInput`, `GlFormPasswordInput`, `GlFormTextarea`, `GlFormDate`, `GlFormSelect`, `GlFormRadioGroup`, `GlFormCheckbox`, `GlFormCheckboxGroup`, `GlToggle`

Form values, tab selection, and pagination support json-render `$bindState` and `$bindItem` expressions. Unbound controls retain interactive local state. Bound form fields can use json-render `checks` with `validateOn: "change" | "blur" | "submit"`; validation messages are connected to the control with stable ARIA IDs. Put submit-validated controls inside `GlForm`: it validates only its descendant fields, emits `submit` only when they pass, emits `invalid` otherwise, and focuses the first invalid control. `GlForm` intentionally omits navigation props such as `action`, `method`, and `target`; submit behavior belongs to json-render actions.

`GlMarkdown` applies GitLab's markdown typography but renders its `text` as ordinary React text. It does not parse model output as HTML. `GlLink` uses GitLab UI's safe protocol allowlist, and the catalog does not expose `isUnsafeLink`.

The catalog intentionally excludes arbitrary `className` and `style`, render callbacks, `dangerouslySetInnerHTML`, and other non-JSON or unsafe escape hatches.

## Public API

- `@gitlab-ui-react/json-render`: `gitlabComponents` plus all catalog exports
- `@gitlab-ui-react/json-render/catalog`: `gitlabComponentDefinitions`, `GitLabComponentName`, `GitLabProps<K>`, and `GitLabComponentDefinition`

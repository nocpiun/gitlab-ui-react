import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { describe, expect, it } from "vitest";
import { gitlabComponentDefinitions } from "./catalog";

const componentNames = [
  "GlAccordion",
  "GlAlert",
  "GlAttributeList",
  "GlAvatar",
  "GlBadge",
  "GlButton",
  "GlButtonGroup",
  "GlCard",
  "GlFormCheckbox",
  "GlFormDate",
  "GlFormInput",
  "GlFormRadioGroup",
  "GlFormSelect",
  "GlFormTextarea",
  "GlLink",
  "GlLoadingIcon",
  "GlMarkdown",
  "GlPagination",
  "GlProgressBar",
  "GlSkeletonLoader",
  "GlTable",
  "GlTabs",
  "GlToggle",
] as const;

describe("gitlabComponentDefinitions", () => {
  it("contains exactly the 23 supported GitLab UI components", () => {
    expect(Object.keys(gitlabComponentDefinitions).sort()).toEqual(componentNames);
  });

  it("accepts valid props and rejects unsafe or invalid props", () => {
    expect(gitlabComponentDefinitions.GlButton.props.safeParse({ label: "Save" }).success)
      .toBe(true);
    expect(gitlabComponentDefinitions.GlButton.props.safeParse({
      className: "model-css-escape-hatch",
      label: "Save",
    }).data).not.toHaveProperty("className");
    expect(gitlabComponentDefinitions.GlButton.props.safeParse({}).success).toBe(false);
    expect(gitlabComponentDefinitions.GlLink.props.safeParse({
      href: "/project",
      isUnsafeLink: true,
      label: "Project",
    }).data).not.toHaveProperty("isUnsafeLink");
    expect(gitlabComponentDefinitions.GlAvatar.props.safeParse({
      entityName: "Jane",
      size: 40,
    }).success).toBe(false);
  });

  it("keeps optional JSON fields optional instead of requiring null", () => {
    const parsed = gitlabComponentDefinitions.GlAlert.props.safeParse({});

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({});
  });

  it("publishes slot and event metadata", () => {
    expect(gitlabComponentDefinitions.GlCard.slots).toEqual(["default", "header", "footer"]);
    expect(gitlabComponentDefinitions.GlAlert.slots).toEqual(["default", "actions"]);
    expect(gitlabComponentDefinitions.GlTabs.events).toEqual(["change"]);
    expect(gitlabComponentDefinitions.GlPagination.events)
      .toEqual(["change", "previous", "next"]);
    expect(gitlabComponentDefinitions.GlFormInput.events)
      .toEqual(["change", "focus", "blur", "submit"]);
  });

  it("can be passed directly to defineCatalog for React specs", () => {
    const catalog = defineCatalog(schema, {
      actions: {},
      components: gitlabComponentDefinitions,
    });
    const result = catalog.validate({
      elements: {
        save: {
          children: [],
          props: { label: "Save", variant: "confirm" },
          type: "GlButton",
        },
      },
      root: "save",
    });

    expect(catalog.componentNames.sort()).toEqual(componentNames);
    expect(result.success).toBe(true);
  });
});

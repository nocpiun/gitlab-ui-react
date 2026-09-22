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
  "GlForm",
  "GlFormCheckbox",
  "GlFormCheckboxGroup",
  "GlFormDate",
  "GlFormField",
  "GlFormFieldGroup",
  "GlFormFieldSet",
  "GlFormInput",
  "GlFormInputGroup",
  "GlFormPasswordInput",
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
  it("contains exactly the 30 supported GitLab UI components", () => {
    expect(Object.keys(gitlabComponentDefinitions).sort()).toEqual(componentNames);
  });

  it("accepts valid props and rejects unsafe or invalid props", () => {
    expect(gitlabComponentDefinitions.GlButton.props.safeParse({ label: "Save" }).success)
      .toBe(true);
    expect(gitlabComponentDefinitions.GlButton.props.safeParse({
      label: "Save",
      type: "submit",
    }).success).toBe(true);
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
    expect(gitlabComponentDefinitions.GlForm.props.safeParse({
      action: "https://example.com/collect",
      method: "post",
      target: "_blank",
    }).data).toEqual({});
    for(const component of ["GlButtonGroup", "GlFormInputGroup"] as const) {
      expect(gitlabComponentDefinitions[component].props.safeParse({}).success).toBe(false);
      expect(gitlabComponentDefinitions[component].props.safeParse({ label: "  " }).success)
        .toBe(false);
      expect(gitlabComponentDefinitions[component].props.safeParse({ label: "Actions" }).success)
        .toBe(true);
    }
  });

  it("keeps optional JSON fields optional instead of requiring null", () => {
    const parsed = gitlabComponentDefinitions.GlAlert.props.safeParse({});

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({});
  });

  it("constrains progress values to zero through the declared or default maximum", () => {
    const progressProps = gitlabComponentDefinitions.GlProgressBar.props;

    for(const props of [{ value: 0 }, { value: 100 }, { value: 40, max: 40 }]) {
      expect(progressProps.safeParse(props).success).toBe(true);
    }
    for(const props of [
      { value: -1 },
      { value: 101 },
      { value: 41, max: 40 },
      { value: 0, max: 0 },
      { value: Number.POSITIVE_INFINITY },
      { value: 0, max: Number.POSITIVE_INFINITY },
    ]) {
      expect(progressProps.safeParse(props).success).toBe(false);
    }
  });

  it("publishes slot and event metadata", () => {
    expect(gitlabComponentDefinitions.GlCard.slots).toEqual(["default", "header", "footer"]);
    expect(gitlabComponentDefinitions.GlAlert.slots).toEqual(["default", "actions"]);
    expect(gitlabComponentDefinitions.GlTabs.events).toEqual(["change"]);
    expect(gitlabComponentDefinitions.GlPagination.events)
      .toEqual(["change", "previous", "next"]);
    expect(gitlabComponentDefinitions.GlFormInput.events)
      .toEqual(["change", "focus", "blur", "submit"]);
    expect(gitlabComponentDefinitions.GlForm.slots).toEqual(["default", "actions"]);
    expect(gitlabComponentDefinitions.GlForm.events).toEqual(["submit", "invalid", "reset"]);
    expect(gitlabComponentDefinitions.GlFormInputGroup.slots)
      .toEqual(["default", "prepend", "append"]);
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

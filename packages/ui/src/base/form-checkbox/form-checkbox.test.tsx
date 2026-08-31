import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormCheckbox from "./form-checkbox";

const renderCheckbox = (props: ComponentProps<typeof GlFormCheckbox> = {}) => renderToStaticMarkup(
  <GlFormCheckbox {...props}>foobar</GlFormCheckbox>,
);

describe("GlFormCheckbox", () => {
  describe("rendering defaults", () => {
    it("has the structure <div><input><label></label></div>", () => {
      const markup = renderCheckbox({ checked: "", value: "a" });

      expect(markup).toMatch(/^<div[^>]*><input[^>]*><label[^>]*>foobar<\/label><\/div>$/);
    });

    it("has the wrapper classes gl-form-checkbox, custom-checkbox and custom-control", () => {
      expect(renderCheckbox()).toMatch(/^<div class="gl-form-checkbox custom-checkbox custom-control"/);
    });

    it("merges a consumer className onto the wrapper", () => {
      expect(renderCheckbox({ className: "custom-class" }))
        .toMatch(/^<div class="gl-form-checkbox custom-checkbox custom-control custom-class"/);
    });

    it("renders an input of type checkbox with the custom-control-input class", () => {
      const markup = renderCheckbox();

      expect(markup).toMatch(/<input[^>]*type="checkbox"/);
      expect(markup).toMatch(/<input[^>]*class="custom-control-input"/);
    });

    it("renders the label with the custom-control-label class and the default slot content", () => {
      expect(renderCheckbox()).toMatch(/<label class="custom-control-label"[^>]*>foobar<\/label>/);
    });

    it("links the label to the input via for/id", () => {
      const markup = renderCheckbox({ id: "foo" });

      expect(markup).toMatch(/<input[^>]*id="foo"/);
      expect(markup).toContain("for=\"foo\"");
    });

    it("falls back to a generated gitlab_ui_checkbox_ id when none is provided", () => {
      expect(renderCheckbox()).toMatch(/id="gitlab_ui_checkbox_[^"]+"/);
    });

    it.each(["", undefined])("falls back to a generated id when the provided one is %s", (id) => {
      expect(renderCheckbox({ id })).toMatch(/id="gitlab_ui_checkbox_[^"]+"/);
    });

    it("transfers custom attributes to the input element", () => {
      expect(renderCheckbox({ "data-foo": "bar" })).toMatch(/<input[^>]*data-foo="bar"/);
    });
  });

  describe("checked state", () => {
    it("can start checked when checked matches value", () => {
      expect(renderCheckbox({ checked: "checked_value", value: "checked_value", name: "foo" }))
        .toMatch(/<input[^>]*checked=""/);
    });

    it("is unchecked when checked does not match value", () => {
      expect(renderCheckbox({ checked: "", value: "a" })).not.toContain("checked");
    });

    it("is checked when the value is in the checked array", () => {
      expect(renderCheckbox({ checked: ["foo", "bar"], value: "bar" }))
        .toMatch(/<input[^>]*checked=""/);
    });

    it("is unchecked when the value is not in the checked array", () => {
      expect(renderCheckbox({ checked: ["foo"], value: "bar" })).not.toContain("checked");
    });
  });

  describe("accessibility attributes", () => {
    it("has no aria-label on the input by default", () => {
      expect(renderCheckbox()).not.toContain("aria-label");
    });

    it("sets aria-label on the input when ariaLabel is provided", () => {
      expect(renderCheckbox({ ariaLabel: "bar" })).toContain("aria-label=\"bar\"");
    });

    it("sets aria-labelledby on the input when ariaLabelledby is provided", () => {
      expect(renderCheckbox({ ariaLabelledby: "label-id" })).toContain("aria-labelledby=\"label-id\"");
    });

    it("has no aria-required by default", () => {
      expect(renderCheckbox({ required: true })).not.toContain("aria-required");
    });

    it("sets aria-required when required and a name is provided", () => {
      expect(renderCheckbox({ required: true, name: "test" })).toContain("aria-required=\"true\"");
    });
  });

  describe("disabled", () => {
    it("has no disabled attribute by default", () => {
      expect(renderCheckbox()).not.toContain("disabled");
    });

    it("has the disabled attribute when disabled is set", () => {
      expect(renderCheckbox({ disabled: true })).toMatch(/<input[^>]*disabled=""/);
    });
  });

  describe("required", () => {
    it("has no required attribute by default", () => {
      expect(renderCheckbox()).not.toContain("required");
    });

    it("has no required attribute when required is set without a name", () => {
      expect(renderCheckbox({ required: true })).not.toContain("required");
    });

    it("has the required attribute when required and name are set", () => {
      expect(renderCheckbox({ required: true, name: "test" })).toMatch(/<input[^>]*required=""/);
    });
  });

  describe("name", () => {
    it("has no name attribute by default", () => {
      expect(renderCheckbox()).not.toContain("name=");
    });

    it("has the name attribute when name is set", () => {
      expect(renderCheckbox({ name: "test" })).toContain("name=\"test\"");
    });
  });

  describe("validation state", () => {
    it("has no validation classes by default", () => {
      const markup = renderCheckbox();

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("has no validation classes when state=null", () => {
      const markup = renderCheckbox({ state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });

    it("has the is-valid class when state=true", () => {
      const markup = renderCheckbox({ state: true });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });

    it("has the is-invalid class and aria-invalid when state=false", () => {
      const markup = renderCheckbox({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });
  });

  describe("help text", () => {
    it("renders no help text by default", () => {
      expect(renderCheckbox()).not.toContain("help-text");
    });

    it("renders the help text inside the label", () => {
      const markup = renderCheckbox({ help: "With help text." });

      expect(markup).toContain("<p class=\"help-text\">With help text.</p>");
    });
  });
});

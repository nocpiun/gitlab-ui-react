import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormSelect, { type GlFormSelectWidth } from "./form-select";

const defaultOptions = [
  { value: "Pizza", text: "Pizza" },
  { value: "Tacos", text: "Tacos" },
  { value: "Burger", text: "Burger" },
];

const renderSelect = (props: ComponentProps<typeof GlFormSelect> = {}) => renderToStaticMarkup(
  <GlFormSelect {...props} />,
);

describe("GlFormSelect", () => {
  describe("rendering defaults", () => {
    it("renders a select inside the gl-form-select-wrapper span", () => {
      expect(renderSelect()).toMatch(/^<span class="gl-form-select-wrapper"><select[^>]*>/);
    });

    it("has the gl-form-select and custom-select classes on the select", () => {
      expect(renderSelect()).toMatch(/<select[^>]*class="[^"]*gl-form-select[^"]*custom-select[^"]*"/);
    });

    it("has no state classes or aria-invalid by default", () => {
      const markup = renderSelect();

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("generates a gl-form-select- id when no id is provided", () => {
      expect(renderSelect()).toMatch(/id="gl-form-select-[^"]+"/);
    });

    it("honors a user-supplied id", () => {
      expect(renderSelect({ id: "foobar" })).toContain("id=\"foobar\"");
    });

    it("transfers custom attributes to the select element", () => {
      const props = { id: "custom-attribute", "data-foo": "bar" };
      const markup = renderSelect(props);

      expect(markup).toMatch(/<select[^>]*data-foo="bar"/);
      expect(markup).not.toMatch(/<span[^>]*data-foo/);
    });

    it("merges a consumer className onto the select element", () => {
      expect(renderSelect({ className: "custom-class" }))
        .toMatch(/<select[^>]*class="[^"]*custom-class[^"]*"/);
    });
  });

  describe("state prop", () => {
    it("adds is-valid for state=true", () => {
      expect(renderSelect({ state: true })).toContain("is-valid");
    });

    it("adds is-invalid and aria-invalid for state=false", () => {
      const markup = renderSelect({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });

    it("adds no state class for state=null or undefined", () => {
      expect(renderSelect({ state: null })).not.toMatch(/is-(in)?valid/);
      expect(renderSelect()).not.toMatch(/is-(in)?valid/);
    });

    it.each([true, "true", ""] as const)("has aria-invalid=true when ariaInvalid is %s", (ariaInvalid) => {
      expect(renderSelect({ ariaInvalid })).toContain("aria-invalid=\"true\"");
    });

    it("passes through a custom aria-invalid string", () => {
      expect(renderSelect({ ariaInvalid: "grammar" })).toContain("aria-invalid=\"grammar\"");
    });
  });

  describe("width prop", () => {
    const widths: GlFormSelectWidth[] = ["xs", "sm", "md", "lg", "xl"];

    it.each(widths)("adds the width class for width %s", (width) => {
      expect(renderSelect({ width })).toMatch(new RegExp(`^<span class="[^"]*gl-form-select-${width}[^"]*"`));
    });

    it("does not add a width class without the width prop or when null", () => {
      expect(renderSelect()).not.toMatch(/gl-form-select-(xs|sm|md|lg|xl)/);
      expect(renderSelect({ width: null })).not.toMatch(/gl-form-select-(xs|sm|md|lg|xl)/);
    });

    it("adds responsive classes including the default key", () => {
      const markup = renderSelect({ width: { default: "md", md: "lg", lg: "xl" } });

      expect(markup).toContain("gl-form-select-md");
      expect(markup).toContain("gl-md-form-select-lg");
      expect(markup).toContain("gl-lg-form-select-xl");
    });

    it("adds responsive classes without a default key", () => {
      const markup = renderSelect({ width: { md: "lg", lg: "xl" } });

      expect(markup).toMatch(/^<span class="gl-form-select-wrapper gl-md-form-select-lg gl-lg-form-select-xl"/);
    });
  });

  describe("selectClass prop", () => {
    it.each`
      type        | selectClassProp
      ${"String"} | ${"select-class"}
      ${"Array"}  | ${["select-class"]}
      ${"Object"} | ${{ "select-class": true, "another-class": false }}
    `("adds class for select using $type", ({ selectClassProp }) => {
      const markup = renderSelect({ selectClass: selectClassProp });

      expect(markup).toMatch(/<select[^>]*class="[^"]*select-class[^"]*"/);
      expect(markup).not.toContain("another-class");
    });

    it("does not add a select class if not given the prop or when null", () => {
      expect(renderSelect()).not.toContain("select-class");
      expect(renderSelect({ selectClass: null })).not.toContain("select-class");
    });
  });

  describe("options", () => {
    it("renders options from primitives", () => {
      const markup = renderSelect({ options: ["one", 2] });

      expect(markup).toContain("<option value=\"one\">one</option>");
      expect(markup).toContain("<option value=\"2\">2</option>");
    });

    it("renders options from objects with value and text", () => {
      const markup = renderSelect({ options: defaultOptions });

      expect(markup).toContain("<option value=\"Tacos\">Tacos</option>");
    });

    it("defaults the option value to its text", () => {
      expect(renderSelect({ options: [{ text: "Pizza" }] }))
        .toContain("<option value=\"Pizza\">Pizza</option>");
    });

    it("renders a disabled option", () => {
      expect(renderSelect({ options: [{ value: "Tacos", text: "Tacos", disabled: true }] }))
        .toContain("<option disabled=\"\" value=\"Tacos\">Tacos</option>");
    });

    it("renders option html instead of text, unsanitized like upstream", () => {
      const markup = renderSelect({
        options: [{ value: "html", text: "fallback", html: "<strong>HTML</strong> option" }],
      });

      expect(markup).toContain("<option value=\"html\"><strong>HTML</strong> option</option>");
      expect(markup).not.toContain("fallback");
    });

    it("renders option groups as optgroup elements", () => {
      const markup = renderSelect({
        options: [
          { label: "Food", options: [{ value: "Pizza", text: "Pizza" }] },
          { value: "Other", text: "Other" },
        ],
      });

      expect(markup).toContain("<optgroup label=\"Food\"><option value=\"Pizza\">Pizza</option></optgroup>");
      expect(markup).toContain("<option value=\"Other\">Other</option>");
    });
  });

  describe("value", () => {
    it("marks the option matching the value as selected", () => {
      const markup = renderSelect({ options: defaultOptions, value: "Tacos" });

      expect(markup).toContain("<option value=\"Tacos\" selected=\"\">Tacos</option>");
    });

    it("matches a numeric option value loosely", () => {
      const markup = renderSelect({
        options: [{ value: 1, text: "One" }, { value: 2, text: "Two" }],
        value: 2,
      });

      expect(markup).toContain("<option value=\"2\" selected=\"\">Two</option>");
    });

    it("selects nothing when no option matches the value", () => {
      expect(renderSelect({ options: defaultOptions, value: "Sushi" })).not.toContain("selected");
    });
  });

  describe("multiple and selectSize", () => {
    it("does not render multiple or size attributes by default", () => {
      const markup = renderSelect({ options: defaultOptions });

      expect(markup).not.toContain("multiple");
      expect(markup).not.toContain("size=");
    });

    it("renders the multiple attribute and marks all matching options selected", () => {
      const markup = renderSelect({ multiple: true, options: defaultOptions, value: ["Pizza", "Burger"] });

      expect(markup).toContain("multiple=\"\"");
      expect(markup).toContain("<option value=\"Pizza\" selected=\"\">Pizza</option>");
      expect(markup).toContain("<option value=\"Burger\" selected=\"\">Burger</option>");
      expect(markup).not.toContain("<option value=\"Tacos\" selected=\"\">Tacos</option>");
    });

    it("renders the size attribute from selectSize", () => {
      expect(renderSelect({ selectSize: 3 })).toContain("size=\"3\"");
    });
  });

  describe("form attributes", () => {
    it("renders disabled, required, name, and form attributes", () => {
      const markup = renderSelect({ disabled: true, required: true, name: "food", form: "form-id" });

      expect(markup).toContain("disabled=\"\"");
      expect(markup).toContain("required=\"\"");
      expect(markup).toContain("aria-required=\"true\"");
      expect(markup).toContain("name=\"food\"");
      expect(markup).toContain("form=\"form-id\"");
    });

    it("does not render aria-required when not required", () => {
      expect(renderSelect()).not.toContain("aria-required");
    });
  });

  describe("slots", () => {
    it("renders first before and children after the generated options", () => {
      const markup = renderSelect({
        options: [{ value: "Pizza", text: "Pizza" }],
        first: <option value="">Pick one</option>,
        children: <option value="Last">Last</option>,
      });

      expect(markup).toMatch(
        /<option value="">Pick one<\/option><option value="Pizza">Pizza<\/option><option value="Last">Last<\/option>/,
      );
    });
  });
});

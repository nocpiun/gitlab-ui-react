import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlFormSelect, { type GlFormSelectWidth } from "./form-select";

const OPTIONS = [
  { value: "Pizza", text: "Pizza" },
  { value: "Tacos", text: "Tacos" },
  { value: "Burger", text: "Burger" },
];

const renderSelect = (props: ComponentProps<typeof GlFormSelect> = {}) => renderToStaticMarkup(
  <GlFormSelect {...props} />,
);

describe("GlFormSelect", () => {
  describe("rendering defaults", () => {
    it("renders a select with the gl-form-select and custom-select classes in a wrapper", () => {
      const markup = renderSelect();

      expect(markup).toMatch(
        /^<span class="gl-form-select-wrapper"><select class="gl-form-select custom-select"/,
      );
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

    it("merges a consumer className onto the wrapper", () => {
      expect(renderSelect({ className: "custom-class" }))
        .toMatch(/^<span class="gl-form-select-wrapper custom-class"/);
    });
  });

  describe("selectClass prop", () => {
    it("merges selectClass onto the select element", () => {
      expect(renderSelect({ selectClass: "select-class" }))
        .toMatch(/<select class="gl-form-select custom-select select-class"/);
    });
  });

  describe("state prop", () => {
    it("adds is-valid when state is true", () => {
      const markup = renderSelect({ state: true });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("adds is-invalid and aria-invalid when state is false", () => {
      const markup = renderSelect({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });

    it("ignores non-boolean state values", () => {
      const markup = renderSelect({ state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });
  });

  describe("ariaInvalid", () => {
    it("renders aria-invalid for true and 'true'", () => {
      expect(renderSelect({ ariaInvalid: true })).toContain("aria-invalid=\"true\"");
      expect(renderSelect({ ariaInvalid: "true" })).toContain("aria-invalid=\"true\"");
    });

    it("passes through non-boolean values like 'spelling'", () => {
      expect(renderSelect({ ariaInvalid: "spelling" })).toContain("aria-invalid=\"spelling\"");
    });
  });

  describe("width prop", () => {
    const widths: GlFormSelectWidth[] = ["xs", "sm", "md", "lg", "xl"];

    it.each(widths)("adds the width class for width %s", (width) => {
      expect(renderSelect({ width }))
        .toMatch(new RegExp(`^<span class="gl-form-select-wrapper gl-form-select-${width}"`));
    });

    it("does not add a width class without the width prop or when null", () => {
      expect(renderSelect()).toMatch(/^<span class="gl-form-select-wrapper"/);
      expect(renderSelect({ width: null })).toMatch(/^<span class="gl-form-select-wrapper"/);
    });

    it("adds responsive classes including the default key", () => {
      const markup = renderSelect({ width: { default: "md", md: "lg", lg: "xl" } });

      expect(markup).toContain("gl-form-select-md");
      expect(markup).toContain("gl-md-form-select-lg");
      expect(markup).toContain("gl-lg-form-select-xl");
    });

    it("adds responsive classes without a default key", () => {
      const markup = renderSelect({ width: { md: "lg", lg: "xl" } });

      expect(markup).not.toMatch(/class="[^"]*gl-form-select-(xs|sm|md|lg|xl)/);
      expect(markup).toContain("gl-md-form-select-lg");
      expect(markup).toContain("gl-lg-form-select-xl");
    });
  });

  describe("attributes", () => {
    it("is disabled when disabled", () => {
      expect(renderSelect({ disabled: true })).toContain("disabled");
      expect(renderSelect()).not.toContain("disabled");
    });

    it("sets required and aria-required", () => {
      const markup = renderSelect({ required: true });

      expect(markup).toContain("required");
      expect(markup).toContain("aria-required=\"true\"");
      expect(renderSelect()).not.toContain("aria-required");
    });

    it("sets form and name", () => {
      const markup = renderSelect({ form: "my-form", name: "my-select" });

      expect(markup).toContain("form=\"my-form\"");
      expect(markup).toContain("name=\"my-select\"");
    });

    it("sets multiple", () => {
      expect(renderSelect({ multiple: true })).toContain("multiple");
      expect(renderSelect()).not.toContain("multiple");
    });
  });

  describe("selectSize", () => {
    it("renders no size attribute for a custom select with selectSize 0", () => {
      expect(renderSelect()).not.toContain("size=");
    });

    it("renders the size attribute when selectSize is set", () => {
      expect(renderSelect({ selectSize: 3 })).toContain("size=\"3\"");
    });

    it("renders the size attribute for a plain select when set", () => {
      // React omits a `size` of 0; browsers would ignore the invalid value anyway.
      expect(renderSelect({ plain: true, selectSize: 2 })).toContain("size=\"2\"");
    });
  });

  describe("size prop", () => {
    it("adds the custom-select-{size} class", () => {
      const markup = renderSelect({ size: "sm" });

      expect(markup).toContain("custom-select-sm");
      expect(markup).not.toContain("form-control");
    });

    it("adds the form-control-{size} class when plain", () => {
      const markup = renderSelect({ plain: true, size: "lg" });

      expect(markup).toContain("form-control");
      expect(markup).toContain("form-control-lg");
      expect(markup).not.toContain("custom-select");
    });
  });

  describe("options", () => {
    it("renders options with encoded positional values", () => {
      const markup = renderSelect({ options: OPTIONS });

      expect(markup).toContain("<option value=\"0\">Pizza</option>");
      expect(markup).toContain("<option value=\"1\">Tacos</option>");
      expect(markup).toContain("<option value=\"2\">Burger</option>");
    });

    it("renders plain values as value and text", () => {
      const markup = renderSelect({ options: ["Pizza", 42] });

      expect(markup).toContain("<option value=\"0\">Pizza</option>");
      expect(markup).toContain("<option value=\"1\">42</option>");
    });

    it("renders a disabled option", () => {
      const markup = renderSelect({ options: [{ value: "a", text: "A", disabled: true }] });

      expect(markup).toContain("<option disabled=\"\" value=\"0\">A</option>");
    });

    it("renders the html field as raw HTML instead of the text", () => {
      const markup = renderSelect({
        options: [{ value: "a", text: "A", html: "<strong>Bold</strong>" }],
      });

      expect(markup).toContain("<option value=\"0\"><strong>Bold</strong></option>");
    });

    it("supports custom field names", () => {
      const markup = renderSelect({
        options: [{ val: "a", labelText: "A", inactive: true }],
        disabledField: "inactive",
        textField: "labelText",
        valueField: "val",
      });

      expect(markup).toContain("<option disabled=\"\" value=\"0\">A</option>");
    });

    it("renders option groups with stripped text", () => {
      const markup = renderSelect({
        options: [{
          label: "Meals",
          options: [{ value: "a", text: "<em>A</em>" }],
        }],
      });

      expect(markup).toContain("<optgroup label=\"Meals\">");
      expect(markup).toContain("<option value=\"0\">A</option>");
    });

    it("supports the deprecated object format with a warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const markup = renderSelect({ options: { keyPizza: { text: "Pizza" } } });

      expect(markup).toContain("<option value=\"0\">Pizza</option>");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("deprecated"));
      warn.mockRestore();
    });
  });

  describe("value", () => {
    it("selects the option matching the value", () => {
      const markup = renderSelect({ options: OPTIONS, value: "Tacos" });

      expect(markup).toContain("<option value=\"1\" selected=\"\">Tacos</option>");
    });

    it("matches non-string option values", () => {
      const markup = renderSelect({
        options: [{ value: 1, text: "One" }, { value: 2, text: "Two" }],
        value: 2,
      });

      expect(markup).toContain("<option value=\"1\" selected=\"\">Two</option>");
    });

    it("selects nothing when the value matches no option", () => {
      const markup = renderSelect({ options: OPTIONS, value: "Salad" });

      expect(markup).not.toContain("selected");
    });

    it("selects multiple options in multiple mode", () => {
      const markup = renderSelect({ multiple: true, options: OPTIONS, value: ["Pizza", "Burger"] });

      expect(markup).toContain("<option value=\"0\" selected=\"\">Pizza</option>");
      expect(markup).toContain("<option value=\"2\" selected=\"\">Burger</option>");
      expect(markup).not.toContain("<option value=\"1\" selected=\"\">Tacos</option>");
    });
  });

  describe("slots", () => {
    it("renders the first prop before the generated options", () => {
      const markup = renderSelect({ first: <option value="">Choose</option>, options: OPTIONS });
      const firstIndex = markup.indexOf(">Choose</option>");
      const optionIndex = markup.indexOf(">Pizza</option>");

      expect(firstIndex).toBeGreaterThan(-1);
      expect(optionIndex).toBeGreaterThan(firstIndex);
    });

    it("renders children after the generated options", () => {
      const markup = renderSelect({ children: <option value="x">Extra</option>, options: OPTIONS });
      const optionIndex = markup.indexOf(">Burger</option>");
      const childIndex = markup.indexOf(">Extra</option>");

      expect(optionIndex).toBeGreaterThan(-1);
      expect(childIndex).toBeGreaterThan(optionIndex);
    });
  });
});

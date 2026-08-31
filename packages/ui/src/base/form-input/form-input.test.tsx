import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormInput, { type GlFormInputWidth } from "./form-input";

const renderInput = (props: ComponentProps<typeof GlFormInput> = {}) => renderToStaticMarkup(
  <GlFormInput {...props} />,
);

describe("GlFormInput", () => {
  describe("rendering defaults", () => {
    it("renders a text input with the gl-form-input and form-control classes", () => {
      const markup = renderInput();

      expect(markup).toMatch(/<input[^>]*type="text"/);
      expect(markup).toMatch(/class="[^"]*gl-form-input[^"]*form-control[^"]*"/);
      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("generates a gl-form-input- id when no id is provided", () => {
      expect(renderInput()).toMatch(/id="gl-form-input-[^"]+"/);
    });

    it("honors a user-supplied id", () => {
      expect(renderInput({ id: "foobar" })).toContain("id=\"foobar\"");
    });

    it("renders the value", () => {
      expect(renderInput({ value: "some text" })).toContain("value=\"some text\"");
      expect(renderInput({ value: 42 })).toContain("value=\"42\"");
    });

    it("merges a consumer className", () => {
      expect(renderInput({ className: "custom-class" }))
        .toMatch(/class="[^"]*gl-form-input[^"]*custom-class[^"]*"/);
    });
  });

  describe("type", () => {
    it("renders the given supported type", () => {
      expect(renderInput({ type: "number" })).toContain("type=\"number\"");
      expect(renderInput({ type: "email" })).toContain("type=\"email\"");
    });

    it("falls back to text for unsupported types", () => {
      const markup = renderInput({ type: "foobar" as ComponentProps<typeof GlFormInput>["type"] });

      expect(markup).toContain("type=\"text\"");
    });

    it("uses custom-range instead of form-control when type=range", () => {
      const markup = renderInput({ type: "range" });

      expect(markup).toContain("custom-range");
      expect(markup).not.toContain("form-control");
    });

    it("always uses form-control when type=color", () => {
      const markup = renderInput({ type: "color" });

      expect(markup).toContain("form-control");
      expect(markup).not.toContain("custom-range");
    });
  });

  describe("width prop", () => {
    const widths: GlFormInputWidth[] = ["xs", "sm", "md", "lg", "xl"];

    it.each(widths)("adds the width class for width %s", (width) => {
      expect(renderInput({ width })).toContain(`gl-form-input-${width}`);
    });

    it("does not add a width class without the width prop or when null", () => {
      expect(renderInput()).not.toMatch(/gl-form-input-(xs|sm|md|lg|xl)/);
      expect(renderInput({ width: null })).not.toMatch(/gl-form-input-(xs|sm|md|lg|xl)/);
    });

    it("adds responsive classes including the default key", () => {
      const markup = renderInput({ width: { default: "md", md: "lg", lg: "xl" } });

      expect(markup).toContain("gl-form-input-md");
      expect(markup).toContain("gl-md-form-input-lg");
      expect(markup).toContain("gl-lg-form-input-xl");
    });

    it("adds responsive classes without a default key", () => {
      const markup = renderInput({ width: { md: "lg", lg: "xl" } });

      expect(markup).not.toMatch(/class="[^"]*gl-form-input-(xs|sm|md|lg|xl)/);
      expect(markup).toContain("gl-md-form-input-lg");
      expect(markup).toContain("gl-lg-form-input-xl");
    });
  });

  describe("plaintext", () => {
    it("renders form-control-plaintext and readonly when plaintext", () => {
      const markup = renderInput({ plaintext: true });

      expect(markup).toContain("form-control-plaintext");
      expect(markup).not.toMatch(/class="[^"]*form-control"/);
      expect(markup).toContain("readOnly");
    });

    it("ignores plaintext for type=range", () => {
      const markup = renderInput({ plaintext: true, type: "range" });

      expect(markup).toContain("custom-range");
      expect(markup).not.toContain("form-control-plaintext");
      expect(markup).toContain("readOnly");
    });

    it("ignores plaintext for type=color", () => {
      const markup = renderInput({ plaintext: true, type: "color" });

      expect(markup).toContain("form-control");
      expect(markup).not.toContain("form-control-plaintext");
    });
  });

  describe("state", () => {
    it("adds is-valid when state is true", () => {
      const markup = renderInput({ state: true });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("adds is-invalid and aria-invalid when state is false", () => {
      const markup = renderInput({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });

    it("ignores non-boolean state values", () => {
      const markup = renderInput({ state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });
  });

  describe("ariaInvalid", () => {
    it("renders aria-invalid for true and 'true'", () => {
      expect(renderInput({ ariaInvalid: true })).toContain("aria-invalid=\"true\"");
      expect(renderInput({ ariaInvalid: "true" })).toContain("aria-invalid=\"true\"");
    });

    it("passes through non-boolean values like 'spelling'", () => {
      expect(renderInput({ ariaInvalid: "spelling" })).toContain("aria-invalid=\"spelling\"");
    });

    it("lets state=false win over a false value", () => {
      expect(renderInput({ ariaInvalid: false, state: false })).toContain("aria-invalid=\"true\"");
    });
  });

  describe("attributes", () => {
    it("is disabled when disabled", () => {
      expect(renderInput({ disabled: true })).toContain("disabled");
      expect(renderInput()).not.toContain("disabled");
    });

    it("is readonly when readOnly", () => {
      expect(renderInput({ readOnly: true })).toContain("readOnly");
      expect(renderInput()).not.toContain("readOnly");
    });

    it("sets required and aria-required", () => {
      const markup = renderInput({ required: true });

      expect(markup).toContain("required");
      expect(markup).toContain("aria-required=\"true\"");
      expect(renderInput()).not.toContain("aria-required");
    });

    it("sets form, name, placeholder, and autocomplete", () => {
      const markup = renderInput({
        autoComplete: "email",
        form: "my-form",
        name: "my-input",
        placeholder: "Enter text",
      });

      expect(markup).toContain("form=\"my-form\"");
      expect(markup).toContain("name=\"my-input\"");
      expect(markup).toContain("placeholder=\"Enter text\"");
      expect(markup).toContain("autoComplete=\"email\"");
    });

    it("sets min, max, and step", () => {
      const markup = renderInput({ max: 10, min: 1, step: 0.5, type: "number" });

      expect(markup).toContain("min=\"1\"");
      expect(markup).toContain("max=\"10\"");
      expect(markup).toContain("step=\"0.5\"");
    });

    it("sets the list attribute except for type=password", () => {
      expect(renderInput({ list: "datalist-id" })).toContain("list=\"datalist-id\"");
      expect(renderInput({ list: "datalist-id", type: "password" })).not.toContain("list=");
      expect(renderInput()).not.toContain("list=");
    });
  });
});

import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormRadio from "./form-radio";

const renderRadio = (props: ComponentProps<typeof GlFormRadio> = {}) => renderToStaticMarkup(
  <GlFormRadio {...props}>foobar</GlFormRadio>,
);

describe("GlFormRadio", () => {
  describe("rendering defaults", () => {
    it("has the structure <div><input><label></label></div>", () => {
      const markup = renderRadio({ checked: "", value: "a" });

      expect(markup).toMatch(/^<div[^>]*><input[^>]*><label[^>]*>foobar<\/label><\/div>$/);
    });

    it("has the wrapper classes gl-form-radio, custom-radio and custom-control", () => {
      expect(renderRadio()).toMatch(/^<div class="gl-form-radio custom-radio custom-control"/);
    });

    it("merges a consumer className onto the wrapper", () => {
      expect(renderRadio({ className: "custom-class" }))
        .toMatch(/^<div class="gl-form-radio custom-radio custom-control custom-class"/);
    });

    it("renders an input of type radio with the custom-control-input class", () => {
      const markup = renderRadio();

      expect(markup).toMatch(/<input[^>]*type="radio"/);
      expect(markup).toMatch(/<input[^>]*class="custom-control-input"/);
    });

    it("renders the label with the custom-control-label class and the default slot content", () => {
      expect(renderRadio()).toMatch(/<label class="custom-control-label"[^>]*>foobar<\/label>/);
    });

    it("links the label to the input via for/id", () => {
      const markup = renderRadio({ id: "foo" });

      expect(markup).toMatch(/<input[^>]*id="foo"/);
      expect(markup).toContain("for=\"foo\"");
    });

    it("falls back to a generated gitlab_ui_radio_ id when none is provided", () => {
      expect(renderRadio()).toMatch(/id="gitlab_ui_radio_[^"]+"/);
    });

    it.each(["", undefined])("falls back to a generated id when the provided one is %s", (id) => {
      expect(renderRadio({ id })).toMatch(/id="gitlab_ui_radio_[^"]+"/);
    });

    it("transfers custom attributes to the input element", () => {
      expect(renderRadio({ "data-foo": "bar" })).toMatch(/<input[^>]*data-foo="bar"/);
    });
  });

  describe("checked state", () => {
    it("can start checked when checked matches value", () => {
      expect(renderRadio({ checked: "checked_value", value: "checked_value", name: "foo" }))
        .toMatch(/<input[^>]*checked=""/);
    });

    it("is unchecked when checked does not match value", () => {
      expect(renderRadio({ checked: "", value: "a" })).not.toContain("checked");
    });
  });

  describe("value", () => {
    // The `value` prop defaults to `true` so that checking a radio without an
    // explicit value sets the bound model to `true`, unlike the HTML default
    // of "on".
    it("has a default value of `true`", () => {
      expect(renderRadio()).toContain("value=\"true\"");
    });

    it("renders the provided value", () => {
      expect(renderRadio({ value: "a" })).toContain("value=\"a\"");
    });
  });

  describe("accessibility attributes", () => {
    it("has no aria-required by default", () => {
      expect(renderRadio({ required: true })).not.toContain("aria-required");
    });

    it("sets aria-required when required and a name is provided", () => {
      expect(renderRadio({ required: true, name: "test" })).toContain("aria-required=\"true\"");
    });
  });

  describe("disabled", () => {
    it("has no disabled attribute by default", () => {
      expect(renderRadio()).not.toContain("disabled");
    });

    it("has the disabled attribute when disabled is set", () => {
      expect(renderRadio({ disabled: true })).toMatch(/<input[^>]*disabled=""/);
    });
  });

  describe("required", () => {
    it("has no required attribute by default", () => {
      expect(renderRadio()).not.toContain("required");
    });

    it("has no required attribute when required is set without a name", () => {
      expect(renderRadio({ required: true })).not.toContain("required");
    });

    it("has the required attribute when required and name are set", () => {
      expect(renderRadio({ required: true, name: "test" })).toMatch(/<input[^>]*required=""/);
    });
  });

  describe("name", () => {
    it("has no name attribute by default", () => {
      expect(renderRadio()).not.toContain("name=");
    });

    it("has the name attribute when name is set", () => {
      expect(renderRadio({ name: "test" })).toContain("name=\"test\"");
    });
  });

  describe("validation state", () => {
    it("has no validation classes by default", () => {
      const markup = renderRadio();

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("has no validation classes when state=null", () => {
      const markup = renderRadio({ state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });

    it("has the is-valid class when state=true", () => {
      const markup = renderRadio({ state: true });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });

    it("has the is-invalid class and aria-invalid when state=false", () => {
      const markup = renderRadio({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });
  });

  describe("help text", () => {
    it("renders no help text by default", () => {
      expect(renderRadio()).not.toContain("help-text");
    });

    it("renders the help text inside the label", () => {
      const markup = renderRadio({ help: "With help text." });

      expect(markup).toContain("<p class=\"help-text\">With help text.</p>");
    });
  });
});

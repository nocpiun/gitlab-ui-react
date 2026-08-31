import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormTextarea from "./form-textarea";

const remainingCountText = (count: number) => (
  count === 1 ? `${count} character remaining.` : `${count} characters remaining.`
);
const overLimitText = (count: number) => (
  count === 1 ? `${count} character over limit.` : `${count} characters over limit.`
);

const renderTextarea = (props: ComponentProps<typeof GlFormTextarea> = {}) => renderToStaticMarkup(
  <GlFormTextarea {...props} />,
);

const renderTextareaWithCount = (
  props: ComponentProps<typeof GlFormTextarea> = {},
) => renderTextarea({ characterCountLimit: 10, remainingCountText, overLimitText, ...props });

describe("GlFormTextarea", () => {
  describe("rendering defaults", () => {
    it("renders a textarea with the gl-form-input, gl-form-textarea and form-control classes", () => {
      const markup = renderTextarea();

      expect(markup).toMatch(/<textarea[^>]*class="[^"]*gl-form-input[^"]*gl-form-textarea[^"]*form-control[^"]*"/);
      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("renders 4 rows by default and disables resizing", () => {
      const markup = renderTextarea();

      expect(markup).toMatch(/rows="4"/);
      expect(markup).toContain("resize:none");
    });

    it("generates a gl-form-textarea- id when no id is provided", () => {
      expect(renderTextarea()).toMatch(/id="gl-form-textarea-[^"]+"/);
    });

    it("honors a user-supplied id", () => {
      expect(renderTextarea({ id: "my-textarea-id" })).toContain("id=\"my-textarea-id\"");
    });

    it("renders the value", () => {
      expect(renderTextarea({ value: "some text" })).toContain("some text");
    });
  });

  describe("rows and maxRows", () => {
    it("binds the rows prop to the textarea", () => {
      expect(renderTextarea({ rows: 10 })).toContain("rows=\"10\"");
    });

    it("works with a string value", () => {
      expect(renderTextarea({ rows: "10" })).toContain("rows=\"10\"");
    });

    it("uses a minimum of 2 when rows is set to less than 2", () => {
      expect(renderTextarea({ rows: 1 })).toContain("rows=\"2\"");
      expect(renderTextarea({ rows: -10 })).toContain("rows=\"2\"");
    });

    it("sets the rows attribute when maxRows is less than rows", () => {
      expect(renderTextarea({ rows: 10, maxRows: 5 })).toContain("rows=\"10\"");
    });

    it("sets the rows attribute when maxRows equals rows", () => {
      expect(renderTextarea({ rows: 5, maxRows: 5 })).toContain("rows=\"5\"");
    });

    it("omits the rows attribute and forces overflow-y in auto-height mode", () => {
      const markup = renderTextarea({ rows: 2, maxRows: 10 });

      expect(markup).not.toContain("rows=");
      expect(markup).toContain("overflow-y:scroll");
      expect(markup).toContain("resize:none");
    });
  });

  describe("noResize", () => {
    it("allows resizing when noResize is false and not in auto-height mode", () => {
      const markup = renderTextarea({ noResize: false, rows: 5, maxRows: 5 });

      expect(markup).not.toContain("resize:none");
    });
  });

  describe("state", () => {
    it("adds is-valid when state is true", () => {
      const markup = renderTextarea({ state: true });

      expect(markup).toMatch(/class="[^"]*is-valid[^"]*"/);
      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("adds is-invalid and aria-invalid when state is false", () => {
      const markup = renderTextarea({ state: false });

      expect(markup).toMatch(/class="[^"]*is-invalid[^"]*"/);
      expect(markup).toContain("aria-invalid=\"true\"");
    });
  });

  describe("ariaInvalid", () => {
    it("renders aria-invalid for true and 'true'", () => {
      expect(renderTextarea({ ariaInvalid: true })).toContain("aria-invalid=\"true\"");
      expect(renderTextarea({ ariaInvalid: "true" })).toContain("aria-invalid=\"true\"");
    });

    it("passes through non-boolean values like 'spelling'", () => {
      expect(renderTextarea({ ariaInvalid: "spelling" })).toContain("aria-invalid=\"spelling\"");
    });

    it("lets state=false win over a false value", () => {
      expect(renderTextarea({ ariaInvalid: false, state: false })).toContain("aria-invalid=\"true\"");
    });
  });

  describe("attributes", () => {
    it("is disabled when disabled", () => {
      expect(renderTextarea({ disabled: true })).toMatch(/<textarea[^>]*disabled/);
    });

    it("is readonly when readOnly", () => {
      // React's static markup keeps the prop casing for known attributes
      expect(renderTextarea({ readOnly: true })).toContain("readOnly");
    });

    it("sets required and aria-required", () => {
      const markup = renderTextarea({ required: true });

      expect(markup).toMatch(/<textarea[^>]*required/);
      expect(markup).toContain("aria-required=\"true\"");
    });

    it("sets form, name, placeholder, and autocomplete", () => {
      const markup = renderTextarea({
        form: "my-form-id",
        name: "my-textarea",
        placeholder: "Enter text here",
        autoComplete: "off",
      });

      expect(markup).toContain("form=\"my-form-id\"");
      expect(markup).toContain("name=\"my-textarea\"");
      expect(markup).toContain("placeholder=\"Enter text here\"");
      // React's static markup keeps the prop casing for known attributes
      expect(markup).toContain("autoComplete=\"off\"");
    });

    it("forwards extra attributes to the native textarea", () => {
      const props = { "data-testid": "my-textarea", maxLength: 2048 };
      const markup = renderTextarea(props);

      expect(markup).toContain("data-testid=\"my-textarea\"");
      expect(markup).toContain("maxLength=\"2048\"");
    });
  });

  describe("size", () => {
    it("does not add a size class by default", () => {
      const markup = renderTextarea();

      expect(markup).not.toContain("form-control-sm");
      expect(markup).not.toContain("form-control-lg");
    });

    it.each(["sm", "lg"] as const)("adds form-control-%s when size is %s", (size) => {
      expect(renderTextarea({ size })).toContain(`form-control-${size}`);
    });
  });

  describe("textareaClasses", () => {
    it("applies a string value to the textarea", () => {
      expect(renderTextarea({ textareaClasses: "gl-rounded-lg" }))
        .toMatch(/class="[^"]*gl-rounded-lg[^"]*"/);
    });

    it("applies an array value to the textarea", () => {
      const markup = renderTextarea({ textareaClasses: ["gl-rounded-lg", "gl-border-solid"] });

      expect(markup).toMatch(/class="[^"]*gl-rounded-lg[^"]*gl-border-solid[^"]*"/);
    });

    it("applies an object value based on truthiness", () => {
      const markup = renderTextarea({
        textareaClasses: { "gl-rounded-lg": true, "gl-border-solid": false },
      });

      expect(markup).toMatch(/class="[^"]*gl-rounded-lg[^"]*"/);
      expect(markup).not.toContain("gl-border-solid");
    });
  });

  describe("formatter", () => {
    it("does not apply the formatter to the initial value", () => {
      const markup = renderTextarea({
        value: "TEST",
        formatter: (value) => value.toLowerCase(),
      });

      expect(markup).toContain("TEST");
    });
  });

  describe("character count", () => {
    it("is not rendered without a characterCountLimit", () => {
      const markup = renderTextarea({ value: "abcde" });

      expect(markup).not.toContain("gl-form-character-count");
      expect(markup).not.toContain("aria-describedby");
    });

    it("displays the remaining characters when under the limit", () => {
      const markup = renderTextareaWithCount({ value: "a".repeat(5) });

      // Visible text and the initial screen-reader-only text
      expect(markup.match(/5 characters remaining\./g)).toHaveLength(2);
    });

    it("displays the over-limit count when over the limit", () => {
      const markup = renderTextareaWithCount({ value: "a".repeat(15) });

      expect(markup.match(/5 characters over limit\./g)).toHaveLength(2);
      expect(markup).toMatch(/<small[^>]*class="[^"]*gl-text-danger[^"]*"/);
    });

    it("counts a null value as empty", () => {
      const markup = renderTextareaWithCount({ value: null });

      expect(markup.match(/10 characters remaining\./g)).toHaveLength(2);
    });

    it("links the textarea to the count via aria-describedby", () => {
      const markup = renderTextareaWithCount();

      const describedBy = markup.match(/aria-describedby="([^"]+)"/)?.[1];
      expect(describedBy).toMatch(/^form-textarea-character-count-/);
      expect(markup).toContain(`id="${describedBy}"`);
    });

    it("forwards extra attributes when the character count is rendered", () => {
      const props = { "data-testid": "my-textarea", maxLength: 2048 };
      const markup = renderTextareaWithCount(props);

      expect(markup).toContain("data-testid=\"my-textarea\"");
      expect(markup).toContain("maxLength=\"2048\"");
    });
  });
});

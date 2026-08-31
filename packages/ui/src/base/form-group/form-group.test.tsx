import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormGroup from "./form-group";

const renderGroup = (
  props: ComponentProps<typeof GlFormGroup> = {},
  children = <input id="test-input" />,
) => renderToStaticMarkup(
  <GlFormGroup label="Test label" {...props}>{children}</GlFormGroup>,
);

describe("GlFormGroup", () => {
  describe("label rendering", () => {
    it("renders a div with role=group and a label when labelFor is set", () => {
      const markup = renderGroup({ labelFor: "test-input" });

      expect(markup).toContain("role=\"group\"");
      expect(markup).not.toContain("<fieldset");
      expect(markup).toMatch(/<label[^>]*for="test-input"/);
      expect(markup).toContain("Test label");
      expect(markup).toContain("col-form-label");
      expect(markup).toContain("!gl-block");
    });

    it("renders a fieldset with a legend when labelFor is not set", () => {
      const markup = renderGroup();

      expect(markup).toContain("<fieldset");
      expect(markup).not.toContain("role=\"group\"");
      expect(markup).toMatch(/<legend[^>]*tabindex="-1"/);
      expect(markup).toContain("bv-no-focus-ring");
      expect(markup).toContain("col-form-label");
      expect(markup).toContain("!gl-pt-0");
    });

    it("does not render a label element when no label is provided", () => {
      const markup = renderGroup({ label: undefined, labelFor: "test-input" });

      expect(markup).not.toContain("<label");
      expect(markup).not.toContain("<legend");
    });

    it("merges labelClass with the default col-form-label class", () => {
      const markup = renderGroup({ labelClass: "additional-class", labelFor: "test-input" });

      expect(markup).toMatch(/<label class="[^"]*additional-class[^"]*"/);
      expect(markup).toMatch(/<label class="[^"]*col-form-label[^"]*"/);
    });

    it("honors a custom labelId", () => {
      const markup = renderGroup({ labelFor: "test-input", labelId: "my-label" });

      expect(markup).toContain("id=\"my-label\"");
    });

    it("generates a gl-form-group-label- id by default", () => {
      const markup = renderGroup({ labelFor: "test-input" });

      expect(markup).toMatch(/id="gl-form-group-label-[^"]+"/);
    });

    it("applies the labelSize class", () => {
      const markup = renderGroup({ labelFor: "test-input", labelSize: "sm" });

      expect(markup).toContain("col-form-label-sm");
    });

    it("renders an sr-only label when labelSrOnly is set", () => {
      const markup = renderGroup({ labelFor: "test-input", labelSrOnly: true });

      expect(markup).toMatch(/<label[^>]*class="gl-sr-only"/);
      expect(markup).not.toContain("col-form-label");
    });
  });

  describe("optional indicator", () => {
    it("renders the default optional text when optional", () => {
      const markup = renderGroup({ optional: true, labelFor: "test-input" });

      expect(markup).toContain("data-testid=\"optional-label\"");
      expect(markup).toContain("optional-label");
      expect(markup).toContain("(optional)");
    });

    it("renders custom optionalText", () => {
      const markup = renderGroup({
        optional: true,
        optionalText: "(not required)",
        labelFor: "test-input",
      });

      expect(markup).toContain("(not required)");
    });

    it("renders nothing when not optional", () => {
      expect(renderGroup({ labelFor: "test-input" })).not.toContain("optional-label");
    });
  });

  describe("labelDescription", () => {
    it("renders the description inside the label", () => {
      const markup = renderGroup({
        labelDescription: "label description text",
        labelFor: "test-input",
      });

      expect(markup).toContain("data-testid=\"label-description\"");
      expect(markup).toContain("label description text");
      expect(markup.indexOf("label-description")).toBeLessThan(markup.indexOf("</label>"));
    });

    it("is not rendered without a label", () => {
      const markup = renderGroup({ label: undefined, labelDescription: "orphan" });

      expect(markup).not.toContain("label-description");
    });
  });

  describe("description", () => {
    it("renders help text as a form-text element", () => {
      const markup = renderGroup({ description: "help text", labelFor: "test-input" });

      expect(markup).toMatch(/<small[^>]*class="form-text text-muted"[^>]*tabindex="-1"/);
      expect(markup).toContain("help text");
      expect(markup).toMatch(/<small[^>]*id="[^"]*-description"/);
    });

    it("renders nothing when omitted", () => {
      expect(renderGroup({ labelFor: "test-input" })).not.toContain("form-text");
    });
  });

  describe("validation state", () => {
    it("marks the group invalid and shows the invalid feedback when state is false", () => {
      const markup = renderGroup({
        invalidFeedback: "This field is required.",
        labelFor: "test-input",
        state: false,
        validFeedback: "Looks good.",
      });

      expect(markup).toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).toContain("aria-invalid=\"true\"");
      expect(markup).toContain("class=\"invalid-feedback !gl-block\"");
      expect(markup).toContain("class=\"valid-feedback\"");
    });

    it("marks the group valid and shows the valid feedback when state is true", () => {
      const markup = renderGroup({
        invalidFeedback: "This field is required.",
        labelFor: "test-input",
        state: true,
        validFeedback: "Looks good.",
      });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("aria-invalid");
      expect(markup).toContain("class=\"valid-feedback !gl-block\"");
      expect(markup).toContain("class=\"invalid-feedback\"");
    });

    it("renders feedback hidden and without state classes when state is null", () => {
      const markup = renderGroup({
        invalidFeedback: "This field is required.",
        labelFor: "test-input",
        state: null,
        validFeedback: "Looks good.",
      });

      expect(markup).not.toContain("is-invalid");
      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("aria-invalid");
      expect(markup).not.toMatch(/feedback !gl-block/);
    });

    it("gives feedback elements an assertive live region by default", () => {
      const markup = renderGroup({ invalidFeedback: "Error", labelFor: "test-input" });

      expect(markup).toContain("aria-live=\"assertive\"");
      expect(markup).toContain("aria-atomic=\"true\"");
      expect(markup).toMatch(/<div[^>]*tabindex="-1"[^>]*class="invalid-feedback"/);
    });

    it("honors a custom feedbackAriaLive", () => {
      const markup = renderGroup({
        feedbackAriaLive: "polite",
        invalidFeedback: "Error",
        labelFor: "test-input",
      });

      expect(markup).toContain("aria-live=\"polite\"");
    });

    it("adds the was-validated class when validated", () => {
      expect(renderGroup({ validated: true })).toContain("was-validated");
      expect(renderGroup()).not.toContain("was-validated");
    });

    it("respects an explicit aria-invalid over the state", () => {
      const markup = renderGroup({ "aria-invalid": "grammar", labelFor: "x", state: true });

      expect(markup).toContain("aria-invalid=\"grammar\"");
    });
  });

  describe("disabled", () => {
    it("disables the fieldset when no labelFor is set", () => {
      const markup = renderGroup({ disabled: true });

      expect(markup).toMatch(/<fieldset[^>]*disabled=""/);
    });

    it("ignores disabled when labelFor is set", () => {
      const markup = renderGroup({ disabled: true, labelFor: "test-input" });

      expect(markup).not.toContain("disabled");
    });
  });

  it("merges a consumer className on the group wrapper", () => {
    const markup = renderGroup({ className: "custom-class", labelFor: "test-input" });

    expect(markup).toMatch(/class="[^"]*form-group gl-form-group[^"]*custom-class/);
  });
});

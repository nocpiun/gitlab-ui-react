import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormDate from "./form-date";

const renderDate = (props: ComponentProps<typeof GlFormDate> = {}) => renderToStaticMarkup(
  <GlFormDate {...props} />,
);

describe("GlFormDate", () => {
  describe("rendering defaults", () => {
    it("renders a date input inside a gl-form-date wrapper", () => {
      const markup = renderDate();

      expect(markup).toMatch(/^<div class="gl-form-date">/);
      expect(markup).toMatch(/<input[^>]*type="date"/);
      expect(markup).toMatch(/class="[^"]*gl-form-input[^"]*form-control[^"]*"/);
    });

    it("sets the pattern and placeholder attributes", () => {
      const markup = renderDate();

      expect(markup).toContain("pattern=\"\\d{4}-\\d{2}-\\d{2}\"");
      expect(markup).toContain("placeholder=\"yyyy-mm-dd\"");
    });

    it("generates a form-date- id when no id is provided", () => {
      expect(renderDate()).toMatch(/id="form-date-[^"]+"/);
    });

    it("honors a user-supplied id", () => {
      expect(renderDate({ id: "idForInput" })).toContain("id=\"idForInput\"");
    });

    it("does not set min/max attributes without the props", () => {
      const markup = renderDate();

      expect(markup).not.toContain("min=");
      expect(markup).not.toContain("max=");
    });

    it("omits aria-describedby when there is no output value or feedback", () => {
      expect(renderDate()).not.toContain("aria-describedby");
    });

    it("does not render invalid feedback by default", () => {
      expect(renderDate()).not.toContain("invalid-feedback");
    });
  });

  describe("props", () => {
    it.each([
      [{ min: "2020-01-01" }, "min=\"2020-01-01\""],
      [{ max: "2020-01-31" }, "max=\"2020-01-31\""],
      [{ value: "2020-01-19" }, "value=\"2020-01-19\""],
    ])("passes %o to the input", (props, attribute) => {
      expect(renderDate(props)).toContain(attribute);
    });

    it("passes attrs like disabled and readOnly through to the input", () => {
      const markup = renderDate({ disabled: true, readOnly: true });

      expect(markup).toContain("disabled");
      expect(markup).toMatch(/readonly/i);
    });
  });

  describe("validation", () => {
    it("renders the min feedback and aria-invalid when value is below min", () => {
      const markup = renderDate({ min: "2020-01-01", value: "2019-01-01" });

      expect(markup).toContain("aria-invalid=\"true\"");
      expect(markup).toMatch(/aria-describedby="[^"]*form-date-invalid-feedback-[^"]*"/);
      expect(markup).toMatch(/class="invalid-feedback"[^>]*>Must be after minimum date\./);
    });

    it("renders the max feedback and aria-invalid when value exceeds max", () => {
      const markup = renderDate({ max: "2020-01-01", value: "2021-01-01" });

      expect(markup).toContain("aria-invalid=\"true\"");
      expect(markup).toMatch(/aria-describedby="[^"]*form-date-invalid-feedback-[^"]*"/);
      expect(markup).toMatch(/class="invalid-feedback"[^>]*>Must be before maximum date\./);
    });

    it("supports custom feedback messages", () => {
      const markup = renderDate({
        max: "2020-01-31",
        maxInvalidFeedback: "Must be before 2020-01-31.",
        value: "2020-02-02",
      });

      expect(markup).toContain("Must be before 2020-01-31.");
    });

    it("does not render feedback for a value within range", () => {
      const markup = renderDate({ min: "2020-01-01", max: "2020-01-31", value: "2020-01-19" });

      expect(markup).not.toContain("invalid-feedback");
      expect(markup).not.toContain("aria-invalid");
    });
  });
});

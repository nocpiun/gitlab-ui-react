import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlProgressBar, { type GlProgressBarVariant } from "./progress-bar";

const renderProgressBar = (props: ComponentProps<typeof GlProgressBar> = {}) => renderToStaticMarkup(
  <GlProgressBar {...props} />,
);

describe("GlProgressBar", () => {
  describe("default", () => {
    it("renders the track without an inline style", () => {
      const markup = renderProgressBar();

      expect(markup).toContain("<div class=\"gl-progress-bar progress\">");
    });

    it("renders the indicator with the expected classes and ARIA attributes", () => {
      const markup = renderProgressBar();

      expect(markup).toContain("class=\"gl-progress gl-progress-bar-primary\"");
      expect(markup).toContain("role=\"progressbar\"");
      expect(markup).toContain("aria-label=\"Progress bar\"");
      expect(markup).toContain("aria-valuemin=\"0\"");
      expect(markup).toContain("aria-valuemax=\"100\"");
      expect(markup).toContain("aria-valuenow=\"0\"");
      expect(markup).toContain("style=\"transform:scaleX(0)\"");
    });
  });

  describe("value", () => {
    it("sets the transform and aria-valuenow from value", () => {
      const markup = renderProgressBar({ value: 65.6 });

      expect(markup).toContain(`style="transform:scaleX(${65.6 / 100})"`);
      expect(markup).toContain("aria-valuenow=\"65.6\"");
    });

    it("accepts a string value", () => {
      const markup = renderProgressBar({ value: "25" });

      expect(markup).toContain("style=\"transform:scaleX(0.25)\"");
      expect(markup).toContain("aria-valuenow=\"25\"");
    });

    it("falls back to 0 for a non-numeric value", () => {
      const markup = renderProgressBar({ value: "nope" });

      expect(markup).toContain("style=\"transform:scaleX(0)\"");
      expect(markup).toContain("aria-valuenow=\"0\"");
    });
  });

  describe("aria-label", () => {
    it("sets the accessible label from the prop", () => {
      expect(renderProgressBar({ "aria-label": "Progress" })).toContain("aria-label=\"Progress\"");
    });
  });

  describe("max", () => {
    it("sets the transform and aria-valuemax from a custom max", () => {
      const markup = renderProgressBar({ max: 75.5, value: 45.1 });

      expect(markup).toContain(`style="transform:scaleX(${45.1 / 75.5})"`);
      expect(markup).toContain("aria-valuemax=\"75.5\"");
      expect(markup).toContain("aria-valuenow=\"45.1\"");
    });

    it.each([0, -5])("falls back to 100 for a non-positive max of %s", (max) => {
      const markup = renderProgressBar({ max });

      expect(markup).toContain("aria-valuemax=\"100\"");
    });
  });

  describe("variant", () => {
    it.each([
      "primary",
      "success",
      "warning",
      "danger",
    ] as GlProgressBarVariant[])("applies the %s variant class", (variant) => {
      expect(renderProgressBar({ variant })).toContain(`gl-progress gl-progress-bar-${variant}`);
    });
  });

  describe("height", () => {
    it("sets the track height", () => {
      expect(renderProgressBar({ height: "5px" })).toContain("style=\"height:5px\"");
    });

    it("merges the height with a consumer style", () => {
      const markup = renderProgressBar({ height: "5px", style: { marginTop: 4 } });

      expect(markup).toContain("margin-top:4px");
      expect(markup).toContain("height:5px");
    });
  });
});

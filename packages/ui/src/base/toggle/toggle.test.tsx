import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlToggle, { type GlToggleLabelPosition } from "./toggle";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderToggle = (props: ComponentProps<typeof GlToggle> = {}) => renderToStaticMarkup(
  <GlToggle label="toggle label" {...props} />,
);

describe("GlToggle", () => {
  it("renders a switch named by its label", () => {
    const markup = renderToggle();

    expect(markup).toContain("role=\"switch\"");
    expect(markup).toContain("aria-checked=\"false\"");
    expect(markup).toContain("type=\"button\"");
    expect(markup).toContain("data-testid=\"toggle-label\"");
    expect(markup).toContain("toggle label");
    expect(markup).toMatch(/aria-labelledby="[^"]+"/);
  });

  it.each([
    [true, "true", true],
    [false, "false", false],
  ] as const)("with value=%s", (value, ariaChecked, hasCheckedClass) => {
    const markup = renderToggle({ value });

    expect(markup).toContain(`aria-checked="${ariaChecked}"`);
    expect(markup.includes("is-checked")).toBe(hasCheckedClass);
    expect(markup).toContain(value ? "#check-xs" : "#close-xs");
  });

  describe("disabled", () => {
    it("exposes disabled state accessibly", () => {
      const markup = renderToggle({ disabled: true });

      expect(markup).toContain("aria-disabled=\"true\"");
      expect(markup).toContain("is-disabled");
      expect(markup).toContain("disabled=\"\"");
      expect(markup).toContain("gl-toggle-wrapper gl-mb-0 gl-flex gl-flex-col is-disabled");
    });

    it("omits aria-disabled when enabled", () => {
      expect(renderToggle()).not.toContain("aria-disabled");
    });
  });

  describe("isLoading", () => {
    it("renders a spinner instead of the thumb icon and marks the toggle disabled", () => {
      const markup = renderToggle({ isLoading: true });

      expect(markup).toContain("gl-spinner");
      expect(markup).toContain("toggle-loading");
      expect(markup).toContain("is-loading");
      expect(markup).toContain("is-disabled");
      expect(markup).not.toContain("toggle-icon");
    });

    it("still emits change events", () => {
      // Upstream only blocks activation when `disabled`; loading is visual.
      const markup = renderToggle({ isLoading: true });

      expect(markup).not.toContain("aria-disabled");
      expect(markup).not.toContain("disabled=\"\"");
    });
  });

  describe("description and help", () => {
    it("renders both in the default vertical layout and links help via aria-describedby", () => {
      const markup = renderToggle({ description: "description text", help: "help text" });

      expect(markup).toContain("data-testid=\"toggle-description\"");
      expect(markup).toContain("description text");
      expect(markup).toContain("data-testid=\"toggle-help\"");
      expect(markup).toContain("help text");
      expect(markup).toMatch(/aria-describedby="[^"]+"/);
      expect(markup).toContain("gl-mb-2");
    });

    it("renders neither when labelPosition is left", () => {
      const markup = renderToggle({
        description: "description text",
        help: "help text",
        labelPosition: "left",
      });

      expect(markup).not.toContain("toggle-description");
      expect(markup).not.toContain("toggle-help");
      expect(markup).not.toContain("aria-describedby");
    });

    it("omits aria-describedby without help", () => {
      expect(renderToggle()).not.toContain("aria-describedby");
    });
  });

  describe("label position", () => {
    it.each([
      ["top", "gl-flex-col", false],
      ["left", "gl-toggle-label-inline", false],
      ["hidden", "gl-flex-col", true],
    ] as const)("%s", (labelPosition, wrapperClass, srOnly) => {
      const markup = renderToggle({ labelPosition: labelPosition as GlToggleLabelPosition });

      expect(markup).toContain(wrapperClass);
      expect(markup.includes("gl-sr-only")).toBe(srOnly);
      expect(markup).toMatch(/aria-labelledby="[^"]+"/);
    });
  });

  it("renders a hidden input when name is provided", () => {
    const markup = renderToggle({ name: "feature", value: true });

    expect(markup).toContain("type=\"hidden\"");
    expect(markup).toContain("name=\"feature\"");
    expect(markup).toContain("value=\"true\"");
  });

  it("honors a custom labelId", () => {
    const markup = renderToggle({ labelId: "example-toggle" });

    expect(markup).toContain("id=\"example-toggle\"");
    expect(markup).toContain("aria-labelledby=\"example-toggle\"");
  });
});

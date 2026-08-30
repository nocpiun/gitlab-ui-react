import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlLabel from "./label";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultProps = {
  backgroundColor: "rgb(204, 204, 204)",
  title: "title",
} satisfies ComponentProps<typeof GlLabel>;

const renderLabel = (props: Partial<ComponentProps<typeof GlLabel>> = {}) => (
  renderToStaticMarkup(<GlLabel {...defaultProps} {...props} />)
);

describe("GlLabel", () => {
  it("renders a focusable text label and forwards root attributes", () => {
    const markup = renderLabel({ className: "custom-label", id: "label-id", title: "Label Title" });

    expect(markup).toContain("class=\"gl-label gl-label-text-dark custom-label\"");
    expect(markup).toContain("id=\"label-id\"");
    expect(markup).toContain("--label-background-color:rgb(204, 204, 204)");
    expect(markup).toContain("class=\"gl-label-link\" tabindex=\"0\"");
    expect(markup).toContain("<span class=\"gl-label-text\">Label Title</span>");
    expect(markup).not.toContain("gl-label-text-scoped");
  });

  it.each([
    ["#CCCCCC", "dark"],
    ["rgb(204, 204, 204)", "dark"],
    ["#FFF", "dark"],
    ["rgba(255, 255, 255, 1)", "dark"],
    ["#000080", "light"],
  ])("uses %s to infer %s text", (backgroundColor, textColor) => {
    expect(renderLabel({ backgroundColor })).toContain(`gl-label-text-${textColor}`);
  });

  it("does not split a basic title containing two colons", () => {
    const markup = renderLabel({ title: "scoped::label" });

    expect(markup).toContain(">scoped::label</span>");
    expect(markup).not.toContain("gl-label-text-scoped");
  });

  it("splits a scoped title at the final separator", () => {
    const markup = renderLabel({ scoped: true, title: "one::two::three" });

    expect(markup).toContain("gl-label-scoped");
    expect(markup).toContain("<span class=\"gl-label-text\">one::two</span>");
    expect(markup).toContain("<span class=\"gl-label-text-scoped\">three</span>");
  });

  it("renders a safe link when target is provided", () => {
    const markup = renderLabel({ target: "https://gitlab.com/" });

    expect(markup).toContain("<a");
    expect(markup).toContain("class=\"gl-label-link gl-label-link-underline\"");
    expect(markup).toContain("href=\"https://gitlab.com/\"");
  });

  it("uses GlLink URL sanitization for unsafe targets", () => {
    expect(renderLabel({ target: "javascript:alert(1)" })).toContain("href=\"about:blank\"");
  });

  describe("tooltip", () => {
    it("keeps the description and footer out of the closed markup", () => {
      const markup = renderLabel({
        description: "lorem ipsum",
        footer: "Archived",
        scoped: true,
        title: "scoped::label",
      });

      expect(markup).not.toContain("lorem ipsum");
      expect(markup).not.toContain("Archived");
      expect(markup).not.toContain("gl-label-tooltip-title");
      expect(markup).toContain("gl-label-scoped");
    });
  });

  describe("remove button", () => {
    it("does not render by default", () => {
      expect(renderLabel()).not.toContain("gl-label-close");
    });

    it("renders the accessible close icon button when requested", () => {
      const markup = renderLabel({ showCloseButton: true });

      expect(markup).toContain("class=\"btn gl-button btn-sm btn-reset btn-reset-tertiary gl-label-close\"");
      expect(markup).toContain("aria-label=\"Remove label - title\"");
      expect(markup).toContain("href=\"/path/to/icons.svg#close-xs\"");
      expect(markup).toContain("s12");
    });

    it("keeps a disabled close button focusable and exposes its state", () => {
      const markup = renderLabel({ disabled: true, showCloseButton: true });

      expect(markup).toContain("aria-disabled=\"true\"");
      expect(markup).not.toContain(" disabled=\"\"");
    });
  });
});

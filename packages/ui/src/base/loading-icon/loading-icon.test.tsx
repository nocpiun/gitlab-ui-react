import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlLoadingIcon from "./loading-icon";

const renderLoadingIcon = (
  props: ComponentProps<typeof GlLoadingIcon> = {},
) => renderToStaticMarkup(<GlLoadingIcon {...props} />);

describe("GlLoadingIcon", () => {
  it.each([
    ["spinner", "gl-spinner-container", "gl-spinner"],
    ["dots", "gl-dots-loader", "<span></span>"],
  ] as const)("renders the default %s markup", (variant, rootClass, indicator) => {
    const markup = renderLoadingIcon({ variant });

    expect(markup).toMatch(/^<div/);
    expect(markup).toContain(`class="${rootClass}`);
    expect(markup).toContain(indicator);
    expect(markup).toContain("role=\"status\"");
    expect(markup).toContain("aria-label=\"Loading\"");
  });

  it.each(["spinner", "dots"] as const)(
    "renders the %s variant inline when requested",
    (variant) => {
      expect(renderLoadingIcon({ inline: true, variant })).toMatch(/^<span/);
    },
  );

  it.each([
    ["spinner", "sm", "dark", "gl-spinner gl-spinner-dark gl-spinner-sm"],
    ["spinner", "md", "light", "gl-spinner gl-spinner-light gl-spinner-md"],
    ["spinner", "lg", "dark", "gl-spinner gl-spinner-dark gl-spinner-lg"],
    ["spinner", "xl", "light", "gl-spinner gl-spinner-light gl-spinner-xl"],
    ["dots", "sm", "dark", "gl-dots-loader gl-dots-loader-dark gl-dots-loader-sm"],
    ["dots", "md", "light", "gl-dots-loader gl-dots-loader-light gl-dots-loader-md"],
    ["dots", "lg", "dark", "gl-dots-loader gl-dots-loader-dark gl-dots-loader-lg"],
    ["dots", "xl", "light", "gl-dots-loader gl-dots-loader-light gl-dots-loader-xl"],
  ] as const)(
    "applies the %s/%s/%s classes",
    (variant, size, color, expectedClasses) => {
      const markup = renderLoadingIcon({ color, size, variant });

      expect(markup).toContain(expectedClasses);
    },
  );

  it.each(["spinner", "dots"] as const)(
    "supports a custom accessible label and role for the %s variant",
    (variant) => {
      const markup = renderLoadingIcon({ label: "Fetching results", role: "dialog", variant });

      expect(markup).toContain("aria-label=\"Fetching results\"");
      expect(markup).toContain("role=\"dialog\"");
    },
  );

  it("lets the native aria-label take precedence over label", () => {
    const markup = renderLoadingIcon({
      "aria-label": "Saving",
      label: "Fetching results",
    });

    expect(markup).toContain("aria-label=\"Saving\"");
    expect(markup).not.toContain("Fetching results");
  });

  it("forwards native attributes and appends a custom class to the root", () => {
    const markup = renderLoadingIcon({
      className: "custom-loader",
      id: "results-loader",
      title: "Loading results",
    });

    expect(markup).toContain("class=\"gl-spinner-container custom-loader\"");
    expect(markup).toContain("id=\"results-loader\"");
    expect(markup).toContain("title=\"Loading results\"");
  });
});

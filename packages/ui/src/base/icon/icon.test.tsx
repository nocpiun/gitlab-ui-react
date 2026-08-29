import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlIcon from "./icon";

const ICONS_PATH = "/path/to/icons.svg";
const TEST_NAME = "check-circle";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

describe("GlIcon", () => {
  const renderIcon = (props: Omit<ComponentProps<typeof GlIcon>, "name"> = {}) => renderToStaticMarkup(<GlIcon name={TEST_NAME} {...props} />);

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders the requested sprite icon with the default size and variant", () => {
    const markup = renderIcon();

    expect(markup).toContain("class=\"gl-icon s16 gl-fill-current\"");
    expect(markup).toContain(`data-testid="${TEST_NAME}-icon"`);
    expect(markup).toContain("role=\"img\"");
    expect(markup).toContain(`href="${ICONS_PATH}#${TEST_NAME}"`);
  });

  it("is hidden from assistive technologies when it is decorative", () => {
    expect(renderIcon()).toContain("aria-hidden=\"true\"");
  });

  it.each([
    ["ariaLabel", { ariaLabel: "Successful" }],
    ["aria-label", { "aria-label": "Successful" }],
  ])("uses %s as its accessible name", (_propName, props) => {
    const markup = renderIcon(props);

    expect(markup).toContain("aria-label=\"Successful\"");
    expect(markup).not.toContain("aria-hidden");
  });

  it("applies the requested size, variant, class, and native SVG props", () => {
    const markup = renderIcon({
      className: "custom-class",
      id: "status-icon",
      size: 24,
      variant: "warning",
    });

    expect(markup).toContain("class=\"gl-icon s24 gl-fill-icon-warning custom-class\"");
    expect(markup).toContain("id=\"status-icon\"");
  });

  it("warns about unknown icons during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    renderToStaticMarkup(<GlIcon name="unknown-icon" />);

    expect(warn).toHaveBeenCalledWith(
      "[GlIcon] Icon 'unknown-icon' is not a known icon of @gitlab/svgs",
    );
  });
});

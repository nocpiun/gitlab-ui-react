import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlButton from "./button";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderButton = (
  props: ComponentProps<typeof GlButton> = {},
  children: ReactNode = "Button text",
) => renderToStaticMarkup(<GlButton {...props}>{children}</GlButton>);

describe("GlButton", () => {
  it("renders a medium default button with a non-submitting type", () => {
    const markup = renderButton({ id: "save-button" });

    expect(markup).toContain("<button");
    expect(markup).toContain("class=\"btn gl-button btn-md btn-default\"");
    expect(markup).toContain("type=\"button\"");
    expect(markup).toContain("id=\"save-button\"");
    expect(markup).toContain("<span class=\"gl-button-text\">Button text</span>");
  });

  it.each([
    ["default", "primary", "btn-default"],
    ["default", "secondary", "btn-default-secondary"],
    ["default", "tertiary", "btn-default-tertiary"],
    ["confirm", "primary", "btn-confirm"],
    ["confirm", "secondary", "btn-confirm-secondary"],
    ["confirm", "tertiary", "btn-confirm-tertiary"],
    ["danger", "primary", "btn-danger"],
    ["danger", "secondary", "btn-danger-secondary"],
    ["danger", "tertiary", "btn-danger-tertiary"],
  ] as const)("applies the %s/%s appearance", (variant, category, expectedClass) => {
    expect(renderButton({ category, variant })).toContain(expectedClass);
  });

  it("applies size, state, block, custom root, and text classes", () => {
    const markup = renderButton({
      active: true,
      block: true,
      buttonTextClasses: "custom-text",
      className: "custom-root",
      selected: true,
      size: "small",
    });

    expect(markup).toContain("btn-sm");
    expect(markup).toContain("selected");
    expect(markup).toContain("btn-block");
    expect(markup).toContain("active");
    expect(markup).toContain("custom-root");
    expect(markup).toContain("class=\"gl-button-text custom-text\"");
  });

  it("renders an icon-only ellipsis button with an accessible name", () => {
    const markup = renderButton({ "aria-label": "More actions", icon: "ellipsis_h" }, null);

    expect(markup).toContain("btn-icon");
    expect(markup).toContain("button-ellipsis-horizontal");
    expect(markup).toContain("aria-label=\"More actions\"");
    expect(markup).toContain("href=\"/path/to/icons.svg#ellipsis_h\"");
    expect(markup).not.toContain("gl-button-text");
  });

  it("keeps a button with an icon and count out of icon-only mode", () => {
    const markup = renderButton({ count: 3, countSrText: "unread notifications", icon: "notifications" }, null);

    expect(markup).not.toContain("btn-icon");
    expect(markup).toContain("<span class=\"gl-button-count\">3");
    expect(markup).toContain("<span class=\"gl-sr-only\">unread notifications</span>");
  });

  it("hides absent and negative counts while preserving zero", () => {
    expect(renderButton({ count: null })).not.toContain("gl-button-count");
    expect(renderButton({ count: -1 })).not.toContain("gl-button-count");
    expect(renderButton({ count: 0 })).toContain("<span class=\"gl-button-count\">0</span>");
  });

  it("renders a non-interactive label and ignores block styling", () => {
    const markup = renderButton({ block: true, label: true, size: "small" });

    expect(markup).toContain("<span");
    expect(markup).toContain("btn-label");
    expect(markup).toContain("btn-sm");
    expect(markup).not.toContain("btn-block");
    expect(markup).not.toContain("<button");
  });

  it("uses Base UI's focusable disabled behavior", () => {
    const markup = renderButton({ disabled: true });

    expect(markup).toContain("disabled");
    expect(markup).toContain("aria-disabled=\"true\"");
    expect(markup).toContain("data-disabled=\"\"");
    expect(markup).not.toContain(" disabled=\"\"");
  });

  it("renders safe links and secures new browsing contexts", () => {
    const markup = renderButton({
      href: "https://example.com",
      rel: "author",
      target: "_blank",
    });

    expect(markup).toContain("<a");
    expect(markup).toContain("href=\"https://example.com\"");
    expect(markup).toContain("rel=\"author noopener noreferrer\"");
    expect(markup).not.toContain("role=\"button\"");
  });

  it("sanitizes unsafe link protocols by default", () => {
    expect(renderButton({ href: "javascript:alert(1)" })).toContain("href=\"about:blank\"");
  });

  it("adds button semantics to a hash link", () => {
    const markup = renderButton({ href: "#" });

    expect(markup).toContain("href=\"#\"");
    expect(markup).toContain("role=\"button\"");
  });

  it("supports Base UI render composition for non-native controls", () => {
    const markup = renderButton({ nativeButton: false, render: <div /> });

    expect(markup).toContain("<div");
    expect(markup).toContain("role=\"button\"");
    expect(markup).toContain("tabindex=\"0\"");
  });
});

import type { GlDropdownHandle } from "../../internal/dropdown/dropdown-types";
import { Fragment, createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownFooter,
  GlDisclosureDropdownHeader,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
  hasDirectDisclosureDropdownItemIcon,
} from "./disclosure-dropdown";
import {
  resolveDropdownOffset,
  resolveDropdownPlacement,
} from "../../internal/dropdown/dropdown-utils";
import {
  GlDisclosureDropdownGroup,
  GlDisclosureDropdownGroupLabel,
} from "./disclosure-dropdown-group";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

function renderDropdown(children: ReactNode, rootProps = {}) {
  return renderToStaticMarkup(
    <GlDisclosureDropdown defaultOpen {...rootProps}>
      <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>{children}</GlDisclosureDropdownContent>
    </GlDisclosureDropdown>,
  );
}

describe("GlDisclosureDropdown", () => {
  it("renders the GitLab root and Base UI trigger semantics with default props", () => {
    const markup = renderToStaticMarkup(
      <GlDisclosureDropdown data-testid="dropdown">
        <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
      </GlDisclosureDropdown>,
    );

    expect(markup).toContain("gl-disclosure-dropdown gl-new-dropdown");
    expect(markup).toContain("gl-new-dropdown-toggle");
    expect(markup).toContain("aria-haspopup=\"menu\"");
    expect(markup).not.toContain("aria-expanded=\"true\"");
    expect(markup).toContain("btn-md btn-default");
    expect(markup).toContain("chevron-down-icon");
  });

  it("applies trigger appearance, icon-only, screen-reader, and no-caret props", () => {
    const markup = renderToStaticMarkup(
      <GlDisclosureDropdown>
        <GlDisclosureDropdownTrigger
          block
          category="tertiary"
          icon="ellipsis_v"
          noCaret
          size="small"
          textSrOnly>
          More actions
        </GlDisclosureDropdownTrigger>
      </GlDisclosureDropdown>,
    );

    expect(markup).toContain("btn-default-tertiary");
    expect(markup).toContain("btn-sm");
    expect(markup).toContain("btn-block");
    expect(markup).toContain("gl-new-dropdown-icon-only");
    expect(markup).toContain("gl-new-dropdown-toggle-no-caret");
    expect(markup).toContain("gl-sr-only");
    expect(markup).not.toContain("chevron-down-icon");
  });

  it("warns on conflicting trigger names and lets aria-labelledby win", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const markup = renderToStaticMarkup(
      <GlDisclosureDropdown>
        <GlDisclosureDropdownTrigger
          aria-label="Ignored label"
          aria-labelledby="external-label"
          icon="ellipsis_v"
          noCaret />
      </GlDisclosureDropdown>,
    );

    expect(warning).toHaveBeenCalledOnce();
    expect(markup).toContain("aria-labelledby=\"external-label\"");
    expect(markup).not.toContain("aria-label=\"Ignored label\"");
    warning.mockRestore();
  });

  it.each([
    ["right-start", { align: "start", side: "right" }],
    ["bottom-start", { align: "start", side: "bottom" }],
    ["bottom-end", { align: "end", side: "bottom" }],
    ["bottom", { align: "center", side: "bottom" }],
    ["left", { align: "start", side: "bottom" }],
    ["center", { align: "center", side: "bottom" }],
    ["right", { align: "end", side: "bottom" }],
  ] as const)("maps the %s placement", (placement, expected) => {
    expect(resolveDropdownPlacement(placement)).toEqual(expected);
  });

  it("maps numeric and object offsets to Base UI axes", () => {
    expect(resolveDropdownOffset(12)).toEqual({ alignOffset: 0, sideOffset: 12 });
    const dimensions = {
      anchor: { height: 20, width: 40 },
      positioner: { height: 100, width: 248 },
      side: "bottom" as const,
    };
    const crossAxisOffset = resolveDropdownOffset({ crossAxis: -3, mainAxis: 5 });
    expect(crossAxisOffset.sideOffset).toBe(5);
    expect(typeof crossAxisOffset.alignOffset).toBe("function");
    if(typeof crossAxisOffset.alignOffset === "function") {
      expect(crossAxisOffset.alignOffset({ ...dimensions, align: "start" })).toBe(-3);
      expect(crossAxisOffset.alignOffset({ ...dimensions, align: "end" })).toBe(3);
    }

    expect(resolveDropdownOffset({
      alignmentAxis: 7,
      crossAxis: 100,
      mainAxis: 9,
    })).toEqual({ alignOffset: 7, sideOffset: 9 });
  });

  it("detects icons only on direct items and through fragments", () => {
    expect(hasDirectDisclosureDropdownItemIcon(
      <GlDisclosureDropdownItem icon="pencil" value="edit">Edit</GlDisclosureDropdownItem>,
    )).toBe(true);
    expect(hasDirectDisclosureDropdownItemIcon(
      <Fragment>
        <GlDisclosureDropdownItem value="edit">Edit</GlDisclosureDropdownItem>
        <GlDisclosureDropdownItem icon="remove" value="delete">Delete</GlDisclosureDropdownItem>
      </Fragment>,
    )).toBe(true);
    expect(hasDirectDisclosureDropdownItemIcon(
      <div>
        <GlDisclosureDropdownItem icon="pencil" value="edit">Edit</GlDisclosureDropdownItem>
      </div>,
    )).toBe(false);
  });

  it("applies native region props to composed headers and footers", () => {
    const headerRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();
    const markup = renderToStaticMarkup(
      <>
        <GlDisclosureDropdownHeader
          ref={headerRef}
          className="custom-header"
          data-testid="header"
          style={{ color: "red" }}>
          Header
        </GlDisclosureDropdownHeader>
        <GlDisclosureDropdownFooter
          ref={footerRef}
          className="custom-footer"
          data-testid="footer"
          style={{ color: "blue" }}>
          Footer
        </GlDisclosureDropdownFooter>
      </>,
    );

    expect(markup).toContain("gl-new-dropdown-header custom-header");
    expect(markup).toContain("gl-new-dropdown-footer custom-footer");
    expect(markup).toContain("data-testid=\"header\"");
    expect(markup).toContain("data-testid=\"footer\"");
    expect(markup).toContain("color:red");
    expect(markup).toContain("color:blue");
  });

  it("requires items to be nested in a group", () => {
    expect(() => renderToStaticMarkup(
      <GlDisclosureDropdown>
        <GlDisclosureDropdownItem value="edit">Edit</GlDisclosureDropdownItem>
      </GlDisclosureDropdown>,
    )).toThrowError("GlDisclosureDropdownItem must be used inside GlDisclosureDropdownGroup.");
  });

  it("supports groups without labels", () => {
    const markup = renderToStaticMarkup(
      <GlDisclosureDropdown>
        <GlDisclosureDropdownGroup>Instructions</GlDisclosureDropdownGroup>
      </GlDisclosureDropdown>,
    );

    expect(markup).toContain("role=\"group\"");
    expect(markup).not.toContain("aria-labelledby");
  });

  it("exposes the complete imperative handle contract", () => {
    expectTypeOf<GlDropdownHandle>().toMatchTypeOf<{
      close(): void;
      closeAndFocus(): void;
      containsElement(element: Element | null): boolean;
      open(): void;
    }>();
  });

  it("accepts the composed item and group structure while closed during SSR", () => {
    const markup = renderDropdown(
      <GlDisclosureDropdownGroup bordered>
        <GlDisclosureDropdownGroupLabel>Danger zone</GlDisclosureDropdownGroupLabel>
        <GlDisclosureDropdownItem icon="pencil" value="edit">Edit</GlDisclosureDropdownItem>
      </GlDisclosureDropdownGroup>,
    );

    // Base UI intentionally leaves the portal unmounted during SSR; the trigger remains usable.
    expect(markup).toContain("aria-haspopup=\"menu\"");
    expect(markup).not.toContain("role=\"menu\"");
  });
});

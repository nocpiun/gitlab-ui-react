import { Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
  hasDirectDisclosureDropdownItemIcon,
  resolveDisclosureDropdownOffset,
  resolveDisclosureDropdownPlacement,
  type GlDisclosureDropdownHandle,
} from "./disclosure-dropdown";
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
    expect(resolveDisclosureDropdownPlacement(placement)).toEqual(expected);
  });

  it("maps numeric and object offsets to Base UI axes", () => {
    expect(resolveDisclosureDropdownOffset(12)).toEqual({ alignOffset: 0, sideOffset: 12 });
    expect(resolveDisclosureDropdownOffset({ crossAxis: -3, mainAxis: 5 })).toEqual({
      alignOffset: -3,
      sideOffset: 5,
    });

    const { alignOffset, sideOffset } = resolveDisclosureDropdownOffset({
      alignmentAxis: 7,
      crossAxis: 100,
      mainAxis: 9,
    });
    expect(sideOffset).toBe(9);
    expect(typeof alignOffset).toBe("function");
    if(typeof alignOffset === "function") {
      const dimensions = {
        anchor: { height: 20, width: 40 },
        positioner: { height: 100, width: 248 },
        side: "bottom" as const,
      };
      expect(alignOffset({ ...dimensions, align: "start" })).toBe(7);
      expect(alignOffset({ ...dimensions, align: "end" })).toBe(-7);
    }
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

  it("exposes the complete imperative handle contract", () => {
    expectTypeOf<GlDisclosureDropdownHandle>().toMatchTypeOf<{
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

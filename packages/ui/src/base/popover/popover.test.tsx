import { Fragment, createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
  resolvePopoverFallbackLabelledBy,
  shouldCancelPopoverTriggerClose,
  type GlPopoverProps,
  type GlPopoverTriggerMode,
} from "./popover";

function renderPopover(children: ReactNode = "Popover body", rootProps: GlPopoverProps = {}) {
  return renderToStaticMarkup(
    <GlPopover {...rootProps}>
      <GlPopoverTrigger asChild>
        <button type="button">Open popover</button>
      </GlPopoverTrigger>
      <GlPopoverContent>{children}</GlPopoverContent>
    </GlPopover>,
  );
}

describe("GlPopover", () => {
  it("renders text inside a GitLab-styled default trigger", () => {
    const markup = renderToStaticMarkup(
      <GlPopover>
        <GlPopoverTrigger category="tertiary" variant="confirm">
          Open default popover
        </GlPopoverTrigger>
      </GlPopover>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("gl-button");
    expect(markup).toContain("btn-confirm-tertiary");
    expect(markup).toContain("Open default popover");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
  });

  it("composes the child element as a dialog trigger", () => {
    const markup = renderPopover();

    expect(markup).toContain("<button");
    expect(markup).toContain("Open popover</button>");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).not.toContain("aria-expanded=\"true\"");
  });

  it("merges styles and accepts a ref in asChild mode", () => {
    const triggerRef = createRef<HTMLElement>();
    const markup = renderToStaticMarkup(
      <GlPopover>
        <GlPopoverTrigger
          ref={triggerRef}
          asChild
          className="trigger-class"
          style={{ backgroundColor: "red", color: "red" }}>
          <button
            className="child-class"
            style={{ color: "blue" }}
            type="button">
            Styled popover
          </button>
        </GlPopoverTrigger>
      </GlPopover>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("child-class trigger-class");
    expect(markup).toContain("background-color:red;color:blue");
  });

  it("supports an initially open uncontrolled state", () => {
    const markup = renderPopover(undefined, { defaultOpen: true });

    expect(markup).toContain("aria-expanded=\"true\"");
    // Base UI does not render portal content or its generated ID during SSR.
    expect(markup).not.toContain("role=\"dialog\"");
  });

  it("leaves the composed trigger enabled when the popover is disabled", () => {
    const markup = renderPopover(undefined, { disabled: true });

    expect(markup).not.toContain("disabled=\"\"");
    expect(markup).not.toContain("aria-disabled=\"true\"");
  });

  it("accepts the typed trigger modes", () => {
    expectTypeOf<GlPopoverProps["triggers"]>()
      .toEqualTypeOf<readonly GlPopoverTriggerMode[] | undefined>();
  });

  it.each([
    [false, "trigger-hover", true, true],
    [false, "trigger-press", true, true],
    [false, "focus-out", true, true],
    [false, "outside-press", true, false],
    [false, "trigger-hover", false, false],
    [true, "trigger-hover", true, false],
  ] as const)(
    "coordinates close requests across active trigger modes",
    (nextOpen, reason, hasActiveTrigger, expected) => {
      expect(shouldCancelPopoverTriggerClose(
        nextOpen,
        reason,
        hasActiveTrigger,
      )).toBe(expected);
    },
  );

  it("uses the trigger to name a titleless popover", () => {
    expect(resolvePopoverFallbackLabelledBy(false, "trigger-id", undefined, undefined))
      .toBe("trigger-id");
  });

  it.each([
    [true, undefined, undefined],
    [false, "Explicit label", undefined],
    [false, undefined, "external-label"],
  ] as const)(
    "does not add a trigger fallback when another accessible name is available",
    (hasTitle, ariaLabel, ariaLabelledBy) => {
      expect(resolvePopoverFallbackLabelledBy(
        hasTitle,
        "trigger-id",
        ariaLabel,
        ariaLabelledBy,
      )).toBeUndefined();
    },
  );

  it("requires the trigger to be inside GlPopover", () => {
    expect(() => renderToStaticMarkup(
      <GlPopoverTrigger asChild>
        <button type="button">Open</button>
      </GlPopoverTrigger>,
    )).toThrowError("GlPopoverTrigger must be used inside GlPopover.");
  });

  it("requires the content to be inside GlPopover", () => {
    expect(() => renderToStaticMarkup(
      <GlPopoverContent>Popover body</GlPopoverContent>,
    )).toThrowError("GlPopoverContent must be used inside GlPopover.");
  });

  it("allows the title through a Fragment", () => {
    expect(() => renderPopover(
      <Fragment>
        <GlPopoverTitle>Popover title</GlPopoverTitle>
        Popover body
      </Fragment>,
    )).not.toThrow();
  });

  it("rejects duplicate titles", () => {
    expect(() => renderPopover(
      <>
        <GlPopoverTitle>First title</GlPopoverTitle>
        <GlPopoverTitle>Second title</GlPopoverTitle>
      </>,
    )).toThrowError("GlPopoverContent accepts only one GlPopoverTitle child.");
  });

  it("rejects a title outside GlPopoverContent", () => {
    expect(() => renderToStaticMarkup(
      <GlPopover>
        <GlPopoverTitle>Popover title</GlPopoverTitle>
      </GlPopover>,
    )).toThrowError(
      "GlPopoverTitle must be used as a direct child of GlPopoverContent. Fragments are supported.",
    );
  });
});

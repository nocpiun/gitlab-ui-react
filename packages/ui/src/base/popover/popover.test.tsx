import { Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
  type GlPopoverProps,
  type GlPopoverTriggerMode,
} from "./popover";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

function renderPopover(children: ReactNode = "Popover body", rootProps: GlPopoverProps = {}) {
  return renderToStaticMarkup(
    <GlPopover {...rootProps}>
      <GlPopoverTrigger>
        <button type="button">Open popover</button>
      </GlPopoverTrigger>
      <GlPopoverContent>{children}</GlPopoverContent>
    </GlPopover>,
  );
}

describe("GlPopover", () => {
  it("composes the child element as a dialog trigger", () => {
    const markup = renderPopover();

    expect(markup).toContain("<button");
    expect(markup).toContain("Open popover</button>");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).not.toContain("aria-expanded=\"true\"");
  });

  it("supports an initially open uncontrolled state", () => {
    const markup = renderPopover(undefined, { defaultOpen: true });

    expect(markup).toContain("aria-expanded=\"true\"");
    // Base UI does not render portal content or its generated ID during SSR.
    expect(markup).not.toContain("role=\"dialog\"");
  });

  it("disables the composed trigger", () => {
    const markup = renderPopover(undefined, { disabled: true });

    expect(markup).toContain("disabled=\"\"");
  });

  it("accepts the typed trigger modes", () => {
    expectTypeOf<GlPopoverProps["triggers"]>()
      .toEqualTypeOf<readonly GlPopoverTriggerMode[] | undefined>();
  });

  it("requires the trigger to be inside GlPopover", () => {
    expect(() => renderToStaticMarkup(
      <GlPopoverTrigger>
        <button type="button">Open</button>
      </GlPopoverTrigger>,
    )).toThrowError("GlPopoverTrigger must be used inside GlPopover.");
  });

  it("requires the content to be inside GlPopover", () => {
    expect(() => renderToStaticMarkup(
      <GlPopoverContent>Popover body</GlPopoverContent>,
    )).toThrowError("GlPopoverContent must be used inside GlPopover.");
  });

  it("requires the title to be a direct child of GlPopoverContent", () => {
    expect(() => renderPopover(
      <div>
        <GlPopoverTitle>Nested title</GlPopoverTitle>
      </div>,
    )).toThrowError(
      "GlPopoverTitle must be used as a direct child of GlPopoverContent. Fragments are supported.",
    );
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

import { createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
  type GlPopoverContentProps,
  type GlPopoverProps,
  type GlPopoverTriggers,
} from "./popover";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultContent = (
  <>
    <GlPopoverTitle id="popover-title">Details</GlPopoverTitle>
    <a href="/details">Learn more</a>
  </>
);

function renderPopover(
  contentProps: GlPopoverContentProps = {},
  children: ReactNode = defaultContent,
  rootProps: GlPopoverProps = {},
) {
  return renderToStaticMarkup(
    <GlPopover defaultOpen {...rootProps}>
      <GlPopoverTrigger id="popover-trigger">Information</GlPopoverTrigger>
      <GlPopoverContent portalled={false} {...contentProps}>{children}</GlPopoverContent>
    </GlPopover>,
  );
}

describe("GlPopover", () => {
  it("renders only the trigger with default portal settings on the server", () => {
    const markup = renderPopover({ portalled: true }, defaultContent, { defaultOpen: false });

    expect(markup).toContain("gl-button");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).not.toContain("role=\"dialog\"");
  });

  it("does not resolve selector containers on the server", () => {
    expect(() => renderPopover({ container: "#portal", portalled: true })).not.toThrow();
  });

  it("lets controlled visibility override the initial value", () => {
    expect(renderPopover({}, defaultContent, { open: false })).toContain("aria-expanded=\"false\"");
  });

  it("renders an inline destination without accessing the DOM on the server", () => {
    const markup = renderPopover();

    expect(markup).toContain("class=\"gl-contents\"");
    expect(markup).not.toContain("role=\"dialog\"");
  });

  it("rejects duplicate headings, including inside fragments", () => {
    expect(() => renderPopover({}, (
      <>
        <GlPopoverTitle>First</GlPopoverTitle>
        <><GlPopoverTitle>Second</GlPopoverTitle></>
      </>
    ))).toThrow("only one GlPopoverTitle");
  });

  it("requires the appropriate compound component context", () => {
    expect(() => renderToStaticMarkup(<GlPopoverTrigger />)).toThrow("within GlPopover");
    expect(() => renderToStaticMarkup(<GlPopoverContent />)).toThrow("within GlPopover");
    expect(() => renderToStaticMarkup(<GlPopoverTitle>Heading</GlPopoverTitle>)).toThrow("GlPopoverContent");
  });

  it("supports DOM refs and typed trigger combinations", () => {
    const triggers = ["hover", "focus", "click"] as const satisfies GlPopoverTriggers;
    const markup = renderToStaticMarkup(
      <GlPopover triggers={triggers}>
        <GlPopoverTrigger ref={createRef<HTMLElement>()} category="tertiary" size="small">Trigger</GlPopoverTrigger>
        <GlPopoverContent ref={createRef<HTMLDivElement>()}>
          <GlPopoverTitle ref={createRef<HTMLHeadingElement>()}>Title</GlPopoverTitle>
        </GlPopoverContent>
      </GlPopover>,
    );

    expect(markup).toContain("btn-sm");
    expect(markup).toContain("btn-default-tertiary");
    expectTypeOf<"title">().not.toExtend<keyof GlPopoverContentProps>();
    expectTypeOf<"manual">().toExtend<GlPopoverTriggers>();
  });
});

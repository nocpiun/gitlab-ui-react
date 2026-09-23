import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlPopover, {
  GlPopoverBody,
  GlPopoverClose,
  GlPopoverContent,
  GlPopoverHeader,
  GlPopoverTitle,
  GlPopoverTrigger,
} from "./popover";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/icons.svg" }));

describe("GlPopover", () => {
  it("renders a button trigger with dialog semantics while closed", () => {
    const markup = renderToStaticMarkup(
      <GlPopover>
        <GlPopoverTrigger>Details</GlPopoverTrigger>
        <GlPopoverContent><GlPopoverBody>More details</GlPopoverBody></GlPopoverContent>
      </GlPopover>,
    );

    expect(markup).toContain("<button");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).not.toContain("More details");
  });

  it("accepts composed content without placing it in the closed DOM", () => {
    const markup = renderToStaticMarkup(
      <GlPopover>
        <GlPopoverTrigger>Details</GlPopoverTrigger>
        <GlPopoverContent className="custom-popover" placement="right">
          <GlPopoverHeader>
            <GlPopoverTitle>Popover title</GlPopoverTitle>
            <GlPopoverClose />
          </GlPopoverHeader>
          <GlPopoverBody>More details</GlPopoverBody>
        </GlPopoverContent>
      </GlPopover>,
    );

    expect(markup).not.toContain("Popover title");
    expect(markup).not.toContain("More details");
  });
});

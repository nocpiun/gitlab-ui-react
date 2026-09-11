/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/modal/modal.spec.js
 *
 * Portal DOM and interactions are covered by Storybook play functions because
 * unit tests run in a node environment.
 */

import {
  Fragment,
  createRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlButton from "../button/button";
import GlModal, {
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
  getModalAccessibleNameProps,
  getModalDialogClassName,
  getModalProviderKey,
  resolveModalContent,
  resolveModalFooter,
  resolveModalHeader,
  type GlModalCloseProps,
  type GlModalContentProps,
  type GlModalSize,
} from "./modal";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultContent = (
  <>
    <GlModalHeader>
      <GlModalTitle>Modal title</GlModalTitle>
    </GlModalHeader>
    <div>Modal body</div>
    <GlModalFooter>
      <GlModalClose>Cancel</GlModalClose>
    </GlModalFooter>
  </>
);

function renderModal(
  children: ReactNode = defaultContent,
  props: Partial<ComponentProps<typeof GlModal>> = {},
  contentProps: Partial<GlModalContentProps> = {},
) {
  return renderToStaticMarkup(
    <GlModal {...props}>
      <GlModalTrigger asChild>
        <button type="button">Open modal</button>
      </GlModalTrigger>
      <GlModalContent {...contentProps}>{children}</GlModalContent>
    </GlModal>,
  );
}

describe("GlModal", () => {
  it("renders text inside a GitLab-styled default trigger", () => {
    const markup = renderToStaticMarkup(
      <GlModal>
        <GlModalTrigger category="tertiary" variant="confirm">
          Open default modal
        </GlModalTrigger>
      </GlModal>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("gl-button");
    expect(markup).toContain("btn-confirm-tertiary");
    expect(markup).toContain("Open default modal");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
  });

  it("composes the child element as a dialog trigger", () => {
    const markup = renderModal();

    expect(markup).toContain("<button");
    expect(markup).toContain("Open modal</button>");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).not.toContain("aria-expanded=\"true\"");
  });

  it("merges trigger and child styles in asChild mode", () => {
    const markup = renderToStaticMarkup(
      <GlModal>
        <GlModalTrigger
          asChild
          className="trigger-class"
          style={{ backgroundColor: "red", color: "red" }}>
          <button
            className="child-class"
            style={{ color: "blue" }}
            type="button">
            Styled modal
          </button>
        </GlModalTrigger>
      </GlModal>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("child-class trigger-class");
    expect(markup).toContain("background-color:red;color:blue");
  });

  it("composes with GlButton as a single styled control", () => {
    const markup = renderToStaticMarkup(
      <GlModal>
        <GlModalTrigger asChild className="trigger-class">
          <GlButton className="child-class" variant="danger">
            Delete from modal
          </GlButton>
        </GlModalTrigger>
      </GlModal>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("child-class trigger-class");
    expect(markup).toContain("btn-danger");
  });

  it("accepts uncontrolled and controlled open state without changing hydration-safe SSR", () => {
    expect(renderModal(undefined, { defaultOpen: true })).toContain(
      "aria-expanded=\"false\"",
    );
    expect(renderModal(undefined, { defaultOpen: true, open: false })).toContain(
      "aria-expanded=\"false\"",
    );
    expect(renderModal(undefined, { open: true })).toContain("aria-expanded=\"false\"");
  });

  it("allows both root compound parts to be omitted", () => {
    expect(renderToStaticMarkup(<GlModal />)).toBe("");
    expect(renderToStaticMarkup(
      <GlModal>
        <GlModalTrigger asChild><button type="button">Open</button></GlModalTrigger>
      </GlModal>,
    )).toContain("Open");
  });

  it("supports arrays, Fragments, and conditional root children", () => {
    const showContent = true;
    const markup = renderToStaticMarkup(
      <GlModal>
        <Fragment>
          <GlModalTrigger asChild><button type="button">Open</button></GlModalTrigger>
          {showContent && (
            <GlModalContent aria-label="Modal">
              <GlModalHeader />
            </GlModalContent>
          )}
        </Fragment>
      </GlModal>,
    );

    expect(markup).toContain("Open");
  });

  it("accepts supporting content, wrapped triggers, and multiple triggers", () => {
    function WrappedTrigger() {
      return (
        <GlModalTrigger asChild>
          <button type="button">Wrapped trigger</button>
        </GlModalTrigger>
      );
    }

    const markup = renderToStaticMarkup(
      <GlModal>
        <span>Supporting content</span>
        <WrappedTrigger />
        <GlModalTrigger asChild><button type="button">Direct trigger</button></GlModalTrigger>
      </GlModal>,
    );

    expect(markup).toContain("Supporting content");
    expect(markup).toContain("Wrapped trigger");
    expect(markup).toContain("Direct trigger");
    expect(markup.match(/<button/g)).toHaveLength(2);
  });

  it("rejects duplicate root content", () => {
    expect(() => renderToStaticMarkup(
      <GlModal>
        <GlModalContent aria-label="One"><GlModalHeader /></GlModalContent>
        <GlModalContent aria-label="Two"><GlModalHeader /></GlModalContent>
      </GlModal>,
    )).toThrowError("GlModal accepts at most one GlModalContent child.");
  });

  it("requires every structural part to be in its documented context", () => {
    expect(() => renderToStaticMarkup(
      <GlModalTrigger asChild><button type="button">Open</button></GlModalTrigger>,
    )).toThrowError("GlModalTrigger must be used inside GlModal.");
    expect(() => renderToStaticMarkup(
      <GlModalContent aria-label="Modal"><GlModalHeader /></GlModalContent>,
    )).toThrowError("GlModalContent must be used inside GlModal.");
    expect(() => renderToStaticMarkup(<GlModalHeader />)).toThrowError(
      "GlModalHeader must be used as a direct child of GlModalContent.",
    );
    expect(() => renderToStaticMarkup(<GlModalTitle>Title</GlModalTitle>)).toThrowError(
      "GlModalTitle must be used as a direct child of GlModalHeader.",
    );
    expect(() => renderToStaticMarkup(<GlModalFooter />)).toThrowError(
      "GlModalFooter must be used as a direct child of GlModalContent.",
    );
    expect(() => renderToStaticMarkup(<GlModalClose>Close</GlModalClose>)).toThrowError(
      "GlModalClose must be used as a direct child of GlModalFooter.",
    );
  });

  it("accepts refs for the trigger, content, and each structural part", () => {
    const triggerRef = createRef<HTMLElement>();
    const contentRef = createRef<HTMLDivElement>();
    const headerRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const footerRef = createRef<HTMLDivElement>();
    const closeRef = createRef<HTMLButtonElement>();

    expect(() => renderToStaticMarkup(
      <GlModal>
        <GlModalTrigger ref={triggerRef} asChild>
          <button type="button">Open</button>
        </GlModalTrigger>
        <GlModalContent ref={contentRef} title="Modal content">
          <GlModalHeader ref={headerRef} title="Modal header">
            <GlModalTitle ref={titleRef}>Title</GlModalTitle>
          </GlModalHeader>
          Body
          <GlModalFooter ref={footerRef} title="Modal footer">
            <GlModalClose ref={closeRef}>Close</GlModalClose>
          </GlModalFooter>
        </GlModalContent>
      </GlModal>,
    )).not.toThrow();
  });

  it("exposes the documented content, close-button, and size types", () => {
    expectTypeOf<GlModalContentProps["size"]>()
      .toEqualTypeOf<GlModalSize | undefined>();
    expectTypeOf<GlModalContentProps["scrollable"]>()
      .toEqualTypeOf<boolean | undefined>();
    expectTypeOf<GlModalCloseProps["category"]>()
      .toEqualTypeOf<"primary" | "secondary" | "tertiary" | undefined>();
    expectTypeOf<"href" extends keyof GlModalCloseProps ? true : false>()
      .toEqualTypeOf<false>();
  });
});

describe("modal content composition", () => {
  it("extracts header and footer while retaining arbitrary body nodes", () => {
    const content = resolveModalContent(
      <>
        <div>First body item</div>
        <GlModalFooter>Footer</GlModalFooter>
        body text
        <GlModalHeader><GlModalTitle>Title</GlModalTitle></GlModalHeader>
      </>,
    );

    expect(content.header.type).toBe(GlModalHeader);
    expect(content.footer?.type).toBe(GlModalFooter);
    expect(content.body).toHaveLength(2);
  });

  it("requires exactly one header while keeping the footer optional", () => {
    expect(() => resolveModalContent(<div>Body only</div>)).toThrowError(
      "GlModalContent requires exactly one GlModalHeader child.",
    );

    const content = resolveModalContent(
      <>
        <GlModalHeader><GlModalTitle>Title</GlModalTitle></GlModalHeader>
        <div>Body only</div>
      </>,
    );

    expect(content.header.type).toBe(GlModalHeader);
    expect(content.footer).toBeNull();
    expect(content.body).toHaveLength(1);
  });

  it("rejects duplicate header and footer parts", () => {
    expect(() => resolveModalContent(
      <>
        <GlModalHeader />
        <GlModalHeader />
      </>,
    )).toThrowError("GlModalContent accepts exactly one GlModalHeader child.");
    expect(() => resolveModalContent(
      <>
        <GlModalHeader />
        <GlModalFooter />
        <GlModalFooter />
      </>,
    )).toThrowError("GlModalContent accepts at most one GlModalFooter child.");
  });

  it("rejects header and footer parts at the content level", () => {
    expect(() => resolveModalContent(
      <>
        <GlModalHeader />
        <GlModalTitle>Wrong level</GlModalTitle>
      </>,
    )).toThrowError("GlModalTitle belongs directly inside GlModalHeader");
    expect(() => resolveModalContent(
      <>
        <GlModalHeader />
        <GlModalClose>Wrong level</GlModalClose>
      </>,
    )).toThrowError("GlModalClose belongs directly inside GlModalFooter");
  });

  it("requires an accessible name from a title, aria-label, or aria-labelledby", () => {
    expect(() => renderModal(
      <>
        <GlModalHeader />
        <div>Body</div>
      </>,
    )).toThrowError(
      "GlModalContent requires a non-empty GlModalTitle, a non-empty aria-label, "
      + "or a non-empty aria-labelledby.",
    );
    expect(() => renderModal(
      <>
        <GlModalHeader />
        <div>Body</div>
      </>,
      {},
      { "aria-label": "   ", "aria-labelledby": "   " },
    )).toThrowError("non-empty aria-labelledby");
    expect(() => renderModal(
      <>
        <GlModalHeader />
        <div>Body</div>
      </>,
      {},
      { "aria-label": "Named modal" },
    )).not.toThrow();
    expect(() => renderModal(
      <>
        <GlModalHeader />
        <div>Body</div>
      </>,
      {},
      { "aria-labelledby": "external-heading" },
    )).not.toThrow();
  });

  it.each([
    ["empty", null],
    ["whitespace-only", "   "],
    ["conditionally absent", false],
  ] as const)("rejects a %s title without an explicit label", (_description, title) => {
    expect(() => renderModal(
      <>
        <GlModalHeader><GlModalTitle>{title}</GlModalTitle></GlModalHeader>
        <div>Body</div>
      </>,
    )).toThrowError("requires a non-empty GlModalTitle");
  });

  it("accepts nested title text and explicit labels for otherwise empty titles", () => {
    expect(() => renderModal(
      <>
        <GlModalHeader>
          <GlModalTitle><span>Nested modal title</span></GlModalTitle>
        </GlModalHeader>
        <div>Body</div>
      </>,
    )).not.toThrow();
    expect(() => renderModal(
      <>
        <GlModalHeader><GlModalTitle /></GlModalHeader>
        <div>Body</div>
      </>,
      {},
      { "aria-label": "Explicit modal label" },
    )).not.toThrow();
  });

  it("normalizes accessible-name overrides while preserving Base UI title labelling", () => {
    expect(getModalAccessibleNameProps(true, "   ", undefined)).toEqual({});
    expect(getModalAccessibleNameProps(true, undefined, "   ")).toEqual({});
    expect(getModalAccessibleNameProps(false, undefined, "external-heading")).toEqual({
      "aria-labelledby": "external-heading",
    });
    expect(getModalAccessibleNameProps(true, "Named modal", "external-heading"))
      .toEqual({
        "aria-label": "Named modal",
        "aria-labelledby": undefined,
      });
  });
});

describe("modal header and footer composition", () => {
  it("preserves explicit child identity for context provider keys", () => {
    expect(getModalProviderKey(<GlButton key="action">Action</GlButton>, 0))
      .toBe("child:action");
    expect(getModalProviderKey(<GlButton>Action</GlButton>, 2)).toBe("index:2");
    expect(getModalProviderKey("Text", 3)).toBe("index:3");
  });

  it("allows custom header content and at most one title", () => {
    const header = resolveModalHeader(
      <>
        <span>Prefix</span>
        <GlModalTitle>Title</GlModalTitle>
        suffix
      </>,
    );

    expect(header.title?.type).toBe(GlModalTitle);
    expect(header.children).toHaveLength(3);
    expect(() => resolveModalHeader(
      <>
        <GlModalTitle>One</GlModalTitle>
        <GlModalTitle>Two</GlModalTitle>
      </>,
    )).toThrowError("GlModalHeader accepts at most one GlModalTitle child.");
    expect(() => resolveModalHeader(<GlModalClose>Wrong level</GlModalClose>))
      .toThrowError("The header close button is rendered automatically.");
  });

  it("allows ordinary footer actions and repeated close buttons", () => {
    const footer = resolveModalFooter(
      <>
        <GlModalClose>Cancel</GlModalClose>
        <GlModalClose category="secondary" variant="confirm">Discard</GlModalClose>
        <GlButton variant="confirm">Save</GlButton>
      </>,
    );

    expect(footer.children).toHaveLength(3);
    expect(() => resolveModalFooter(<GlModalTitle>Wrong level</GlModalTitle>))
      .toThrowError("other Modal compound parts are not allowed.");
  });
});

describe("modal variants", () => {
  it.each<GlModalSize>(["sm", "md", "lg"])("applies the %s size", (size) => {
    expect(getModalDialogClassName(size, false)).toBe(`gl-modal-dialog gl-modal-${size}`);
  });

  it("adds the internal-scrolling class", () => {
    expect(getModalDialogClassName("md", true)).toBe(
      "gl-modal-dialog gl-modal-dialog-scrollable gl-modal-md",
    );
  });
});

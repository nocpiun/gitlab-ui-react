/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/breadcrumb/breadcrumb.spec.js
 * packages/gitlab-ui/src/components/base/breadcrumb/breadcrumb_item.spec.js
 *
 * Browser-only resizing, disclosure, and clipboard interactions are covered by
 * the colocated Storybook play functions.
 */

import {
  Fragment,
  createRef,
  forwardRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlBreadcrumb, {
  GlBreadcrumbItem,
  calculateBreadcrumbLayout,
  resolveBreadcrumbClipboardText,
  type GlBreadcrumbItemProps,
  type GlBreadcrumbSize,
} from "./breadcrumb";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  to: string;
};

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  to,
  ...anchorProps
}, forwardedRef) {
  return <a {...anchorProps} ref={forwardedRef} href={to} />;
});

const defaultItems = (
  <>
    <GlBreadcrumbItem href="/group">Group</GlBreadcrumbItem>
    <GlBreadcrumbItem href="/group/project">Project</GlBreadcrumbItem>
    <GlBreadcrumbItem href="/group/project/issues">Issues</GlBreadcrumbItem>
  </>
);

function renderBreadcrumb(
  props: Partial<ComponentProps<typeof GlBreadcrumb>> = {},
  children: ReactNode = defaultItems,
) {
  return renderToStaticMarkup(
    <GlBreadcrumb {...props}>{children as never}</GlBreadcrumb>,
  );
}

describe("GlBreadcrumb", () => {
  it("renders the accessible navigation and ordered-list structure", () => {
    const markup = renderBreadcrumb({ autoResize: false });

    expect(markup).toMatch(/^<nav/u);
    expect(markup).toContain("aria-label=\"Breadcrumb\"");
    expect(markup).toContain("class=\"gl-breadcrumbs\"");
    expect(markup).toContain("<ol class=\"gl-breadcrumb-list breadcrumb\">");
    expect(markup.match(/<li class="gl-breadcrumb-item gl-breadcrumb-item-sm/g)).toHaveLength(3);
    expect(markup.match(/aria-current="page"/gu)).toHaveLength(1);
    expect(markup).toMatch(/aria-current="page"[^>]*>.*Issues/u);
  });

  it("applies native nav props, merged styles, and a custom accessible label", () => {
    const markup = renderBreadcrumb({
      "aria-label": "Project location",
      autoResize: false,
      className: "custom-breadcrumb",
      style: { color: "red" },
      title: "Hierarchy",
    });

    expect(markup).toContain("aria-label=\"Project location\"");
    expect(markup).toContain("class=\"gl-breadcrumbs custom-breadcrumb\"");
    expect(markup).toContain("style=\"color:red\"");
    expect(markup).toContain("title=\"Hierarchy\"");
  });

  it("renders item text, decorative avatars, and the inherited size", () => {
    const smallMarkup = renderBreadcrumb(
      { autoResize: false },
      <GlBreadcrumbItem avatarPath="/avatar.png" href="/group">Group</GlBreadcrumbItem>,
    );
    const mediumMarkup = renderBreadcrumb(
      { autoResize: false, size: "md" },
      <GlBreadcrumbItem avatarPath="/avatar.png" href="/group">Group</GlBreadcrumbItem>,
    );

    expect(smallMarkup).toContain("gl-breadcrumb-item-sm");
    expect(smallMarkup).toContain("gl-avatar-s16");
    expect(smallMarkup).toContain("aria-hidden=\"true\"");
    expect(smallMarkup).toContain("alt=\"\"");
    expect(smallMarkup).toContain("src=\"/avatar.png\"");
    expect(mediumMarkup).toContain("gl-breadcrumb-item-md");
    expect(mediumMarkup).toContain("gl-avatar-s24");
  });

  it("applies native item props and marks a single item for truncation", () => {
    const markup = renderBreadcrumb(
      { autoResize: false },
      <GlBreadcrumbItem
        className="custom-item"
        href="/group"
        id="group-crumb"
        title="Group location">
        Group
      </GlBreadcrumbItem>,
    );

    expect(markup).toContain("id=\"group-crumb\"");
    expect(markup).toContain("title=\"Group location\"");
    expect(markup).toContain(
      "class=\"gl-breadcrumb-item gl-breadcrumb-only-item gl-breadcrumb-item-sm custom-item\"",
    );
  });

  it("uses GlLink URL safety and router render composition", () => {
    const unsafeMarkup = renderBreadcrumb(
      { autoResize: false },
      <GlBreadcrumbItem href="javascript:alert(1)">Unsafe</GlBreadcrumbItem>,
    );
    const routerMarkup = renderBreadcrumb(
      { autoResize: false },
      <GlBreadcrumbItem render={<RouterLink data-router-link="" to="/projects" />}>
        Projects
      </GlBreadcrumbItem>,
    );

    expect(unsafeMarkup).toContain("href=\"about:blank\"");
    expect(routerMarkup).toContain("data-router-link=\"\"");
    expect(routerMarkup).toContain("href=\"/projects\"");
    expect(routerMarkup).toContain("aria-current=\"page\"");
  });

  it("supports arrays, Fragments, conditional items, and an empty breadcrumb", () => {
    const visible = true;
    const markup = renderBreadcrumb({ autoResize: false }, [
      <GlBreadcrumbItem href="/one" key="one">One</GlBreadcrumbItem>,
      false,
      <Fragment key="remaining">
        {visible && <GlBreadcrumbItem href="/two">Two</GlBreadcrumbItem>}
        <GlBreadcrumbItem href="/three">Three</GlBreadcrumbItem>
      </Fragment>,
    ]);
    const emptyMarkup = renderBreadcrumb({}, null);

    expect(markup.match(/<li class="gl-breadcrumb-item/gu)).toHaveLength(3);
    expect(emptyMarkup).toContain("<ol class=\"gl-breadcrumb-list breadcrumb\"></ol>");
    expect(emptyMarkup).not.toContain("style=\"opacity:0\"");
    expect(emptyMarkup).not.toContain("Show more breadcrumbs");
  });

  it("rejects unsupported and opaque direct children", () => {
    function ItemGroup() {
      return <GlBreadcrumbItem href="/group">Group</GlBreadcrumbItem>;
    }

    expect(() => renderBreadcrumb({}, <span>Invalid</span>)).toThrowError(
      "GlBreadcrumb only accepts GlBreadcrumbItem as direct children.",
    );
    expect(() => renderBreadcrumb({}, <ItemGroup />)).toThrowError(
      "GlBreadcrumb only accepts GlBreadcrumbItem as direct children.",
    );
  });

  it("requires GlBreadcrumbItem to be used inside GlBreadcrumb", () => {
    expect(() => renderToStaticMarkup(
      <GlBreadcrumbItem href="/group">Group</GlBreadcrumbItem>,
    )).toThrowError("GlBreadcrumbItem must be used as a child of GlBreadcrumb.");
  });

  it("accepts refs for the nav and item elements", () => {
    const breadcrumbRef = createRef<HTMLElement>();
    const itemRef = createRef<HTMLLIElement>();

    expect(() => renderToStaticMarkup(
      <GlBreadcrumb ref={breadcrumbRef} autoResize={false}>
        <GlBreadcrumbItem ref={itemRef} href="/group">Group</GlBreadcrumbItem>
      </GlBreadcrumb>,
    )).not.toThrow();
  });

  it("renders the hidden measurement state and configurable overflow trigger", () => {
    const defaultMarkup = renderBreadcrumb();
    const mediumMarkup = renderBreadcrumb({
      showMoreLabel: "More locations",
      size: "md",
    });
    const fixedMarkup = renderBreadcrumb({ autoResize: false });

    expect(defaultMarkup).toContain("style=\"opacity:0\"");
    expect(defaultMarkup).toContain("Show more breadcrumbs");
    expect(defaultMarkup).toContain("btn-sm");
    expect(defaultMarkup).toContain("ellipsis_h-icon");
    expect(mediumMarkup).toContain("More locations");
    expect(mediumMarkup).toContain("btn-md");
    expect(fixedMarkup).not.toContain("Show more breadcrumbs");
  });

  it("renders the optional clipboard control with default and custom labels", () => {
    const defaultMarkup = renderBreadcrumb({
      autoResize: false,
      showClipboardButton: true,
    });
    const customMarkup = renderBreadcrumb({
      autoResize: false,
      clipboardTooltipText: "Copy project path",
      showClipboardButton: true,
      size: "md",
    });

    expect(defaultMarkup).toContain("gl-breadcrumb-clipboard-button");
    expect(defaultMarkup).toContain("aria-label=\"Copy to clipboard\"");
    expect(defaultMarkup).toContain("copy-to-clipboard-icon");
    expect(defaultMarkup).toContain("btn-sm");
    expect(customMarkup).toContain("aria-label=\"Copy project path\"");
    expect(customMarkup).toContain("btn-md");
  });

  it("exposes the documented closed types", () => {
    expectTypeOf<GlBreadcrumbSize>().toEqualTypeOf<"sm" | "md">();
    expectTypeOf<GlBreadcrumbItemProps["children"]>().toEqualTypeOf<string>();
    expectTypeOf<"aria-current" extends keyof GlBreadcrumbItemProps ? true : false>()
      .toEqualTypeOf<false>();
  });
});

describe("calculateBreadcrumbLayout", () => {
  it("keeps all items visible when they fit", () => {
    expect(calculateBreadcrumbLayout([100, 100, 100], 1000, 40, 0)).toEqual({
      collapsedCount: 0,
      truncatedItemMaxWidth: 960,
    });
  });

  it("collapses leading items while always retaining the final item", () => {
    expect(calculateBreadcrumbLayout([100, 100, 100], 250, 40, 0)).toEqual({
      collapsedCount: 1,
      truncatedItemMaxWidth: 210,
    });
    expect(calculateBreadcrumbLayout([100, 100, 100], 100, 40, 0)).toEqual({
      collapsedCount: 2,
      truncatedItemMaxWidth: 60,
    });
  });

  it("accounts for clipboard width and clamps the truncation width to zero", () => {
    expect(calculateBreadcrumbLayout([100, 100, 100], 250, 40, 38)).toEqual({
      collapsedCount: 2,
      truncatedItemMaxWidth: 172,
    });
    expect(calculateBreadcrumbLayout([100], 30, 40, 8)).toEqual({
      collapsedCount: 0,
      truncatedItemMaxWidth: 0,
    });
  });
});

describe("resolveBreadcrumbClipboardText", () => {
  it("joins item text with slashes and lets a non-empty custom path override it", () => {
    const itemTexts = ["GitLab.org", "GitLab", "Issues", "#1234"];

    expect(resolveBreadcrumbClipboardText(itemTexts)).toBe("GitLab.org/GitLab/Issues/#1234");
    expect(resolveBreadcrumbClipboardText(itemTexts, "/groups/gitlab/issues/1234"))
      .toBe("/groups/gitlab/issues/1234");
    expect(resolveBreadcrumbClipboardText(itemTexts, "")).toBe(
      "GitLab.org/GitLab/Issues/#1234",
    );
  });
});

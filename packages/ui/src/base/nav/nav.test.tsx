/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/nav_item/nav_item.spec.js
 *
 * Browser activation, keyboard behavior, and independent disclosure state are
 * covered by the colocated Storybook play functions.
 */

import { Fragment, createRef, forwardRef, type ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlAvatar from "../avatar/avatar";
import GlIcon from "../icon/icon";
import GlNav, {
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "./nav";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const navItemClass = ["gl", "nav", "item"].join("-");

type NavItemStateProps = Pick<
  ComponentPropsWithoutRef<typeof GlNavItem>,
  "indicatorPosition" | "selected"
>;

function renderButton(button: React.ReactElement, itemProps: NavItemStateProps = {}) {
  return renderToStaticMarkup(
    <GlNav aria-label="Project navigation">
      <GlNavItem {...itemProps}>{button}</GlNavItem>
    </GlNav>,
  );
}

function parentNav(defaultOpen = false, addon?: React.ReactNode, disabled = false) {
  return (
    <GlNav aria-label="Project navigation">
      <GlNavItem>
        <GlNavButton disabled={disabled}>
          Parent
          {addon}
        </GlNavButton>
        <GlSubNav defaultOpen={defaultOpen} data-subnav="true">
          <GlSubNavItem>
            <GlSubNavButton href="/child">Child</GlSubNavButton>
          </GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  );
}

const RouterLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(
  function RouterLink(props, ref) {
    return <a {...props} ref={ref} data-router-link="true" />;
  },
);

describe("GlNav composition", () => {
  it("renders nav > ul > li > button without composition wrappers", () => {
    const markup = renderButton(<GlNavButton id="issues">Issues</GlNavButton>);

    expect(markup).toMatch(/^<nav[^>]*><ul[^>]*><li[^>]*><button/u);
    expect(markup).toContain("type=\"button\"");
    expect(markup).toContain("id=\"issues\"");
    expect(markup).not.toContain("<div");
  });

  it("supports arrays, fragments, and conditional children at composition boundaries", () => {
    const items = [
      <GlNavItem key="issues"><GlNavButton>Issues</GlNavButton></GlNavItem>,
      <GlNavItem key="code"><GlNavButton>Code</GlNavButton></GlNavItem>,
    ];
    const markup = renderToStaticMarkup(
      <GlNav><Fragment>{false}{items}</Fragment></GlNav>,
    );

    expect(markup.match(/class="gl-nav-list-item"/gu)).toHaveLength(2);
  });

  it("renders a nested list without an extra Collapsible element", () => {
    const markup = renderToStaticMarkup(parentNav(true));

    expect(markup).toMatch(/<li[^>]*><button[^>]*aria-expanded="true"/u);
    expect(markup).toMatch(/<ul[^>]*data-subnav="true"[^>]*><li[^>]*><a/u);
    expect(markup).not.toContain("<div");
  });

  it("uses the controlled GlSubNav open state without leaking control props to the list", () => {
    const markup = renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton>Parent</GlNavButton>
          <GlSubNav defaultOpen={false} onOpenChange={() => undefined} open data-subnav="true">
            <GlSubNavItem>
              <GlSubNavButton href="/child">Child</GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>,
    );

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("data-subnav=\"true\"");
    expect(markup).not.toContain("onOpenChange");
    expect(markup).not.toMatch(/<ul[^>]*\sopen=/u);
  });

  it("accepts refs for all public DOM-owning components", () => {
    const navRef = createRef<HTMLElement>();
    const itemRef = createRef<HTMLLIElement>();
    const buttonRef = createRef<HTMLElement>();
    const subNavRef = createRef<HTMLUListElement>();
    const subItemRef = createRef<HTMLLIElement>();
    const subButtonRef = createRef<HTMLElement>();
    const addonRef = createRef<HTMLSpanElement>();

    expect(() => renderToStaticMarkup(
      <GlNav ref={navRef}>
        <GlNavItem ref={itemRef}>
          <GlNavButton ref={buttonRef}>Parent</GlNavButton>
          <GlSubNav ref={subNavRef} defaultOpen>
            <GlSubNavItem ref={subItemRef}>
              <GlSubNavButton ref={subButtonRef}>
                Child
                <GlNavItemAddon ref={addonRef}>1</GlNavItemAddon>
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>,
    )).not.toThrow();
  });
});

describe("GlNavButton", () => {
  it("uses GlLink only for a non-empty href", () => {
    const linkMarkup = renderButton(<GlNavButton href="/issues">Issues</GlNavButton>);
    const emptyHrefMarkup = renderButton(<GlNavButton href="">Issues</GlNavButton>);

    expect(linkMarkup).toContain("<a");
    expect(linkMarkup).toContain("href=\"/issues\"");
    expect(emptyHrefMarkup).toContain("<button");
    expect(emptyHrefMarkup).not.toContain("<a");
  });

  it("composes a router link without adding a second anchor", () => {
    const markup = renderButton(
      <GlNavButton render={<RouterLink href="/router-issues" />}>Issues</GlNavButton>,
    );

    expect(markup.match(/<a\b/gu)).toHaveLength(1);
    expect(markup).toContain("data-router-link=\"true\"");
  });

  it("uses GlLink URL safety and preserves native link attributes", () => {
    const safeMarkup = renderButton(
      <GlNavButton
        download="issues.csv"
        href="javascript:alert(1)"
        rel="author"
        target="_blank">
        Issues
      </GlNavButton>,
    );
    const unsafeMarkup = renderButton(
      <GlNavButton href="custom:issues" isUnsafeLink>Unsafe opt-in</GlNavButton>,
    );

    expect(safeMarkup).toContain("href=\"about:blank\"");
    expect(safeMarkup).toContain("download=\"issues.csv\"");
    expect(safeMarkup).toContain("rel=\"author noopener noreferrer\"");
    expect(unsafeMarkup).toContain("href=\"custom:issues\"");
  });

  it("applies item selection and aria-current only to links", () => {
    const linkMarkup = renderButton(
      <GlNavButton href="/issues">Issues</GlNavButton>,
      { selected: true },
    );
    const buttonMarkup = renderButton(<GlNavButton>Issues</GlNavButton>, { selected: true });

    expect(linkMarkup).toContain(
      `class="${navItemClass} gl-nav-item-indicator-left selected"`,
    );
    expect(linkMarkup).toContain("aria-current=\"page\"");
    expect(buttonMarkup).toContain("selected");
    expect(buttonMarkup).not.toContain("aria-current");
  });

  it.each(["left", "right", "bottom"] as const)(
    "supports the %s selected indicator",
    (indicatorPosition) => {
      expect(renderButton(
        <GlNavButton>Issues</GlNavButton>,
        { indicatorPosition, selected: true },
      )).toContain(`gl-nav-item-indicator-${indicatorPosition}`);
    },
  );

  it("applies selection state from GlSubNavItem to its link", () => {
    const markup = renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton>Parent</GlNavButton>
          <GlSubNav defaultOpen>
            <GlSubNavItem indicatorPosition="right" selected>
              <GlSubNavButton href="/child">Child</GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>,
    );

    expect(markup).toContain("gl-nav-item-indicator-right");
    expect(markup).toContain("gl-sub-nav-button selected");
    expect(markup).toContain("aria-current=\"page\"");
  });

  it("renders direct icon, label, and addon slots inside the same link", () => {
    const markup = renderButton(
      <GlNavButton href="/issues">
        <Fragment>
          <GlIcon name="issues" />
          Issues
          {true && <GlNavItemAddon className="count">12</GlNavItemAddon>}
        </Fragment>
      </GlNavButton>,
    );

    expect(markup).toContain("gl-nav-item-has-start-slot");
    expect(markup).toContain("gl-nav-item-has-end-slot");
    expect(markup).toMatch(
      /<a[^>]*>[\s\S]*data-testid="nav-item-start"[\s\S]*data-testid="nav-item-label"[\s\S]*data-testid="nav-item-end"[\s\S]*<\/a>/u,
    );
    expect(markup).toContain("class=\"gl-nav-item-slot count\"");
    expect(markup).toContain(">12</span>");
  });

  it("recognizes GlAvatar as the direct leading content", () => {
    const markup = renderButton(
      <GlNavButton><GlAvatar entityName="Project" size={24} />Project</GlNavButton>,
    );

    expect(markup).toContain("gl-nav-item-has-start-slot");
    expect(markup).toContain("gl-avatar-s24");
  });

  it("keeps a wrapped icon in the label instead of treating it as leading", () => {
    const markup = renderButton(
      <GlNavButton><span><GlIcon name="issues" /></span>Issues</GlNavButton>,
    );

    expect(markup).not.toContain("data-testid=\"nav-item-start\"");
    expect(markup).toContain("data-testid=\"nav-item-label\"");
  });

  it("preserves addon ARIA attributes so decorative text can be hidden", () => {
    const markup = renderButton(
      <GlNavButton>
        Issues
        <GlNavItemAddon aria-hidden="true" aria-label="ignored">12</GlNavItemAddon>
      </GlNavButton>,
    );

    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).toContain("aria-label=\"ignored\"");
  });

  it("icon-only output removes the label, addon, and parent chevron", () => {
    const markup = renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton aria-label="Issues" isIconOnly>
            <GlIcon name="issues" />
            Issues
            <GlNavItemAddon>12</GlNavItemAddon>
          </GlNavButton>
          <GlSubNav defaultOpen>
            <GlSubNavItem><GlSubNavButton>Child</GlSubNavButton></GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>,
    );
    const parentButton = markup.match(/<button[\s\S]*?<\/button>/u)?.[0] ?? "";

    expect(markup).toContain("aria-label=\"Issues\"");
    expect(markup).toContain("gl-nav-item-is-icon-only");
    expect(parentButton).not.toContain("data-testid=\"nav-item-label\"");
    expect(parentButton).not.toContain("data-testid=\"nav-item-end\"");
    expect(parentButton).not.toContain("data-testid=\"nav-item-chevron\"");
  });
});

describe("GlSubNav", () => {
  it("is initially closed and owns its automatic chevron", () => {
    const markup = renderToStaticMarkup(parentNav());

    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("data-testid=\"nav-item-chevron\"");
    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).not.toContain("defaultOpen");
  });

  it("honors defaultOpen on GlSubNav and applies sub-navigation indentation", () => {
    const markup = renderToStaticMarkup(parentNav(true));

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("gl-sub-nav-button");
    expect(markup).not.toContain("defaultOpen");
  });

  it("treats an empty parent href as a native disclosure button", () => {
    const markup = renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton href="">Parent</GlNavButton>
          <GlSubNav>
            <GlSubNavItem><GlSubNavButton>Child</GlSubNavButton></GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>,
    );

    expect(markup).toMatch(/<li[^>]*><button[^>]*aria-expanded="false"/u);
    expect(markup).not.toContain("<a");
  });

  it("uses an explicit addon instead of the automatic chevron", () => {
    const markup = renderToStaticMarkup(
      parentNav(false, <GlNavItemAddon>3</GlNavItemAddon>),
    );

    expect(markup).toContain("data-testid=\"nav-item-end\"");
    expect(markup).not.toContain("data-testid=\"nav-item-chevron\"");
  });

  it("forwards disabled state to the trigger", () => {
    const markup = renderToStaticMarkup(parentNav(false, undefined, true));

    expect(markup).toContain("disabled=\"\"");
    expect(markup).toContain("data-disabled=\"\"");
  });
});

describe("composition errors", () => {
  it("rejects non-item children of GlNav", () => {
    expect(() => renderToStaticMarkup(<GlNav><span>Wrong</span></GlNav>))
      .toThrow("[GlNav] only accepts GlNavItem children.");
  });

  it("rejects missing and repeated root buttons", () => {
    expect(() => renderToStaticMarkup(
      <GlNav><GlNavItem><GlSubNav /></GlNavItem></GlNav>,
    )).toThrow("requires exactly one GlNavButton");
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem><GlNavButton>One</GlNavButton><GlNavButton>Two</GlNavButton></GlNavItem>
      </GlNav>,
    )).toThrow("requires exactly one GlNavButton");
  });

  it("rejects repeated sub-navigation and the wrong item order", () => {
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton>Parent</GlNavButton>
          <GlSubNav />
          <GlSubNav />
        </GlNavItem>
      </GlNav>,
    )).toThrow("accepts at most one GlSubNav");
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem><GlSubNav /><GlNavButton>Parent</GlNavButton></GlNavItem>
      </GlNav>,
    )).toThrow("GlNavButton must precede GlSubNav");
  });

  it("rejects a link or router link as a sub-navigation trigger", () => {
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton href="/parent">Parent</GlNavButton>
          <GlSubNav />
        </GlNavItem>
      </GlNav>,
    )).toThrow("cannot use href or render");
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton render={<RouterLink />}>Parent</GlNavButton>
          <GlSubNav />
        </GlNavItem>
      </GlNav>,
    )).toThrow("cannot use href or render");
  });

  it("rejects misplaced, repeated, and out-of-order addons", () => {
    expect(() => renderToStaticMarkup(
      <GlNav><GlNavItem><GlNavItemAddon>1</GlNavItemAddon></GlNavItem></GlNav>,
    )).toThrow("requires exactly one GlNavButton");
    expect(() => renderButton(
      <GlNavButton>
        Label
        <GlNavItemAddon>1</GlNavItemAddon>
        <GlNavItemAddon>2</GlNavItemAddon>
      </GlNavButton>,
    )).toThrow("accepts at most one GlNavItemAddon");
    expect(() => renderButton(
      <GlNavButton><GlNavItemAddon>1</GlNavItemAddon>Label</GlNavButton>,
    )).toThrow("GlNavItemAddon must be the last effective child");
    expect(() => renderButton(
      <GlNavButton><span><GlNavItemAddon>1</GlNavItemAddon></span></GlNavButton>,
    )).toThrow("GlNavItemAddon must be a direct child");
  });

  it("rejects a leading component after the label or another leading", () => {
    expect(() => renderButton(
      <GlNavButton>Issues<GlIcon name="issues" /></GlNavButton>,
    )).toThrow("must be the first effective child");
    expect(() => renderButton(
      <GlNavButton><GlIcon name="issues" /><GlAvatar entityName="A" />Issues</GlNavButton>,
    )).toThrow("may appear at most once");
  });

  it("rejects interactive addon descendants", () => {
    expect(() => renderButton(
      <GlNavButton>Issues<GlNavItemAddon><button type="button">2</button></GlNavItemAddon></GlNavButton>,
    )).toThrow("must not be interactive");
  });

  it("requires icon-only items to have a direct leading and aria-label", () => {
    expect(() => renderButton(<GlNavButton isIconOnly>Issues</GlNavButton>))
      .toThrow("requires a leading GlIcon or GlAvatar");
    expect(() => renderButton(
      <GlNavButton isIconOnly><GlIcon name="issues" /></GlNavButton>,
    )).toThrow("requires aria-label");
  });

  it("rejects invalid sub-navigation item children", () => {
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton>Parent</GlNavButton>
          <GlSubNav defaultOpen><span>Wrong</span></GlSubNav>
        </GlNavItem>
      </GlNav>,
    )).toThrow("[GlSubNav] only accepts GlSubNavItem children.");
    expect(() => renderToStaticMarkup(
      <GlNav>
        <GlNavItem>
          <GlNavButton>Parent</GlNavButton>
          <GlSubNav defaultOpen><GlSubNavItem>Missing</GlSubNavItem></GlSubNav>
        </GlNavItem>
      </GlNav>,
    )).toThrow("requires exactly one GlSubNavButton");
  });
});

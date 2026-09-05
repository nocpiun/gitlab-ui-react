import { Fragment, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlButton from "../button/button";
import GlTab from "./tab";
import GlTabs, {
  GlScrollableTabs,
  GlTabActions,
  GlTabsAfter,
  GlTabsBefore,
} from "./tabs";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultTabs = (
  <>
    <GlTab title="First">First panel</GlTab>
    <GlTab title="Second">Second panel</GlTab>
  </>
);

function renderTabs(
  props: Partial<ComponentProps<typeof GlTabs>> = {},
  children: ReactNode = defaultTabs,
) {
  return renderToStaticMarkup(<GlTabs {...props}>{children}</GlTabs>);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GlTabs", () => {
  it("renders the GitLab tab structure and forwards root attributes", () => {
    const markup = renderTabs({ className: "custom-root", title: "Example tabs" });

    expect(markup).toMatch(/^<div[^>]*class="tabs gl-tabs custom-root"/);
    expect(markup).toMatch(/<div[^>]*class="gl-tabs-wrapper"/);
    expect(markup).toMatch(/<ul[^>]*role="tablist"/);
    expect(markup).toMatch(/<ul[^>]*class="nav gl-tabs-nav"/);
    expect(markup).toContain("title=\"Example tabs\"");
    expect(markup.match(/role="tab"/g)).toHaveLength(2);
    expect(markup.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(markup).toContain("gl-tab-nav-item-active");
    expect(markup).toContain("aria-selected=\"true\"");
    expect(markup).toContain("aria-setsize=\"2\"");
    expect(markup).toContain("aria-posinset=\"1\"");
  });

  it("applies navigation, content, title item, title, and panel classes", () => {
    const markup = renderTabs(
      {
        contentClassName: ["custom-content", { "conditional-content": true }],
        navClassName: ["custom-nav", { "conditional-nav": true }],
      },
      <GlTab
        panelClassName={["custom-panel", { "conditional-panel": true }]}
        title="First"
        titleClassName={["custom-title", { "conditional-title": true }]}
        titleItemClassName={["custom-item", { "conditional-item": true }]}>
        First panel
      </GlTab>,
    );

    for(const className of [
      "custom-content",
      "conditional-content",
      "custom-nav",
      "conditional-nav",
      "custom-panel",
      "conditional-panel",
      "custom-title",
      "conditional-title",
      "custom-item",
      "conditional-item",
    ]) {
      expect(markup).toContain(className);
    }
  });

  it("renders justified tabs", () => {
    expect(renderTabs({ justified: true })).toContain("nav-justified");
  });

  it("forwards restricted attributes to the tab and panel", () => {
    const markup = renderTabs({}, (
      <GlTab
        panelProps={{ id: "first-panel", title: "Panel title" }}
        tabProps={{ id: "first-tab", title: "Tab title" }}
        title="First">
        First panel
      </GlTab>
    ));

    expect(markup).toMatch(/<button[^>]*id="first-tab"[^>]*title="Tab title"/);
    expect(markup).toMatch(/<div[^>]*id="first-panel"[^>]*title="Panel title"/);
  });

  describe("tab counts", () => {
    it("renders zero with hidden badge text and visible screen-reader context", () => {
      const markup = renderTabs({}, (
        <GlTab tabCount={0} tabCountSrText="No issues" title="Issues">
          Issue panel
        </GlTab>
      ));

      expect(markup).toContain("gl-tab-counter-badge");
      expect(markup).toContain("aria-hidden=\"true\"");
      expect(markup).toContain("No issues");
    });

    it.each([-1, null, undefined])("does not render a badge for %s", (tabCount) => {
      expect(renderTabs({}, (
        <GlTab tabCount={tabCount} title="Issues">Issue panel</GlTab>
      ))).not.toContain("gl-tab-counter-badge");
    });

    it("warns when a displayed count has no screen-reader context", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderTabs({}, <GlTab tabCount={5} title="Issues">Issue panel</GlTab>);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("[GlTab]"));
    });
  });

  it("keeps inactive panels mounted unless lazy is enabled", () => {
    expect(renderTabs()).toContain("Second panel");
    expect(renderTabs({ lazy: true })).not.toContain("Second panel");
  });

  it("allows a tab to override root lazy behavior", () => {
    const markup = renderTabs({ lazy: true }, (
      <>
        <GlTab title="First">First panel</GlTab>
        <GlTab lazy={false} title="Second">Second panel</GlTab>
      </>
    ));

    expect(markup).toContain("Second panel");
  });

  it("renders empty content when there are no tabs", () => {
    const markup = renderTabs({ empty: "No tabs available" }, null);

    expect(markup).toContain("<div class=\"tab-pane active\">No tabs available</div>");
    expect(markup).not.toContain("role=\"tab\"");
  });

  it("renders regions outside the tablist in fixed order and actions only once", () => {
    const markup = renderTabs({}, (
      <>
        <GlTabsAfter><GlButton>After</GlButton></GlTabsAfter>
        <GlTab title="First">First panel</GlTab>
        <GlTabActions aria-label="Tab actions"><GlButton>Save</GlButton></GlTabActions>
        <GlTabsBefore><GlButton>Before</GlButton></GlTabsBefore>
      </>
    ));
    const beforeIndex = markup.indexOf("gl-tabs-before");
    const tablistIndex = markup.indexOf("role=\"tablist\"");
    const afterIndex = markup.indexOf("gl-tabs-after");
    const actionsIndex = markup.indexOf("gl-tab-actions");

    expect(beforeIndex).toBeLessThan(tablistIndex);
    expect(tablistIndex).toBeLessThan(afterIndex);
    expect(afterIndex).toBeLessThan(actionsIndex);
    expect(markup.match(/>Save</g)).toHaveLength(1);
    expect(markup).toContain("role=\"toolbar\"");

    const tablistEndIndex = markup.indexOf("</ul>", tablistIndex);
    expect(beforeIndex).toBeLessThan(tablistIndex);
    expect(afterIndex).toBeGreaterThan(tablistEndIndex);
  });

  it("supports arrays, fragments, and conditional children", () => {
    const showSecond = true;
    const markup = renderTabs({}, [
      <GlTab key="first" title="First">First panel</GlTab>,
      <Fragment key="fragment">
        {showSecond ? <GlTab title="Second">Second panel</GlTab> : null}
      </Fragment>,
    ]);

    expect(markup.match(/role="tab"/g)).toHaveLength(2);
  });

  it.each([
    ["GlTabsBefore", <><GlTabsBefore /><GlTabsBefore /></>],
    ["GlTabsAfter", <><GlTabsAfter /><GlTabsAfter /></>],
    ["GlTabActions", <><GlTabActions /><GlTabActions /></>],
  ])("rejects duplicate %s regions", (regionName, children) => {
    expect(() => renderTabs({}, children)).toThrow(`at most one ${regionName}`);
  });

  it("rejects opaque wrapper children", () => {
    function WrappedTab() {
      return <GlTab title="Wrapped">Wrapped panel</GlTab>;
    }

    expect(() => renderTabs({}, <WrappedTab />)).toThrow("only accepts GlTab");
  });
});

describe("GlScrollableTabs", () => {
  it("adds the scrollable list and hidden labeled controls", () => {
    const markup = renderToStaticMarkup(
      <GlScrollableTabs scrollLeftLabel="Previous tabs" scrollRightLabel="Next tabs">
        {defaultTabs}
      </GlScrollableTabs>,
    );

    expect(markup).toContain("gl-scrollable-tabs-nav");
    expect(markup).toMatch(/<div hidden="" class="gl-tabs-fade gl-tabs-fade-left"/);
    expect(markup).toContain("aria-label=\"Previous tabs\"");
    expect(markup).toContain("aria-label=\"Next tabs\"");
  });

  it("warns for and ignores each custom region", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const markup = renderToStaticMarkup(
      <GlScrollableTabs>
        <GlTabsBefore>Before</GlTabsBefore>
        <GlTab title="First">First panel</GlTab>
        <GlTabsAfter>After</GlTabsAfter>
        <GlTabActions>Actions</GlTabActions>
      </GlScrollableTabs>,
    );

    expect(warn).toHaveBeenCalledTimes(3);
    expect(markup).not.toContain("gl-tabs-before");
    expect(markup).not.toContain("gl-tabs-after");
    expect(markup).not.toContain("gl-tab-actions");
  });

  it("warns for and ignores repeated unsupported regions", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => renderToStaticMarkup(
      <GlScrollableTabs>
        <GlTabsBefore>First</GlTabsBefore>
        <GlTabsBefore>Second</GlTabsBefore>
        <GlTab title="Tab">Panel</GlTab>
      </GlScrollableTabs>,
    )).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

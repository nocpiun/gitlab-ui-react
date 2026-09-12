import {
  Fragment,
  cloneElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  resolveTriggerContent,
  resolveTriggerRender,
} from "./trigger-composition";

describe("trigger composition", () => {
  it("creates a GitLab button for default trigger content", () => {
    const trigger = resolveTriggerRender("TestTrigger", false, "Open", {
      category: "tertiary",
      variant: "confirm",
    });

    const markup = renderToStaticMarkup(cloneElement(
      trigger as ReactElement<{ children?: ReactNode }>, {
        children: resolveTriggerContent(false, "Open"),
      },
    ));

    expect(markup).toContain("gl-button");
    expect(markup).toContain("Open");
  });

  it("keeps rich content inside the default button", () => {
    const children = <><span>Prefix</span> label</>;
    const trigger = resolveTriggerRender("TestTrigger", false, children, {});
    const markup = renderToStaticMarkup(cloneElement(
      trigger as ReactElement<{ children?: ReactNode }>,
      { children: resolveTriggerContent(false, children) },
    ));

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("<span>Prefix</span> label");
  });

  it("returns the child element and no replacement content with asChild", () => {
    const child = <button className="child" type="button">Open</button>;

    expect(resolveTriggerRender("TestTrigger", true, child, {})).toBe(child);
    expect(resolveTriggerContent(true, child)).toBeUndefined();
  });

  it.each([
    ["text", "Open"],
    ["multiple elements", [<span key="one">One</span>, <span key="two">Two</span>]],
    ["a Fragment", <Fragment key="fragment"><span>One</span></Fragment>],
  ])("rejects %s in asChild mode", (_, children) => {
    expect(() => resolveTriggerRender("TestTrigger", true, children, {})).toThrowError(
      "TestTrigger with `asChild` requires exactly one non-Fragment React element child.",
    );
  });

});

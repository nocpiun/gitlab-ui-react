import { createRef, Fragment, type PropsWithChildren } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlButton from "../button/button";
import GlFormInput from "../form-input/form-input";
import GlFormInputGroup, {
  GlFormInputGroupAddon,
  type GlFormInputGroupProps,
  GlInputGroupText,
} from "./form-input-group";
import * as formInputGroupExports from "./index";

function Wrapper({ children }: PropsWithChildren) {
  return <section data-testid="wrapper">{children}</section>;
}

describe("GlFormInputGroup", () => {
  it("renders an empty group without creating an input", () => {
    const markup = renderToStaticMarkup(<GlFormInputGroup />);

    expect(markup).toContain("<div");
    expect(markup).toContain("role=\"group\"");
    expect(markup).toContain("gl-form-input-group input-group");
    expect(markup).not.toContain("<input");
  });

  it("passes native div attributes through and merges className", () => {
    const markup = renderToStaticMarkup(
      <GlFormInputGroup
        aria-label="Repository URL"
        className="custom-group"
        data-testid="input-group"
        id="repository-url" />,
    );

    expect(markup).toContain("aria-label=\"Repository URL\"");
    expect(markup).toContain("data-testid=\"input-group\"");
    expect(markup).toContain("id=\"repository-url\"");
    expect(markup).toContain("gl-form-input-group input-group custom-group");
  });

  it("keeps role=group fixed even when untyped runtime props try to replace it", () => {
    const runtimeProps = { role: "presentation" } as unknown as GlFormInputGroupProps;
    const markup = renderToStaticMarkup(<GlFormInputGroup {...runtimeProps} />);

    expect(markup).toContain("role=\"group\"");
    expect(markup).not.toContain("role=\"presentation\"");
  });

  it("renders arbitrary children in their original order without validation", () => {
    const markup = renderToStaticMarkup(
      <GlFormInputGroup>
        <span>ordinary-child</span>
        <Fragment>
          <em>fragment-child</em>
          <Wrapper><strong>wrapped-child</strong></Wrapper>
        </Fragment>
        <GlFormInputGroupAddon position="prepend">first-addon</GlFormInputGroupAddon>
        <GlFormInputGroupAddon position="prepend">repeated-addon</GlFormInputGroupAddon>
      </GlFormInputGroup>,
    );
    const orderedContent = [
      "ordinary-child",
      "fragment-child",
      "wrapped-child",
      "first-addon",
      "repeated-addon",
    ];

    for(let index = 1; index < orderedContent.length; index += 1) {
      expect(markup.indexOf(orderedContent[index - 1])).toBeLessThan(
        markup.indexOf(orderedContent[index]),
      );
    }
    expect(markup).toContain("<section data-testid=\"wrapper\"");
    expect(markup.match(/gl-form-input-group-addon/gu)).toHaveLength(2);
  });

  it("supports the intended addon, input, and button composition", () => {
    const markup = renderToStaticMarkup(
      <GlFormInputGroup>
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText>Username</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormInput aria-label="Username" />
        <GlFormInputGroupAddon position="append">
          <GlButton>Add</GlButton>
        </GlFormInputGroupAddon>
      </GlFormInputGroup>,
    );

    expect(markup.indexOf("Username</div>")).toBeLessThan(markup.indexOf("<input"));
    expect(markup.indexOf("<input")).toBeLessThan(markup.indexOf("Add</span>"));
    expect(markup).toContain("input-group-prepend");
    expect(markup).toContain("input-group-append");
  });

  it("accepts a root ref", () => {
    const ref = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(<GlFormInputGroup ref={ref} />)).not.toThrow();
  });

  it("exposes only the three public runtime components", () => {
    expect(Object.keys(formInputGroupExports).sort()).toEqual([
      "GlFormInputGroup",
      "GlFormInputGroupAddon",
      "GlInputGroupText",
    ]);
  });
});

describe("GlFormInputGroupAddon", () => {
  it.each([
    ["prepend", "input-group-prepend"],
    ["append", "input-group-append"],
  ] as const)("maps position=%s to %s", (position, positionClass) => {
    const markup = renderToStaticMarkup(
      <GlFormInputGroupAddon position={position}>Addon</GlFormInputGroupAddon>,
    );

    expect(markup).toContain(`gl-form-input-group-addon ${positionClass}`);
  });

  it("passes native div attributes through, merges className, and accepts a ref", () => {
    const ref = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlFormInputGroupAddon
        ref={ref}
        aria-label="Prefix"
        className="custom-addon"
        data-testid="addon"
        position="prepend">
        Addon
      </GlFormInputGroupAddon>,
    )).not.toThrow();

    const markup = renderToStaticMarkup(
      <GlFormInputGroupAddon
        aria-label="Prefix"
        className="custom-addon"
        data-testid="addon"
        position="prepend" />,
    );
    expect(markup).toContain("aria-label=\"Prefix\"");
    expect(markup).toContain("data-testid=\"addon\"");
    expect(markup).toContain("input-group-prepend custom-addon");
  });
});

describe("GlInputGroupText", () => {
  it("renders a div with its content and structural classes", () => {
    const markup = renderToStaticMarkup(<GlInputGroupText>@</GlInputGroupText>);

    expect(markup).toMatch(/^<div[^>]*>@<\/div>$/u);
    expect(markup).toContain("gl-input-group-text input-group-text");
  });

  it("passes native div attributes through, merges className, and accepts a ref", () => {
    const ref = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlInputGroupText
        ref={ref}
        className="custom-text"
        data-testid="input-group-text"
        lang="en">
        Label
      </GlInputGroupText>,
    )).not.toThrow();

    const markup = renderToStaticMarkup(
      <GlInputGroupText className="custom-text" data-testid="input-group-text" lang="en" />,
    );
    expect(markup).toContain("data-testid=\"input-group-text\"");
    expect(markup).toContain("lang=\"en\"");
    expect(markup).toContain("input-group-text custom-text");
  });
});

import { createRef, Fragment, type PropsWithChildren } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormInput from "../form-input/form-input";
import GlFormField, {
  GlFormFieldDescription,
  GlFormFieldError,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
  type GlFormFieldProps,
} from "./form-field";
import * as formFieldExports from "./index";

function Wrapper({ children }: PropsWithChildren) {
  return <section>{children}</section>;
}

describe("GlFormField", () => {
  it("renders a semantic group without creating a control", () => {
    const markup = renderToStaticMarkup(<GlFormField />);

    expect(markup).toContain("<div");
    expect(markup).toContain("role=\"group\"");
    expect(markup).toContain("class=\"gl-form-field form-group\"");
    expect(markup).not.toContain("<input");
  });

  it("passes native div attributes through, merges className, and keeps its role fixed", () => {
    const runtimeProps = {
      "aria-label": "Project name",
      className: "custom-field",
      id: "project-field",
      role: "presentation",
    } as unknown as GlFormFieldProps;
    const markup = renderToStaticMarkup(<GlFormField {...runtimeProps}>Content</GlFormField>);

    expect(markup).toContain("aria-label=\"Project name\"");
    expect(markup).toContain("id=\"project-field\"");
    expect(markup).toContain("gl-form-field form-group custom-field");
    expect(markup).toContain("role=\"group\"");
    expect(markup).not.toContain("role=\"presentation\"");
  });
});

describe("GlFormFieldGroup", () => {
  it("is a layout-only div that preserves arbitrary child order", () => {
    const markup = renderToStaticMarkup(
      <GlFormFieldGroup aria-label="Profile fields" className="custom-group">
        <GlFormField>First</GlFormField>
        <Fragment>
          <Wrapper>Middle</Wrapper>
          <GlFormFieldSet>Last</GlFormFieldSet>
        </Fragment>
      </GlFormFieldGroup>,
    );

    expect(markup).toContain(
      "class=\"gl-form-field-group gl-flex gl-flex-col gl-gap-5 custom-group\"",
    );
    expect(markup).not.toMatch(/^<div[^>]*role=/u);
    expect(markup.indexOf("First")).toBeLessThan(markup.indexOf("Middle"));
    expect(markup.indexOf("Middle")).toBeLessThan(markup.indexOf("Last"));
  });
});

describe("GlFormFieldSet and GlFormFieldLegend", () => {
  it("render native fieldset and legend elements with native attributes", () => {
    const markup = renderToStaticMarkup(
      <GlFormFieldSet className="custom-field-set" disabled name="notifications">
        <GlFormFieldLegend className="custom-legend">Notifications</GlFormFieldLegend>
        <input name="email" type="checkbox" />
      </GlFormFieldSet>,
    );

    expect(markup).toMatch(/^<fieldset[^>]*>/u);
    expect(markup).toContain("class=\"gl-form-field-set form-group custom-field-set\"");
    expect(markup).toContain("disabled=\"\"");
    expect(markup).toContain("name=\"notifications\"");
    expect(markup).toContain(
      "<legend class=\"gl-form-field-legend col-form-label custom-legend\">Notifications</legend>",
    );
  });
});

describe("GlFormField content primitives", () => {
  it("renders explicitly connected label, control, description, and error content", () => {
    const markup = renderToStaticMarkup(
      <GlFormField aria-labelledby="username-label">
        <GlFormFieldLabel htmlFor="username" id="username-label">
          Username
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="username-description username-error"
          ariaInvalid="true"
          id="username" />
        <GlFormFieldDescription id="username-description">
          Choose a unique username.
        </GlFormFieldDescription>
        <GlFormFieldError aria-live="polite" id="username-error">
          Username is already taken.
        </GlFormFieldError>
      </GlFormField>,
    );

    expect(markup).toMatch(
      /<label[^>]*id="username-label"[^>]*class="gl-form-field-label col-form-label"[^>]*for="username"/u,
    );
    expect(markup).toContain(
      "aria-describedby=\"username-description username-error\"",
    );
    expect(markup).toContain("aria-invalid=\"true\"");
    expect(markup).toContain(
      "<small id=\"username-description\" class=\"gl-form-field-description form-text text-muted\"",
    );
    expect(markup).toContain(
      "<div aria-live=\"polite\" id=\"username-error\" class=\"gl-form-field-error invalid-feedback\"",
    );
  });

  it("forwards native attributes, className, and refs from every primitive", () => {
    const groupRef = createRef<HTMLDivElement>();
    const fieldSetRef = createRef<HTMLFieldSetElement>();
    const legendRef = createRef<HTMLLegendElement>();
    const labelRef = createRef<HTMLLabelElement>();
    const descriptionRef = createRef<HTMLElement>();
    const errorRef = createRef<HTMLDivElement>();
    const fieldRef = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlFormFieldGroup ref={groupRef} title="group">
        <GlFormField ref={fieldRef} title="field">
          <GlFormFieldLabel ref={labelRef} className="custom-label" htmlFor="control">
            Label
          </GlFormFieldLabel>
          <GlFormFieldDescription ref={descriptionRef} className="custom-description">
            Description
          </GlFormFieldDescription>
          <GlFormFieldError ref={errorRef} className="custom-error">
            Error
          </GlFormFieldError>
        </GlFormField>
        <GlFormFieldSet ref={fieldSetRef} title="field set">
          <GlFormFieldLegend ref={legendRef} className="custom-legend">
            Legend
          </GlFormFieldLegend>
        </GlFormFieldSet>
      </GlFormFieldGroup>,
    )).not.toThrow();
  });

  it("exports only the intended public runtime components with exact casing", () => {
    expect(Object.keys(formFieldExports).sort()).toEqual([
      "GlFormField",
      "GlFormFieldDescription",
      "GlFormFieldError",
      "GlFormFieldGroup",
      "GlFormFieldLabel",
      "GlFormFieldLegend",
      "GlFormFieldSet",
      "default",
    ]);
    expect(formFieldExports).not.toHaveProperty("GlFormFieldset");
    expect(formFieldExports).not.toHaveProperty("GlFormFieldSetLegend");
  });
});

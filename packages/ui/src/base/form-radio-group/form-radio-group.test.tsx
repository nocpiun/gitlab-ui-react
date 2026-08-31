import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormRadio from "../form-radio/form-radio";
import GlFormRadioGroup from "./form-radio-group";

const renderGroup = (props: ComponentProps<typeof GlFormRadioGroup> = {}) => renderToStaticMarkup(
  <GlFormRadioGroup {...props} />,
);

describe("GlFormRadioGroup", () => {
  describe("rendering defaults", () => {
    it("has the structure <div></div>", () => {
      expect(renderGroup()).toMatch(/^<div[^>]*><\/div>$/);
    });

    it("has only the gl-form-radio-group and gl-outline-none classes on the wrapper", () => {
      expect(renderGroup()).toMatch(/^<div class="gl-form-radio-group gl-outline-none"/);
    });

    it("merges a consumer className onto the wrapper", () => {
      expect(renderGroup({ className: "custom-class" }))
        .toMatch(/^<div class="gl-form-radio-group gl-outline-none custom-class"/);
    });

    it("has attribute role=radiogroup", () => {
      expect(renderGroup()).toContain("role=\"radiogroup\"");
    });

    it("has tabindex set to -1", () => {
      expect(renderGroup()).toContain("tabindex=\"-1\"");
    });

    it("has an auto-generated ID by default", () => {
      expect(renderGroup()).toMatch(/id="gitlab_ui_radio_group_[^"]+"/);
    });

    it("has the user-provided ID", () => {
      expect(renderGroup({ id: "test" })).toMatch(/<div[^>]*id="test"/);
    });

    it("transfers custom attributes to the wrapper", () => {
      const props = { id: "custom-attribute", "data-foo": "bar" };

      expect(renderGroup(props)).toMatch(/<div[^>]*data-foo="bar"/);
    });
  });

  describe("accessibility attributes", () => {
    it("does not have aria-required by default", () => {
      expect(renderGroup()).not.toContain("aria-required");
    });

    it("has aria-required when required is set", () => {
      expect(renderGroup({ required: true })).toContain("aria-required=\"true\"");
    });

    it("does not have aria-invalid by default", () => {
      expect(renderGroup()).not.toContain("aria-invalid");
    });

    it("has aria-invalid=true when state=false", () => {
      expect(renderGroup({ state: false })).toContain("aria-invalid=\"true\"");
    });

    it("does not have aria-invalid when state=true or state=null", () => {
      expect(renderGroup({ state: true })).not.toContain("aria-invalid");
      expect(renderGroup({ state: null })).not.toContain("aria-invalid");
    });

    it.each([true, "true", ""] as const)("has aria-invalid=true when ariaInvalid is %s", (ariaInvalid) => {
      expect(renderGroup({ ariaInvalid })).toContain("aria-invalid=\"true\"");
    });

    it("passes aria-describedby and aria-labelledby down to the option inputs, not the wrapper", () => {
      const markup = renderGroup({
        "aria-describedby": "description",
        "aria-labelledby": "label",
        options: ["one"],
      });

      expect(markup).not.toMatch(/<div[^>]*aria-describedby/);
      expect(markup).not.toMatch(/<div[^>]*aria-labelledby/);
      expect(markup).toMatch(/<input[^>]*aria-describedby="description"/);
      expect(markup).toMatch(/<input[^>]*aria-labelledby="label"/);
    });
  });

  describe("options", () => {
    it("renders a radio per option with the option text", () => {
      const markup = renderGroup({ options: ["one", "two", "three"], checked: "" });

      expect(markup.match(/type="radio"/g)).toHaveLength(3);
      expect(markup).toContain(">one</label>");
      expect(markup).toContain(">two</label>");
      expect(markup).toContain(">three</label>");
    });

    it("defaults the option value to its text when omitted", () => {
      expect(renderGroup({ options: [{ text: "one" }] })).toContain("value=\"one\"");
    });

    it("uses the option value when provided", () => {
      const markup = renderGroup({ options: [{ text: "One", value: "one" }] });

      expect(markup).toContain("value=\"one\"");
      expect(markup).toContain(">One</label>");
    });

    it("respects the option disabled flag", () => {
      const markup = renderGroup({
        options: [{ text: "one" }, { text: "two", disabled: true }],
        checked: "",
      });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs).toHaveLength(2);
      expect(inputs[0]).not.toContain("disabled");
      expect(inputs[1]).toContain("disabled");
    });

    it("renders option html inside a span", () => {
      // Server-side DOMPurify passes content through unchanged; browser
      // sanitization is covered by the Storybook play tests.
      const markup = renderGroup({
        options: [{ text: "fallback", html: "<strong>HTML</strong> option" }],
      });

      expect(markup).toContain("<span><strong>HTML</strong> option</span>");
      expect(markup).not.toContain(">fallback</label>");
    });

    it("renders nothing for a non-array options value", () => {
      expect(renderGroup({ options: undefined })).toMatch(/^<div[^>]*><\/div>$/);
    });
  });

  describe("checked state", () => {
    it("checks the radio matching the checked value", () => {
      const markup = renderGroup({ options: ["one", "two", "three"], checked: "two" });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs[0]).not.toContain("checked");
      expect(inputs[1]).toContain("checked");
      expect(inputs[2]).not.toContain("checked");
    });

    it("checks a radio passed as a child through the group context", () => {
      const markup = renderToStaticMarkup(
        <GlFormRadioGroup checked="slot-option">
          <GlFormRadio value="slot-option">Slot option</GlFormRadio>
        </GlFormRadioGroup>,
      );

      expect(markup).toMatch(/<input[^>]*checked=""/);
    });

    it("renders the first prop before and children after the option radios", () => {
      const markup = renderToStaticMarkup(
        <GlFormRadioGroup
          checked=""
          first={<GlFormRadio value="first-option">First option</GlFormRadio>}
          options={["middle"]}>
          <GlFormRadio value="last-option">Last option</GlFormRadio>
        </GlFormRadioGroup>,
      );

      const firstIndex = markup.indexOf("First option");
      const middleIndex = markup.indexOf(">middle</label>");
      const lastIndex = markup.indexOf("Last option");

      expect(firstIndex).toBeGreaterThan(-1);
      expect(firstIndex).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(lastIndex);
    });
  });

  describe("group context", () => {
    it("gives every radio the group name, falling back to the generated group ID", () => {
      const markup = renderGroup({ options: ["one", "two"], checked: "" });
      const groupId = /id="(gitlab_ui_radio_group_[^"]+)"/.exec(markup)?.[1];
      const names = [...markup.matchAll(/<input[^>]*name="([^"]+)"/g)].map((match) => match[1]);

      expect(groupId).toBeDefined();
      expect(names).toHaveLength(2);
      expect(names.every((inputName) => inputName === groupId)).toBe(true);
    });

    it("prefers the provided group name over a radio's own name", () => {
      const markup = renderToStaticMarkup(
        <GlFormRadioGroup name="group-name" checked="">
          <GlFormRadio name="own-name" value="one">One</GlFormRadio>
        </GlFormRadioGroup>,
      );

      expect(markup).toContain("name=\"group-name\"");
      expect(markup).not.toContain("own-name");
    });

    it("disables every radio when the group is disabled", () => {
      const markup = renderGroup({ disabled: true, options: ["one", "two"], checked: "" });

      expect(markup.match(/<input[^>]*disabled=""[^>]*type="radio"|type="radio"[^>]*disabled=""/g)).toHaveLength(2);
    });

    it("keeps a child radio disabled when the group is not", () => {
      const markup = renderToStaticMarkup(
        <GlFormRadioGroup checked="">
          <GlFormRadio disabled value="one">One</GlFormRadio>
        </GlFormRadioGroup>,
      );

      expect(markup).toMatch(/<input[^>]*disabled=""/);
    });

    it("makes every radio required when the group is required", () => {
      const markup = renderGroup({ checked: "", options: ["one", "two"], required: true });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs).toHaveLength(2);
      for(const input of inputs) {
        expect(input).toContain("required");
        expect(input).toContain("aria-required=\"true\"");
      }
    });
  });

  describe("validation state", () => {
    it("gives every radio is-valid when state=true", () => {
      const markup = renderGroup({ checked: "", options: ["one", "two"], state: true });

      expect(markup.match(/is-valid/g)).toHaveLength(2);
      expect(markup).not.toContain("is-invalid");
    });

    it("gives every radio is-invalid and aria-invalid when state=false", () => {
      const markup = renderGroup({ checked: "", options: ["one", "two"], state: false });

      expect(markup.match(/is-invalid/g)).toHaveLength(2);
      expect(markup.match(/aria-invalid="true"/g)).toHaveLength(3); // 2 inputs + wrapper
      expect(markup).not.toContain("is-valid");
    });

    it("has no validation classes when state=null", () => {
      const markup = renderGroup({ checked: "", options: ["one"], state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });
  });
});

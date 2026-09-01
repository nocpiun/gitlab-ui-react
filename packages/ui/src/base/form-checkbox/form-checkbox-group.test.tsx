import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormCheckbox from "./form-checkbox";
import GlFormCheckboxGroup from "./form-checkbox-group";

const renderGroup = (props: ComponentProps<typeof GlFormCheckboxGroup> = {}) => renderToStaticMarkup(
  <GlFormCheckboxGroup {...props} />,
);

describe("GlFormCheckboxGroup", () => {
  describe("rendering defaults", () => {
    it("has the structure <div></div>", () => {
      expect(renderGroup()).toMatch(/^<div[^>]*><\/div>$/);
    });

    it("has only the gl-form-checkbox-group and gl-outline-none classes on the wrapper", () => {
      expect(renderGroup()).toMatch(/^<div class="gl-form-checkbox-group gl-outline-none"/);
    });

    it("merges a consumer className onto the wrapper", () => {
      expect(renderGroup({ className: "custom-class" }))
        .toMatch(/^<div class="gl-form-checkbox-group gl-outline-none custom-class"/);
    });

    it("has attribute role=group", () => {
      expect(renderGroup()).toContain("role=\"group\"");
    });

    it("has tabindex set to -1", () => {
      expect(renderGroup()).toContain("tabindex=\"-1\"");
    });

    it("has an auto-generated ID by default", () => {
      expect(renderGroup()).toMatch(/id="gitlab_ui_checkbox_group_[^"]+"/);
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

    it("passes the group aria-describedby and aria-labelledby to slotted child checkboxes", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup aria-describedby="description" aria-labelledby="label">
          <GlFormCheckbox value="slot-option">Slot option</GlFormCheckbox>
        </GlFormCheckboxGroup>,
      );

      expect(markup).toMatch(/<input[^>]*aria-describedby="description"/);
      expect(markup).toMatch(/<input[^>]*aria-labelledby="label"/);
    });

    it("prefers a child checkbox's own aria attributes over the group's", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup aria-describedby="group-description" aria-labelledby="group-label">
          <GlFormCheckbox
            aria-describedby="own-description"
            ariaLabelledby="own-label"
            value="slot-option">
            Slot option
          </GlFormCheckbox>
        </GlFormCheckboxGroup>,
      );

      expect(markup).toMatch(/<input[^>]*aria-describedby="own-description"/);
      expect(markup).toMatch(/<input[^>]*aria-labelledby="own-label"/);
      expect(markup).not.toContain("group-description");
      expect(markup).not.toContain("group-label");
    });
  });

  describe("options", () => {
    it("renders a checkbox per option with the option text", () => {
      const markup = renderGroup({ options: ["one", "two", "three"] });

      expect(markup.match(/type="checkbox"/g)).toHaveLength(3);
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
      });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs).toHaveLength(2);
      expect(inputs[0]).not.toContain("disabled");
      expect(inputs[1]).toContain("disabled");
    });

    it("fails closed on the server: renders the plain-text fallback, not the raw HTML", () => {
      // Server-side sanitization is unavailable, so SafeHtml must not pass the
      // raw HTML through; browser sanitization is covered by the Storybook
      // play tests.
      const markup = renderGroup({
        options: [{ text: "fallback", html: "<strong>HTML</strong> option<script>alert(1)</script>" }],
      });

      expect(markup).toContain("<span>fallback</span>");
      expect(markup).not.toContain("<strong>");
      expect(markup).not.toContain("<script>");
    });

    it("renders nothing for a non-array options value", () => {
      expect(renderGroup({ options: undefined })).toMatch(/^<div[^>]*><\/div>$/);
    });
  });

  describe("checked state", () => {
    it("checks the checkboxes whose values are in the checked array", () => {
      const markup = renderGroup({ options: ["one", "two", "three"], checked: ["two"] });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs[0]).not.toContain("checked");
      expect(inputs[1]).toContain("checked");
      expect(inputs[2]).not.toContain("checked");
    });

    it("checks a checkbox passed as a child through the group context", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup checked={["slot-option"]}>
          <GlFormCheckbox value="slot-option">Slot option</GlFormCheckbox>
        </GlFormCheckboxGroup>,
      );

      expect(markup).toMatch(/<input[^>]*checked=""/);
    });

    it("renders the first prop before and children after the option checkboxes", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup
          first={<GlFormCheckbox value="first-option">First option</GlFormCheckbox>}
          options={["middle"]}>
          <GlFormCheckbox value="last-option">Last option</GlFormCheckbox>
        </GlFormCheckboxGroup>,
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
    it("gives every checkbox the group name, falling back to the generated group ID", () => {
      const markup = renderGroup({ options: ["one", "two"] });
      const groupId = /id="(gitlab_ui_checkbox_group_[^"]+)"/.exec(markup)?.[1];
      const names = [...markup.matchAll(/<input[^>]*name="([^"]+)"/g)].map((match) => match[1]);

      expect(groupId).toBeDefined();
      expect(names).toHaveLength(2);
      expect(names.every((inputName) => inputName === groupId)).toBe(true);
    });

    it("prefers the provided group name over a checkbox's own name", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup name="group-name">
          <GlFormCheckbox name="own-name" value="one">One</GlFormCheckbox>
        </GlFormCheckboxGroup>,
      );

      expect(markup).toContain("name=\"group-name\"");
      expect(markup).not.toContain("own-name");
    });

    it("disables every checkbox when the group is disabled", () => {
      const markup = renderGroup({ disabled: true, options: ["one", "two"] });

      expect(markup.match(/<input[^>]*disabled=""[^>]*type="checkbox"|type="checkbox"[^>]*disabled=""/g)).toHaveLength(2);
    });

    it("keeps a child checkbox disabled when the group is not", () => {
      const markup = renderToStaticMarkup(
        <GlFormCheckboxGroup>
          <GlFormCheckbox disabled value="one">One</GlFormCheckbox>
        </GlFormCheckboxGroup>,
      );

      expect(markup).toMatch(/<input[^>]*disabled=""/);
    });

    it("makes every checkbox required when the group is required", () => {
      const markup = renderGroup({ options: ["one", "two"], required: true });
      const inputs = markup.match(/<input[^>]*>/g) ?? [];

      expect(inputs).toHaveLength(2);
      for(const input of inputs) {
        expect(input).toContain("required");
        expect(input).toContain("aria-required=\"true\"");
      }
    });
  });

  describe("validation state", () => {
    it("gives every checkbox is-valid when state=true", () => {
      const markup = renderGroup({ options: ["one", "two"], state: true });

      expect(markup.match(/is-valid/g)).toHaveLength(2);
      expect(markup).not.toContain("is-invalid");
    });

    it("gives every checkbox is-invalid and aria-invalid when state=false", () => {
      const markup = renderGroup({ options: ["one", "two"], state: false });

      expect(markup.match(/is-invalid/g)).toHaveLength(2);
      expect(markup.match(/aria-invalid="true"/g)).toHaveLength(3); // 2 inputs + wrapper
      expect(markup).not.toContain("is-valid");
    });

    it("has no validation classes when state=null", () => {
      const markup = renderGroup({ options: ["one"], state: null });

      expect(markup).not.toContain("is-valid");
      expect(markup).not.toContain("is-invalid");
    });
  });
});

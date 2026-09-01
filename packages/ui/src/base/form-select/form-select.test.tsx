import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormSelect, {
  GlFormSelectGroup,
  GlFormSelectItem,
} from "./form-select";

const items = (
  <>
    <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
    <GlFormSelectItem disabled value="Tacos">Tacos</GlFormSelectItem>
    <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
  </>
);

const renderSelect = (props: ComponentProps<typeof GlFormSelect> = {}) => renderToStaticMarkup(
  <GlFormSelect {...props}>{items}</GlFormSelect>,
);

describe("GlFormSelect", () => {
  describe("rendering defaults", () => {
    it("renders the upstream wrapper and native select structure", () => {
      const markup = renderSelect();

      expect(markup).toMatch(/^<span class="gl-form-select-wrapper"><select/);
      expect(markup).toContain("class=\"gl-form-select custom-select\"");
      expect(markup).toContain("<option value=\"Pizza\">Pizza</option>");
    });

    it("generates an ID when one is not supplied", () => {
      expect(renderSelect()).toMatch(/id="gl-form-select-[^"]+"/);
    });

    it("uses a supplied ID and forwards native attributes to the select", () => {
      const markup = renderSelect({
        title: "select",
        form: "example-form",
        id: "food",
        name: "food",
      });

      expect(markup).toMatch(/<select[^>]*title="select"/);
      expect(markup).toMatch(/<select[^>]*form="example-form"/);
      expect(markup).toMatch(/<select[^>]*id="food"/);
      expect(markup).toMatch(/<select[^>]*name="food"/);
    });

    it("keeps select and wrapper classes separate", () => {
      const markup = renderSelect({ className: "select-class", wrapperClassName: "wrapper-class" });

      expect(markup).toMatch(/^<span class="gl-form-select-wrapper wrapper-class">/);
      expect(markup).toContain("class=\"gl-form-select custom-select select-class\"");
    });
  });

  describe("validation and form state", () => {
    it("applies valid state without aria-invalid", () => {
      const markup = renderSelect({ state: true });

      expect(markup).toContain("is-valid");
      expect(markup).not.toContain("aria-invalid");
    });

    it("applies invalid state and aria-invalid", () => {
      const markup = renderSelect({ state: false });

      expect(markup).toContain("is-invalid");
      expect(markup).toContain("aria-invalid=\"true\"");
    });

    it.each([true, "true", ""] as const)(
      "normalizes an explicit ariaInvalid value of %s",
      (ariaInvalid) => {
        expect(renderSelect({ ariaInvalid })).toContain("aria-invalid=\"true\"");
      },
    );

    it("renders required and disabled semantics on the select", () => {
      const markup = renderSelect({ disabled: true, required: true });

      expect(markup).toMatch(/<select[^>]*aria-required="true"/);
      expect(markup).toMatch(/<select[^>]*disabled=""/);
      expect(markup).toMatch(/<select[^>]*required=""/);
    });
  });

  describe("width", () => {
    it.each(["xs", "sm", "md", "lg", "xl"] as const)(
      "adds the %s width class to the wrapper",
      (width) => {
        expect(renderSelect({ width })).toMatch(
          new RegExp(`^<span class="gl-form-select-wrapper gl-form-select-${width}"`),
        );
      },
    );

    it("supports responsive widths", () => {
      const markup = renderSelect({ width: { default: "sm", md: "lg", xl: "xl" } });

      expect(markup).toMatch(
        /^<span class="gl-form-select-wrapper gl-form-select-sm gl-md-form-select-lg gl-xl-form-select-xl"/,
      );
    });

    it("does not add a width class when width is null", () => {
      expect(renderSelect({ width: null })).toMatch(/^<span class="gl-form-select-wrapper">/);
    });
  });

  describe("compound items", () => {
    it("renders disabled items", () => {
      expect(renderSelect()).toContain("<option disabled=\"\" value=\"Tacos\">Tacos</option>");
    });

    it("renders an accessible option group", () => {
      const markup = renderToStaticMarkup(
        <GlFormSelect>
          <GlFormSelectGroup label="Main dishes">
            <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
          </GlFormSelectGroup>
        </GlFormSelect>,
      );

      expect(markup).toContain("<optgroup label=\"Main dishes\">");
      expect(markup).toContain("<option value=\"Pizza\">Pizza</option>");
    });

    it("selects a single uncontrolled default value", () => {
      const markup = renderSelect({ defaultValue: "Burger" });

      expect(markup).toContain("<option value=\"Burger\" selected=\"\">Burger</option>");
    });

    it("selects multiple uncontrolled default values", () => {
      const markup = renderSelect({ defaultValue: ["Pizza", "Burger"], multiple: true });

      expect(markup).toContain("<option value=\"Pizza\" selected=\"\">Pizza</option>");
      expect(markup).toContain("<option value=\"Burger\" selected=\"\">Burger</option>");
    });
  });
});

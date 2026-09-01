import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormPasswordInput from "./form-password-input";

const renderPasswordInput = (props: ComponentProps<typeof GlFormPasswordInput> = {}) => renderToStaticMarkup(
  <GlFormPasswordInput {...props} />,
);

describe("GlFormPasswordInput", () => {
  describe("rendering defaults", () => {
    it("has the structure <div><input><button></button></div>", () => {
      expect(renderPasswordInput()).toMatch(/^<div[^>]*><input[^>]*><button[^>]*>.*<\/button><\/div>$/);
    });

    it("has the wrapper class gl-form-password-input", () => {
      expect(renderPasswordInput()).toMatch(/^<div class="gl-form-password-input"/);
    });

    it("merges a consumer className onto the wrapper", () => {
      expect(renderPasswordInput({ className: "custom-class" }))
        .toMatch(/^<div class="gl-form-password-input custom-class"/);
    });

    it("applies a consumer style to the wrapper, not the input", () => {
      // Vue's class/style fallthrough targets the root even with
      // inheritAttrs: false; the wrapper is also the toggle's positioning
      // anchor, so an inline max-width must constrain the whole control.
      const markup = renderPasswordInput({ style: { maxWidth: "10rem" } });

      expect(markup).toMatch(/^<div[^>]*style="max-width:10rem"/);
      expect(markup).not.toMatch(/<input[^>]*style=/);
    });

    it("renders the input with the gl-form-password-input-field class", () => {
      expect(renderPasswordInput()).toMatch(/<input[^>]*class="[^"]*gl-form-password-input-field/);
    });

    it("renders the toggle button with the gl-form-password-input-toggle class", () => {
      expect(renderPasswordInput()).toMatch(/<button[^>]*class="[^"]*gl-form-password-input-toggle/);
    });
  });

  describe("masking", () => {
    it("masks the value by default and renders a reveal toggle", () => {
      const markup = renderPasswordInput();

      expect(markup).toMatch(/<input[^>]*type="password"/);
      expect(markup).toMatch(/<button[^>]*aria-label="Reveal password"/);
      expect(markup).toContain("data-testid=\"eye-icon\"");
    });

    it("reveals the value when initialVisibility is true", () => {
      const markup = renderPasswordInput({ initialVisibility: true });

      expect(markup).toMatch(/<input[^>]*type="text"/);
      expect(markup).toMatch(/<button[^>]*aria-label="Hide password"/);
      expect(markup).toContain("data-testid=\"eye-slash-icon\"");
    });

    it("uses the provided reveal and hide labels", () => {
      const masked = renderPasswordInput({ revealLabel: "Reveal token", hideLabel: "Hide token" });
      const revealed = renderPasswordInput({
        hideLabel: "Hide token",
        initialVisibility: true,
        revealLabel: "Reveal token",
      });

      expect(masked).toMatch(/<button[^>]*aria-label="Reveal token"/);
      expect(revealed).toMatch(/<button[^>]*aria-label="Hide token"/);
    });
  });

  describe("disabled", () => {
    it("disables the input natively and the toggle via aria-disabled", () => {
      // Deliberate deviation from upstream: the toggle follows this repo's
      // GlButton policy (aria-disabled, focusable, activation suppressed)
      // instead of a native `disabled` attribute.
      const markup = renderPasswordInput({ disabled: true });

      expect(markup).toMatch(/<input[^>]*disabled=""/);
      expect(markup).toMatch(/<button[^>]*aria-disabled="true"/);
      expect(markup).not.toMatch(/<button[^>]* disabled=""/);
      // The native attribute already announces the input's state
      expect(markup).not.toMatch(/<input[^>]*aria-disabled/);
    });
  });

  describe("readonly", () => {
    // `readonly` is deliberately not a prop: it passes through to the input
    // and leaves the toggle alone, because revealing a value is a read rather
    // than an edit.
    it("makes the input read-only without disabling the toggle", () => {
      const markup = renderPasswordInput({ readOnly: true });

      expect(markup).toMatch(/<input[^>]*readOnly=""/);
      expect(markup).toMatch(/<button[^>]*aria-disabled="false"/);
      expect(markup).not.toMatch(/<input[^>]*aria-disabled/);
    });
  });

  describe("forwarding to the inner input", () => {
    it("binds the value to the input", () => {
      expect(renderPasswordInput({ value: "hunter2" })).toMatch(/<input[^>]*value="hunter2"/);
    });

    it("forwards attributes to the input", () => {
      const markup = renderPasswordInput({ id: "password", name: "user[password]" });

      expect(markup).toMatch(/<input[^>]*id="password"/);
      expect(markup).toMatch(/<input[^>]*name="user\[password\]"/);
    });

    it("does not accept a consumer-passed type", () => {
      // `type` is omitted from the props type; the component always controls it
      const markup = renderPasswordInput({ "type": "text" } as ComponentProps<typeof GlFormPasswordInput>);

      expect(markup).toMatch(/<input[^>]*type="password"/);
    });

    it("constrains the wrapper, not the input, when width is set", () => {
      // The toggle is positioned against the wrapper, so the width constraint
      // must land on the wrapper to keep the toggle aligned with the input.
      const markup = renderPasswordInput({ width: "sm" });

      expect(markup).toMatch(/^<div class="gl-form-password-input gl-form-input-sm"/);
      expect(markup).not.toMatch(/<input[^>]*gl-form-input-sm/);
    });

    it("supports responsive width objects on the wrapper", () => {
      const markup = renderPasswordInput({ width: { default: "sm", md: "lg" } });

      expect(markup).toMatch(/^<div class="gl-form-password-input gl-form-input-sm gl-md-form-input-lg"/);
    });
  });
});

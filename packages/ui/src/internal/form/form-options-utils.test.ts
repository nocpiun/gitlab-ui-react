/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/utils/form_options_utils.spec.js
 */

import { describe, expect, it } from "vitest";
import { normalizeFormOptions } from "./form-options-utils";

describe("normalizeFormOptions", () => {
  it("returns an empty array when given an empty array", () => {
    expect(normalizeFormOptions([])).toEqual([]);
  });

  it.each([undefined, null, "string"])("returns an empty array when given %s", (options) => {
    expect(normalizeFormOptions(options)).toEqual([]);
  });

  it("normalizes an array of strings", () => {
    expect(normalizeFormOptions(["one", "two", "three"])).toEqual([
      { value: "one", text: "one", disabled: false },
      { value: "two", text: "two", disabled: false },
      { value: "three", text: "three", disabled: false },
    ]);
  });

  it("normalizes an array of numbers", () => {
    expect(normalizeFormOptions([1, 2])).toEqual([
      { value: 1, text: "1", disabled: false },
      { value: 2, text: "2", disabled: false },
    ]);
  });

  it("normalizes an array of objects with text and value", () => {
    const options = [
      { text: "One", value: "one" },
      { text: "Two", value: "two" },
    ];
    expect(normalizeFormOptions(options)).toEqual([
      { value: "one", text: "One", html: undefined, disabled: false },
      { value: "two", text: "Two", html: undefined, disabled: false },
    ]);
  });

  it("respects the disabled field", () => {
    const options = [
      { text: "One", value: "one" },
      { text: "Two", value: "two", disabled: true },
    ];
    expect(normalizeFormOptions(options)).toEqual([
      { value: "one", text: "One", html: undefined, disabled: false },
      { value: "two", text: "Two", html: undefined, disabled: true },
    ]);
  });

  it("falls back to text when value is not provided", () => {
    expect(normalizeFormOptions([{ text: "One" }])).toEqual([
      { value: "One", text: "One", html: undefined, disabled: false },
    ]);
  });

  it("preserves null as value when explicitly set", () => {
    expect(normalizeFormOptions([{ text: "One", value: null }])).toEqual([
      { value: null, text: "One", html: undefined, disabled: false },
    ]);
  });

  it("includes html field when provided", () => {
    expect(normalizeFormOptions([{ text: "One", value: "one", html: "<b>One</b>" }])).toEqual([
      { value: "one", text: "One", html: "<b>One</b>", disabled: false },
    ]);
  });
});

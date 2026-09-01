/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/utils/equality_utils.spec.js
 */

import { describe, expect, it } from "vitest";
import { looseEqual, looseIndexOf } from "./equality-utils";

describe("equality-utils", () => {
  describe("looseEqual", () => {
    it("compares booleans correctly", () => {
      expect(looseEqual(true, true)).toBe(true);
      expect(looseEqual(false, false)).toBe(true);
      expect(looseEqual(true, false)).toBe(false);
      expect(looseEqual(true, 1)).toBe(false);
      expect(looseEqual(false, 0)).toBe(false);
    });

    it("compares strings correctly", () => {
      const text = "Lorem ipsum";
      const number = 1;
      const bool = true;

      expect(looseEqual(text, text)).toBe(true);
      expect(looseEqual(text, text.slice(0, -1))).toBe(false);
      expect(looseEqual(String(number), number)).toBe(true);
      expect(looseEqual(String(bool), bool)).toBe(true);
    });

    it("compares numbers correctly", () => {
      const number = 100;
      const decimal = 2.5;
      const multiplier = 1.0000001;

      expect(looseEqual(number, number)).toBe(true);
      expect(looseEqual(number, number - 1)).toBe(false);
      expect(looseEqual(decimal, decimal)).toBe(true);
      expect(looseEqual(decimal, decimal * multiplier)).toBe(false);
      expect(looseEqual(number, number * multiplier)).toBe(false);
      expect(looseEqual(multiplier, multiplier)).toBe(true);
    });

    it("coerces primitive strings before comparing", () => {
      expect(looseEqual(123, "123")).toBe(true);
      expect(looseEqual(0, "")).toBe(false);
      expect(looseEqual(false, "")).toBe(false);
    });

    it("compares dates correctly", () => {
      const date1 = new Date(2020, 1, 2, 3, 4, 5, 6);
      const date2 = new Date(2020, 1, 2, 3, 4, 5, 6);
      const date3 = new Date(2020, 1, 2, 3, 4, 5, 7);
      const date4 = new Date(2219, 1, 2, 3, 4, 5, 6);

      expect(looseEqual(date1, date1)).toBe(true);
      expect(looseEqual(date1, date2)).toBe(true);
      expect(looseEqual(date1, date3)).toBe(false);
      expect(looseEqual(date1, date4)).toBe(false);
    });

    it("compares files by their inherited properties", () => {
      const date1 = new Date(2020, 1, 2, 3, 4, 5, 6);
      const date2 = new Date(2020, 1, 2, 3, 4, 5, 7);
      const file1 = new File([""], "filename.txt", { type: "text/plain", lastModified: date1.getTime() });
      const file2 = new File([""], "filename.txt", { type: "text/plain", lastModified: date1.getTime() });
      const file3 = new File([""], "filename.txt", { type: "text/plain", lastModified: date2.getTime() });
      const file4 = new File([""], "filename.csv", { type: "text/csv", lastModified: date1.getTime() });
      const file5 = new File(["abcdef"], "filename.txt", { type: "text/plain", lastModified: date1.getTime() });
      const file6 = new File(["12345"], "filename.txt", { type: "text/plain", lastModified: date1.getTime() });

      expect(looseEqual(file1, file1)).toBe(true);
      expect(looseEqual(file1, file2)).toBe(true);
      expect(looseEqual(file1, file3)).toBe(false);
      expect(looseEqual(file1, file4)).toBe(false);
      expect(looseEqual(file5, file6)).toBe(false);
    });

    it("compares objects with inherited prototype properties", () => {
      const proto = { inherited: "value" };
      const obj1 = Object.assign(Object.create(proto), { own: 1 });
      const obj2 = Object.assign(Object.create(proto), { own: 1 });
      const obj3 = Object.assign(Object.create({ inherited: "other" }), { own: 1 });

      expect(looseEqual(obj1, obj2)).toBe(true);
      expect(looseEqual(obj1, obj3)).toBe(false);
    });

    it("compares arrays correctly", () => {
      const arr1 = [1, 2, 3, 4];
      const arr2 = [1, 2, 3, "4"];
      const arr3 = [1, 2, 3, 4, 5];
      const arr4 = [1, 2, 3, 4, { a: 5 }];

      expect(looseEqual(arr1, arr1)).toBe(true);
      expect(looseEqual(arr1, arr1.slice())).toBe(true);
      expect(looseEqual(arr4, arr4.slice())).toBe(true);
      expect(looseEqual(arr1, arr2)).toBe(true);
      expect(looseEqual(arr3, arr4)).toBe(false);
      expect(looseEqual(arr1, arr3)).toBe(false);
      expect(looseEqual(arr1, arr1.slice().reverse())).toBe(false);
    });

    it("compares sparse arrays correctly", () => {
      const arr1: unknown[] = [];
      arr1[2] = true;
      const arr2: unknown[] = [];
      arr2[2] = true;
      const arr3 = [false, false, true];
      const arr4 = [undefined, undefined, true];
      const arr5: unknown[] = [];
      arr5[0] = true;
      arr5[2] = true;

      expect(looseEqual(arr1, arr2)).toBe(true);
      expect(looseEqual(arr2, arr1)).toBe(true);
      expect(looseEqual(arr1, arr3)).toBe(false);
      expect(looseEqual(arr3, arr1)).toBe(false);
      expect(looseEqual(arr1, arr4)).toBe(true);
      expect(looseEqual(arr4, arr1)).toBe(true);
      expect(looseEqual(arr1, arr5)).toBe(false);
      expect(looseEqual(arr5, arr1)).toBe(false);
    });

    it("compares RegExp correctly", () => {
      const rx1 = /^foo$/;
      const rx2 = /^foo$/;
      const rx3 = /^bar$/;
      const rx4 = /^bar$/i;

      expect(looseEqual(rx1, rx1)).toBe(true);
      expect(looseEqual(rx1, rx2)).toBe(true);
      expect(looseEqual(rx1, rx3)).toBe(false);
      expect(looseEqual(rx3, rx4)).toBe(false);
    });

    it("compares objects correctly", () => {
      const obj1 = { foo: "bar" };
      const obj2 = { foo: "bar1" };
      const obj3 = { a: 1, b: 2, c: 3 };
      const obj4 = { b: 2, c: 3, a: 1 };
      const obj5 = { ...obj4, z: 999 };
      const nestedObj1 = { ...obj1, bar: [{ ...obj1 }, { ...obj1 }] };
      const nestedObj2 = { ...obj1, bar: [{ ...obj1 }, { ...obj2 }] };

      expect(looseEqual(obj1, obj1)).toBe(true);
      expect(looseEqual(obj1, { ...obj1 })).toBe(true);
      expect(looseEqual(obj1, obj2)).toBe(false);
      expect(looseEqual(obj3, obj4)).toBe(true);
      expect(looseEqual(obj4, obj5)).toBe(false);
      expect(looseEqual(nestedObj1, nestedObj1)).toBe(true);
      expect(looseEqual(nestedObj1, { ...nestedObj1 })).toBe(true);
      expect(looseEqual(nestedObj1, nestedObj2)).toBe(false);
    });

    it("compares different types correctly", () => {
      const obj1 = {};
      const obj2 = { a: 1 };
      const obj3 = { 0: 0, 1: 1, 2: 2 };
      const arr1: unknown[] = [];
      const arr2 = [1];
      const arr3 = [0, 1, 2];
      const date1 = new Date(2020, 1, 2, 3, 4, 5, 6);
      const file1 = new File([""], "filename.txt", { type: "text/plain", lastModified: date1.getTime() });

      expect(looseEqual(123, "123")).toBe(true);
      expect(looseEqual(123, new Date(123))).toBe(false);
      expect(looseEqual("123", new Date(123))).toBe(false);
      expect(looseEqual([1, 2, 3], "1,2,3")).toBe(false);
      expect(looseEqual(obj1, arr1)).toBe(false);
      expect(looseEqual(obj2, arr2)).toBe(false);
      expect(looseEqual(obj1, "[object Object]")).toBe(false);
      expect(looseEqual(arr1, "[object Array]")).toBe(false);
      expect(looseEqual(obj1, date1)).toBe(false);
      expect(looseEqual(obj2, date1)).toBe(false);
      expect(looseEqual(arr1, date1)).toBe(false);
      expect(looseEqual(arr2, date1)).toBe(false);
      expect(looseEqual(obj2, file1)).toBe(false);
      expect(looseEqual(arr2, file1)).toBe(false);
      expect(looseEqual(date1, file1)).toBe(false);
      expect(looseEqual(obj3, arr3)).toBe(false);
    });

    it("compares null and undefined values correctly", () => {
      expect(looseEqual(null, null)).toBe(true);
      expect(looseEqual(undefined, undefined)).toBe(true);
      expect(looseEqual(undefined, undefined)).toBe(true);
      expect(looseEqual(null, undefined)).toBe(false);
      expect(looseEqual(null, "")).toBe(false);
      expect(looseEqual(null, false)).toBe(false);
      expect(looseEqual(undefined, false)).toBe(false);
    });
  });

  describe("looseIndexOf", () => {
    it("returns the index of a loosely matching value", () => {
      expect(looseIndexOf([1, 2, 3], 2)).toBe(1);
      expect(looseIndexOf([1, 2, 3], "2")).toBe(1);
      expect(looseIndexOf([{ a: 1 }, { b: 2 }], { b: 2 })).toBe(1);
    });

    it("returns -1 when value is not found", () => {
      expect(looseIndexOf([1, 2, 3], 4)).toBe(-1);
      expect(looseIndexOf([], 1)).toBe(-1);
    });
  });
});

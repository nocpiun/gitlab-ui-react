/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/utils/equality_utils.js
 *
 * Shared by the form components (checkbox, radio, radio-group) to detect
 * meaningful value changes without redundant event emissions. Internal; not
 * part of the public API.
 */

/**
 * Performs a deep, type-coercing equality check between two values.
 *
 * Unlike strict equality (`===`) or lodash's `isEqual`, this function:
 * - Compares objects and arrays by structure, not reference
 * - Coerces types before comparing primitives (e.g. `123` equals `'123'`)
 * - Compares Date objects by timestamp
 * - Compares File objects by inherited properties (name, size, type, lastModified)
 */
export function looseEqual(a: unknown, b: unknown): boolean {
  if(a === b) {
    return true;
  }
  if(a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : false;
  }
  if(Array.isArray(a) || Array.isArray(b)) {
    if(!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    // Compare arrays element by element; a for loop handles sparse arrays
    // (array.every doesn't).
    for(let i = 0; i < a.length; i += 1) {
      if(!looseEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  const aIsObject = a !== null && typeof a === "object";
  const bIsObject = b !== null && typeof b === "object";
  if(aIsObject || bIsObject) {
    if(!aIsObject || !bIsObject) {
      return false;
    }
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    if(Object.keys(aRecord).length !== Object.keys(bRecord).length) {
      return false;
    }
    // Intentionally iterates inherited properties to compare complex types
    // like File objects where properties live on the prototype.
    for(const key in aRecord) {
      const aHasKey = Object.prototype.hasOwnProperty.call(aRecord, key);
      const bHasKey = Object.prototype.hasOwnProperty.call(bRecord, key);
      if((aHasKey && !bHasKey) || (!aHasKey && bHasKey) || !looseEqual(aRecord[key], bRecord[key])) {
        return false;
      }
    }
  }
  // Like upstream, objects that passed the key comparison fall through to the
  // string coercion, so e.g. RegExp sources are still compared.
  return String(a) === String(b);
}

/**
 * Finds the first index in an array where the element is loosely equal to the
 * given value. Like `Array.prototype.indexOf`, but compares with
 * {@link looseEqual}.
 */
export function looseIndexOf(array: unknown[], value: unknown): number {
  for(let i = 0; i < array.length; i += 1) {
    if(looseEqual(array[i], value)) {
      return i;
    }
  }
  return -1;
}

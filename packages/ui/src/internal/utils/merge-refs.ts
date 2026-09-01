/**
 * Shared React ref merging for components that combine a forwarded ref with
 * their own internal ref (currently GlFormCheckbox, GlFormInput, GlFormDate).
 * Internal; not part of the public API.
 */

import type { Ref } from "react";

/**
 * Returns a callback ref that forwards the element to every given ref,
 * supporting both callback and object refs.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (element: T | null) => void {
  return (element: T | null) => {
    for(const ref of refs) {
      if(typeof ref === "function") {
        ref(element);
      } else if(ref) {
        ref.current = element;
      }
    }
  };
}

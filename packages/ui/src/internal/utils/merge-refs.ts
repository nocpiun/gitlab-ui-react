/**
 * Shared React ref merging for components that combine forwarded and internal refs.
 * Internal; not part of the public API.
 */

import { useCallback, type Ref } from "react";

function assignRefs<T>(refs: (Ref<T> | undefined)[], element: T | null) {
  for(const ref of refs) {
    if(typeof ref === "function") {
      ref(element);
    } else if(ref) {
      ref.current = element;
    }
  }
}

/**
 * Returns a callback ref that forwards the element to every given ref,
 * supporting both callback and object refs.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (element: T | null) => void {
  return (element: T | null) => assignRefs(refs, element);
}

/**
 * Returns a callback ref that remains stable until one of its target refs changes.
 */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]): (element: T | null) => void {
  return useCallback(
    (element: T | null) => assignRefs(refs, element),
    // A changed ref must produce a callback that clears the old target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
}

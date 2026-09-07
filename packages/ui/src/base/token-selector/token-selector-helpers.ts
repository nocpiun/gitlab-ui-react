/**
 * Pure state helpers for the token selector.
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/token_selector/helpers.js
 */

import type { GlTokenSelectorItem } from "./token-selector";

export function idsAreEqual(
  first: GlTokenSelectorItem["id"],
  second: GlTokenSelectorItem["id"],
) {
  return first === second;
}

export function getAvailableItems(
  items: readonly GlTokenSelectorItem[],
  selectedItems: readonly GlTokenSelectorItem[],
) {
  return items.filter((item) => (
    !selectedItems.some((selectedItem) => idsAreEqual(item.id, selectedItem.id))
  ));
}

export function getBoundedIndex(index: number, itemCount: number) {
  if(itemCount === 0) return 0;
  return Math.min(Math.max(index, 0), itemCount - 1);
}

export function itemLabel(item: GlTokenSelectorItem) {
  return item.name ?? "";
}

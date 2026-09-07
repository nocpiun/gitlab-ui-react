/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/token_selector/token_selector_dropdown.vue
 */

import type {
  GlTokenSelectorItem,
  GlTokenSelectorRenderState,
} from "./token-selector";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { clsx } from "cn";
import { itemLabel, tokenSelectorItemKey } from "./token-selector-helpers";

type TokenSelectorDropdownProps = {
  activeIndex: number;
  activeItemFocusVisible: boolean;
  componentId: string;
  dropdownFooter?: ReactNode;
  inputValue: string;
  items: readonly GlTokenSelectorItem[];
  loading: boolean;
  loadingContent: ReactNode;
  menuClassName?: string;
  noResultsContent: ReactNode;
  onActiveIndexChange: (index: number) => void;
  onSelect: (item: GlTokenSelectorItem) => void;
  renderDropdownItem?: (
    item: GlTokenSelectorItem,
    state: GlTokenSelectorRenderState,
  ) => ReactNode;
  renderUserDefinedToken?: (
    inputValue: string,
    item: GlTokenSelectorItem,
    state: GlTokenSelectorRenderState,
  ) => ReactNode;
  portalContainer: RefObject<HTMLDivElement | null>;
  userDefinedItem: GlTokenSelectorItem | null;
};

function DropdownOption({
  active,
  focusVisible,
  children,
  id,
  index,
  item,
  onActiveIndexChange,
  onSelect,
}: {
  active: boolean;
  focusVisible: boolean;
  children: ReactNode;
  id: string;
  index: number;
  item: GlTokenSelectorItem;
  onActiveIndexChange: (index: number) => void;
  onSelect: (item: GlTokenSelectorItem) => void;
}) {
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    // Keep focus on the combobox input while preserving click activation.
    event.preventDefault();
  };

  return (
    <BaseCombobox.Item
      aria-selected={active}
      className={clsx(
        "gl-new-dropdown-item",
        active && focusVisible && "gl-new-dropdown-item-highlighted",
      )}
      data-dropdown-item-id={item.id}
      index={index}
      onClick={(event) => {
        (event as typeof event & { preventBaseUIHandler?: () => void }).preventBaseUIHandler?.();
        onSelect(item);
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={() => onActiveIndexChange(index)}
      render={(props) => <div {...props} id={id} />}
      value={item}>
      <div className="gl-new-dropdown-item-content">
        <div className="gl-new-dropdown-item-text-wrapper">{children}</div>
      </div>
    </BaseCombobox.Item>
  );
}

export default function TokenSelectorDropdown({
  activeIndex,
  activeItemFocusVisible,
  componentId,
  dropdownFooter,
  inputValue,
  items,
  loading,
  loadingContent,
  menuClassName,
  noResultsContent,
  onActiveIndexChange,
  onSelect,
  portalContainer,
  renderDropdownItem,
  renderUserDefinedToken,
  userDefinedItem,
}: TokenSelectorDropdownProps) {
  const allItems = userDefinedItem ? [...items, userDefinedItem] : items;

  const statusOption = (content: ReactNode, key: string) => (
    <div
      key={key}
      aria-disabled="true"
      className="gl-new-dropdown-item disabled"
      data-disabled=""
      role="option">
      <div className="gl-new-dropdown-item-content">
        <div className="gl-new-dropdown-item-text-wrapper">{content}</div>
      </div>
    </div>
  );

  return (
    <BaseCombobox.Portal container={portalContainer}>
      <BaseCombobox.Positioner
        align="start"
        className="gl-new-dropdown-container"
        side="bottom"
        sideOffset={4}>
        <BaseCombobox.Popup
          className="gl-new-dropdown-panel gl-new-dropdown-panel-fixed-width"
          finalFocus={false}
          initialFocus={false}>
          <div className="gl-new-dropdown-inner">
            <BaseCombobox.List
              id={componentId}
              className={clsx(
                "gl-new-dropdown-contents",
                menuClassName,
              )}>
              {loading && allItems.length > 0 ? statusOption(loadingContent, "loading") : null}
              {allItems.map((item, index) => {
                const highlighted = activeIndex === index;
                const renderState = { highlighted, inputValue };
                const isUserDefined = item === userDefinedItem;

                return (
                  <DropdownOption
                    key={tokenSelectorItemKey(item)}
                    active={highlighted}
                    focusVisible={activeItemFocusVisible}
                    id={`${componentId}-dropdown-item-${index}`}
                    index={index}
                    item={item}
                    onActiveIndexChange={onActiveIndexChange}
                    onSelect={onSelect}>
                    {isUserDefined
                      ? renderUserDefinedToken
                        ? renderUserDefinedToken(inputValue, item, renderState)
                        : `Add \"${inputValue}\"`
                      : renderDropdownItem
                        ? renderDropdownItem(item, renderState)
                        : itemLabel(item)}
                  </DropdownOption>
                );
              })}
              <BaseCombobox.Empty className="gl-token-selector-empty">
                {loading ? statusOption(loadingContent, "empty-loading") : null}
                {statusOption(noResultsContent, "no-results")}
              </BaseCombobox.Empty>
              {dropdownFooter}
            </BaseCombobox.List>
          </div>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

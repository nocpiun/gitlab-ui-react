/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/token_selector/token_container.vue
 */

import type { GlTokenSelectorItem } from "./token-selector.js";
import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "cn";
import GlButton from "../button/button.js";
import GlToken from "../token/token.js";
import { tokenSelectorItemKey } from "./token-selector-helpers.js";

type TokenContainerProps = {
  emptyPlaceholder?: ReactNode;
  focusedTokenIndex: number | null;
  onClearAll: () => void;
  onFocusedTokenIndexChange: (index: number | null) => void;
  onRemove: (item: GlTokenSelectorItem) => void;
  onReturnToInput: () => void;
  renderToken?: (item: GlTokenSelectorItem) => ReactNode;
  showClearAll: boolean;
  showEmptyPlaceholder: boolean;
  tokens: readonly GlTokenSelectorItem[];
  viewOnly: boolean;
  input: ReactNode;
};

export default function TokenContainer({
  emptyPlaceholder,
  focusedTokenIndex,
  input,
  onClearAll,
  onFocusedTokenIndexChange,
  onRemove,
  onReturnToInput,
  renderToken,
  showClearAll,
  showEmptyPlaceholder,
  tokens,
  viewOnly,
}: TokenContainerProps) {
  const tokenRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if(focusedTokenIndex === null) return;

    const nextIndex = Math.min(focusedTokenIndex, tokens.length - 1);
    if(nextIndex < 0) {
      onReturnToInput();
      return;
    }

    if(nextIndex !== focusedTokenIndex) {
      onFocusedTokenIndexChange(nextIndex);
      return;
    }

    tokenRefs.current[nextIndex]?.focus();
  }, [focusedTokenIndex, onFocusedTokenIndexChange, onReturnToInput, tokens.length]);

  const handleTokenKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const lastIndex = tokens.length - 1;

    switch(event.key) {
      case "ArrowLeft":
        event.preventDefault();
        onFocusedTokenIndexChange(index === 0 ? lastIndex : index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        onFocusedTokenIndexChange(index === lastIndex ? 0 : index + 1);
        break;
      case "Home":
        event.preventDefault();
        onFocusedTokenIndexChange(0);
        break;
      case "End":
        event.preventDefault();
        onFocusedTokenIndexChange(lastIndex);
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        onFocusedTokenIndexChange(index > 0 ? index - 1 : 0);
        onRemove(tokens[index]);
        break;
      case "Escape":
        event.preventDefault();
        onReturnToInput();
        break;
      case "Tab":
        if(!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();
          onReturnToInput();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="gl-flex gl-w-full gl-flex-nowrap gl-items-start">
      <div className="gl-flex gl-grow gl-flex-wrap gl-items-start">
        {showEmptyPlaceholder ? emptyPlaceholder : null}
        <div className="-gl-mx-1 -gl-my-1 gl-flex gl-w-auto gl-list-none gl-flex-wrap gl-items-center gl-p-0">
          {tokens.map((token, index) => (
            <div
              key={tokenSelectorItemKey(token)}
              ref={(element) => { tokenRefs.current[index] = element; }}
              className="gl-token-selector-token-container gl-px-1 gl-py-2 gl-outline-none"
              data-testid="gl-token-selector-tokens"
              data-token-id={token.id}
              onFocus={(event) => {
                if(event.target === event.currentTarget) onFocusedTokenIndexChange(index);
              }}
              onKeyDown={(event) => handleTokenKeyDown(event, index)}
              tabIndex={-1}>
              <GlToken
                className={clsx("gl-cursor-default", token.className)}
                onRemove={() => {
                  onFocusedTokenIndexChange(null);
                  onRemove(token);
                }}
                style={token.style}
                viewOnly={viewOnly}>
                {renderToken ? renderToken(token) : <span>{token.name}</span>}
              </GlToken>
            </div>
          ))}
        </div>
        {input}
      </div>
      {showClearAll ? (
        <div className="gl-ml-3 gl-p-1">
          <GlButton
            aria-label="Clear all"
            category="tertiary"
            data-testid="clear-all-button"
            icon="clear"
            onClick={(event) => {
              event.stopPropagation();
              onClearAll();
            }}
            size="small" />
        </div>
      ) : null}
    </div>
  );
}

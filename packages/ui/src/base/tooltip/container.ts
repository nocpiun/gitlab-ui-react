/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/directives/tooltip/container.js
 */

let defaultContainer: HTMLElement | string | null | undefined;

/** Sets the default portal container for all tooltips (a selector or an element). */
export const setGlTooltipDefaultContainer = (container: HTMLElement | string | null): void => {
  defaultContainer = container;
};

export const getGlTooltipDefaultContainer = (): HTMLElement | string | null | undefined => defaultContainer;

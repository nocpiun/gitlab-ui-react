/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_textarea/visible.js
 */

const ROOT_MARGIN = "640px";

const handlers = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if(typeof IntersectionObserver === "undefined") return null;

  observer ??= new IntersectionObserver((entries) => {
    for(const entry of entries) {
      if(entry.isIntersecting) {
        handlers.get(entry.target)?.();
      }
    }
  }, { rootMargin: ROOT_MARGIN });

  return observer;
}

/** Observe an element with the shared textarea visibility observer. */
export function observeVisibility(element: Element, handler: () => void): () => void {
  const sharedObserver = getObserver();
  if(!sharedObserver) return () => undefined;

  handlers.set(element, handler);
  sharedObserver.observe(element);

  return () => {
    handlers.delete(element);
    sharedObserver.unobserve(element);
  };
}

/** Internal test hook matching upstream's observer reset. */
export function resetVisibilityObserver() {
  observer?.disconnect();
  observer = null;
}

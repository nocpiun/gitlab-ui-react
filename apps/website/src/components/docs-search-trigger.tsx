import type { Locale } from "../i18n/config";
import { useEffect, useRef } from "react";
import { siteMessages } from "../i18n/messages";
import { docsSearchInstance } from "../search";

type DocsSearchTriggerProps = {
  locale: Locale;
};

export function DocsSearchTrigger({ locale }: DocsSearchTriggerProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const messages = siteMessages[locale].navbar;
  const instance = docsSearchInstance(locale);

  useEffect(() => {
    let trigger: HTMLElement | undefined;

    function mountTrigger() {
      const container = containerRef.current;
      if(!container) return;

      // React assigns known custom-element properties directly. Pagefind's
      // `placeholder` is getter-only, so initialize attributes before connecting
      // the element to the document instead.
      trigger = document.createElement("pagefind-modal-trigger");
      trigger.setAttribute("aria-label", messages.searchLabel);
      trigger.setAttribute("instance", instance);
      trigger.setAttribute("placeholder", messages.searchPlaceholder);
      trigger.setAttribute("shortcut", "mod+k");
      trigger.setAttribute("title", messages.searchLabel);
      container.replaceChildren(trigger);
    }

    mountTrigger();
    document.addEventListener("astro:after-swap", mountTrigger);

    return () => {
      document.removeEventListener("astro:after-swap", mountTrigger);
      trigger?.remove();
    };
  }, [instance, messages.searchLabel, messages.searchPlaceholder]);

  return (
    <span
      className="site-search-trigger min-w-0 flex-1 sm:min-w-56 lg:w-64"
      ref={containerRef}/>
  );
}

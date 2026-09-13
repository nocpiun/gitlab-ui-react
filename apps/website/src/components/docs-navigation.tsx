import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlIcon } from "gitlab-ui-react/icon";
import {
  GlCollapsibleNav,
  GlCollapsibleNavToggle,
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlNavProvider,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react/nav";
import { useAstroSpriteIconKey } from "../hooks/use-astro-sprite-icon-key";
import { localizedPath, type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

type DocsNavigationLink = {
  external?: boolean;
  href: string;
  id?: string;
  title: string;
};

type DocsNavigationGroup = {
  id: string;
  items: DocsNavigationLink[];
  title: string;
};

type DocsNavigationItem = DocsNavigationLink | DocsNavigationGroup;

type DocsNavigationProps = {
  currentId: string;
  locale: Locale;
};

const DESKTOP_NAV_QUERY = "(min-width: 1200px)";
const NAVBAR_TOGGLE_TARGET_ID = "documentation-navigation-toggle-target";

function getNavigationItems(locale: Locale): DocsNavigationItem[] {
  const messages = siteMessages[locale].docs.navigation;

  return [
  {
    href: localizedPath(locale, "/docs"),
    id: "index",
    title: messages.introduction,
  },
  {
    href: localizedPath(locale, "/docs/installation"),
    id: "installation",
    title: messages.installation,
  },
  {
    href: "https://design.gitlab.com/product-foundations/design-tokens-directory",
    title: messages.designTokens,
    external: true,
  },
  {
    href: "https://design.gitlab.com/product-foundations/color",
    title: messages.color,
    external: true,
  },
  {
    href: "https://design.gitlab.com/product-foundations/iconography-directory",
    title: messages.icons,
    external: true,
  },
  {
    id: "components",
    title: messages.components,
    items: [
      {
        href: localizedPath(locale, "/docs/components/attribute-list"),
        id: "components/attribute-list",
        title: "Attribute list",
      },
      {
        href: localizedPath(locale, "/docs/components/button"),
        id: "components/button",
        title: "Button",
      },
    ],
  },
  ];
}

function isNavigationGroup(item: DocsNavigationItem): item is DocsNavigationGroup {
  return "items" in item;
}

function navigationLinkProps(link: DocsNavigationLink) {
  return link.external
    ? { href: link.href, rel: "noopener noreferrer", target: "_blank" }
    : { href: link.href };
}

export function DocsNavigation({ currentId, locale }: DocsNavigationProps) {
  const messages = siteMessages[locale].docs.navigation;
  const navigationItems = getNavigationItems(locale);
  const [isOpen, setIsOpen] = useState(false);
  const spriteIconKey = useAstroSpriteIconKey();
  const [toggleTarget, setToggleTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_NAV_QUERY);
    const syncOpenState = () => setIsOpen(desktopQuery.matches);

    syncOpenState();
    if(typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", syncOpenState);
      return () => desktopQuery.removeEventListener("change", syncOpenState);
    }

    desktopQuery.addListener(syncOpenState);
    return () => desktopQuery.removeListener(syncOpenState);
  }, []);

  useEffect(() => {
    if(!window.matchMedia(DESKTOP_NAV_QUERY).matches) setIsOpen(false);
  }, [currentId]);

  useEffect(() => {
    let targetObserver: MutationObserver | undefined;

    const findToggleTarget = () => {
      const target = document.getElementById(NAVBAR_TOGGLE_TARGET_ID);
      if(!target) return;

      setToggleTarget(target);
      targetObserver?.disconnect();
    };

    findToggleTarget();
    if(!document.getElementById(NAVBAR_TOGGLE_TARGET_ID)) {
      targetObserver = new MutationObserver(findToggleTarget);
      targetObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => targetObserver?.disconnect();
  }, []);

  return (
    <GlNavProvider
      navId="documentation-navigation"
      onOpenChange={setIsOpen}
      open={isOpen}>
      {toggleTarget ? createPortal(
        <GlCollapsibleNavToggle
          key={`external-toggle-${spriteIconKey}`}
          className="min-[1200px]:hidden"
          collapseLabel={messages.collapseNavigation}
          expandLabel={messages.expandNavigation} />,
        toggleTarget,
      ) : null}

      <GlCollapsibleNav aria-label={messages.documentationLabel}>
        {navigationItems.map((item) => {
          if(!isNavigationGroup(item)) {
            return (
              <GlNavItem key={item.id ?? item.href} selected={item.id === currentId}>
                <GlNavButton className="*:flex *:items-center" aria-label={item.title} {...navigationLinkProps(item)}>
                  {item.title}
                  {item.external && (
                    <GlNavItemAddon>
                      <GlIcon key={spriteIconKey} name="external-link" size={12}/>
                    </GlNavItemAddon>
                  )}
                </GlNavButton>
              </GlNavItem>
            );
          }

          const containsCurrentPage = item.items.some(({ id }) => id === currentId);

          return (
            <GlNavItem key={`${item.id}:${currentId}`}>
              <GlNavButton>
                {item.title}
              </GlNavButton>
              <GlSubNav defaultOpen={containsCurrentPage}>
                {item.items.map((link) => (
                  <GlSubNavItem key={link.id ?? link.href} selected={link.id === currentId}>
                    <GlSubNavButton {...navigationLinkProps(link)}>
                      {link.title}
                    </GlSubNavButton>
                  </GlSubNavItem>
                ))}
              </GlSubNav>
            </GlNavItem>
          );
        })}

        <GlNavItem className="mt-auto min-[1200px]:hidden">
          <GlCollapsibleNavToggle
            key={`internal-toggle-${spriteIconKey}`}
            collapseLabel={messages.collapse}
            expandLabel={messages.expand} />
        </GlNavItem>
      </GlCollapsibleNav>
    </GlNavProvider>
  );
}

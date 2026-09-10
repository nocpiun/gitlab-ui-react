import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  GlCollapsibleNav,
  GlCollapsibleNavToggle,
  GlNavButton,
  GlNavItem,
  GlNavProvider,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react";

export type DocsNavigationEntry = {
  href: string;
  id: string;
  title: string;
};

type DocsNavigationProps = {
  currentId: string;
  entries: DocsNavigationEntry[];
};

const DESKTOP_NAV_QUERY = "(min-width: 1200px)";
const NAVBAR_TOGGLE_TARGET_ID = "documentation-navigation-toggle-target";

function formatGroupLabel(group: string) {
  return group
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DocsNavigation({ currentId, entries }: DocsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<HTMLElement | null>(null);
  const rootEntries = entries.filter(({ id }) => !id.includes("/"));
  const groupedEntries = new Map<string, DocsNavigationEntry[]>();

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

  entries.forEach((entry) => {
    const [group] = entry.id.split("/");

    if(!entry.id.includes("/")) return;

    const groupEntries = groupedEntries.get(group) ?? [];
    groupEntries.push(entry);
    groupedEntries.set(group, groupEntries);
  });

  return (
    <GlNavProvider
      navId="documentation-navigation"
      onOpenChange={setIsOpen}
      open={isOpen}>
      {toggleTarget ? createPortal(
        <GlCollapsibleNavToggle
          className="min-[1200px]:hidden"
          collapseLabel="Collapse navigation"
          expandLabel="Expand navigation" />,
        toggleTarget,
      ) : null}

      <GlCollapsibleNav aria-label="Documentation navigation">
        {rootEntries.map((entry) => (
          <GlNavItem key={entry.id} selected={entry.id === currentId}>
            <GlNavButton href={entry.href}>
              {entry.title}
            </GlNavButton>
          </GlNavItem>
        ))}

        {[...groupedEntries].map(([group, groupEntries]) => {
          const containsCurrentPage = groupEntries.some(({ id }) => id === currentId);

          return (
            <GlNavItem key={`${group}:${currentId}`}>
              <GlNavButton>
                {formatGroupLabel(group)}
              </GlNavButton>
              <GlSubNav defaultOpen={containsCurrentPage}>
                {groupEntries.map((entry) => (
                  <GlSubNavItem key={entry.id} selected={entry.id === currentId}>
                    <GlSubNavButton href={entry.href}>{entry.title}</GlSubNavButton>
                  </GlSubNavItem>
                ))}
              </GlSubNav>
            </GlNavItem>
          );
        })}

        <GlNavItem className="mt-auto min-[1200px]:hidden">
          <GlCollapsibleNavToggle
            collapseLabel="Collapse"
            expandLabel="Expand" />
        </GlNavItem>
      </GlCollapsibleNav>
    </GlNavProvider>
  );
}

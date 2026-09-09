import {
  GlNav,
  GlNavButton,
  GlNavItem,
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

function formatGroupLabel(group: string) {
  return group
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DocsNavigation({ currentId, entries }: DocsNavigationProps) {
  const rootEntries = entries.filter(({ id }) => !id.includes("/"));
  const groupedEntries = new Map<string, DocsNavigationEntry[]>();

  entries.forEach((entry) => {
    const [group] = entry.id.split("/");

    if(!entry.id.includes("/")) return;

    const groupEntries = groupedEntries.get(group) ?? [];
    groupEntries.push(entry);
    groupedEntries.set(group, groupEntries);
  });

  return (
    <GlNav aria-label="Documentation navigation" className="w-full">
      {rootEntries.map((entry) => (
        <GlNavItem key={entry.id} selected={entry.id === currentId}>
          <GlNavButton href={entry.href}>{entry.title}</GlNavButton>
        </GlNavItem>
      ))}

      {[...groupedEntries].map(([group, groupEntries]) => {
        const containsCurrentPage = groupEntries.some(({ id }) => id === currentId);

        return (
          <GlNavItem key={group}>
            <GlNavButton>{formatGroupLabel(group)}</GlNavButton>
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
    </GlNav>
  );
}

import { useEffect, useState } from "react";
import {
  GlNav,
  GlNavButton,
  GlNavItem,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react";
import { type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

type DocsHeading = {
  depth: number;
  slug: string;
  text: string;
};

type DocsTableOfContentsProps = {
  className?: string;
  headings: DocsHeading[];
  locale: Locale;
  showTitle?: boolean;
};

type DocsSection = {
  heading: DocsHeading;
  subheadings: DocsHeading[];
};

const ACTIVE_HEADING_OFFSET = 32;

function getActiveHeading(headings: HTMLElement[]) {
  let activeHeading: string | undefined;

  for(const heading of headings) {
    if(heading.getBoundingClientRect().top > ACTIVE_HEADING_OFFSET) break;
    activeHeading = heading.id;
  }

  const documentHeight = document.documentElement.scrollHeight;
  const isAtPageEnd = Math.ceil(window.scrollY + window.innerHeight) >= documentHeight;

  return isAtPageEnd ? headings.at(-1)?.id : activeHeading;
}

function groupHeadings(headings: DocsHeading[]) {
  const sections: DocsSection[] = [];

  for(const heading of headings) {
    if(heading.depth === 2) {
      sections.push({ heading, subheadings: [] });
    } else if(heading.depth === 3) {
      sections.at(-1)?.subheadings.push(heading);
    }
  }

  return sections;
}

export function DocsTableOfContents({
  className,
  headings,
  locale,
  showTitle = true,
}: DocsTableOfContentsProps) {
  const messages = siteMessages[locale].docs.tableOfContents;
  const [activeHeading, setActiveHeading] = useState<string>();
  const sections = groupHeadings(headings);

  useEffect(() => {
    const headingElements = headings
      .map(({ slug }) => document.getElementById(slug))
      .filter((heading): heading is HTMLElement => heading instanceof HTMLElement);
    let animationFrame: number | undefined;

    const updateActiveHeading = () => {
      setActiveHeading(getActiveHeading(headingElements));
      animationFrame = undefined;
    };
    const scheduleUpdate = () => {
      if(animationFrame !== undefined) return;
      animationFrame = window.requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    window.addEventListener("hashchange", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      if(animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("hashchange", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
    };
  }, [headings]);

  const navigateToHeading = (slug: string) => {
    const heading = document.getElementById(slug);
    if(!heading) return;

    heading.scrollIntoView({ block: "start" });
    window.history.pushState(null, "", `#${slug}`);
  };

  return (
    <div className={className}>
      {showTitle ? (
        <p className="mb-4 text-xs font-semibold tracking-wide text-subtle uppercase">
          {messages.title}
        </p>
      ) : null}

      {sections.length > 0 ? (
        <GlNav aria-label={messages.label} className="ps-3 min-[1360px]:border-l border-l-section dark:border-l-neutral-800">
          {sections.map(({ heading, subheadings }) => {
            const isActive = heading.slug === activeHeading;

            if(subheadings.length === 0) {
              return (
                <GlNavItem key={heading.slug} selected={isActive}>
                  <GlNavButton
                    aria-current={isActive ? "location" : undefined}
                    href={`#${heading.slug}`}>
                    {heading.text}
                  </GlNavButton>
                </GlNavItem>
              );
            }

            return (
              <GlNavItem key={heading.slug} selected={isActive}>
                <GlNavButton
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => navigateToHeading(heading.slug)}>
                  {heading.text}
                </GlNavButton>
                <GlSubNav defaultOpen>
                  {subheadings.map((subheading) => {
                    const isSubheadingActive = subheading.slug === activeHeading;

                    return (
                      <GlSubNavItem
                        key={subheading.slug}
                        selected={isSubheadingActive}>
                        <GlSubNavButton
                          aria-current={isSubheadingActive ? "location" : undefined}
                          href={`#${subheading.slug}`}>
                          {subheading.text}
                        </GlSubNavButton>
                      </GlSubNavItem>
                    );
                  })}
                </GlSubNav>
              </GlNavItem>
            );
          })}
        </GlNav>
      ) : (
        <p className="m-0 text-sm text-subtle">{messages.empty}</p>
      )}
    </div>
  );
}

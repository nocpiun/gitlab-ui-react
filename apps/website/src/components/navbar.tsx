import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { GlButton } from "gitlab-ui-react/button";
import {
  GlListbox,
  GlListboxContent,
  GlListboxGroup,
  GlListboxItem,
  GlListboxTrigger,
} from "gitlab-ui-react/listbox";
import { DocsSearchTrigger } from "./docs-search-trigger";
import { githubRepoUrl, storybookUrl } from "../global";
import { useAstroSpriteIconKey } from "../hooks/use-astro-sprite-icon-key";
import { formatTemplate, isLocale, localeLabels, localizedPath, type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

const THEME_STORAGE_KEY = "gitlab-ui-react-theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("gl-dark", isDark);
  document.documentElement.dataset.pfTheme = isDark ? "dark" : "light";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

type NavbarProps = {
  locale: Locale;
  localeSwitchPath: string;
};

export function Navbar({ locale, localeSwitchPath }: NavbarProps) {
  const messages = siteMessages[locale];
  const links = [
    {
      href: localizedPath(locale),
      label: messages.navbar.home,
    },
    {
      href: localizedPath(locale, "/docs"),
      label: messages.navbar.docs,
    },
    {
      href: localizedPath(locale, "/docs/components/button"),
      label: messages.navbar.components,
    },
    {
      href: githubRepoUrl,
      label: "GitHub",
      external: true,
    },
    {
      href: storybookUrl,
      label: "Storybook",
      external: true,
    },
  ];
  const [isDark, setIsDark] = useState(() => (
    typeof document !== "undefined" && document.documentElement.classList.contains("gl-dark")
  ));
  const spriteIconKey = useAstroSpriteIconKey();

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

    function syncSystemTheme(event: MediaQueryListEvent) {
      if(localStorage.getItem(THEME_STORAGE_KEY) !== null) return;

      applyTheme(event.matches);
      setIsDark(event.matches);
    }

    setIsDark(document.documentElement.classList.contains("gl-dark"));
    colorScheme.addEventListener("change", syncSystemTheme);

    return () => colorScheme.removeEventListener("change", syncSystemTheme);
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;

    applyTheme(nextIsDark);
    setIsDark(nextIsDark);
    localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
  }

  return (
    <header className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 xl:px-28">
      <nav aria-label={messages.navbar.navigationLabel} className="flex flex-wrap *:hover:no-underline">
        {links.map(({ href, label, external }, i) => (
          <GlButton
            category="tertiary"
            href={href}
            target={external ? "_blank" : undefined}
            key={i}>
            {label}
            {external && " ↗"}
          </GlButton>
        ))}
      </nav>

      <div className="flex w-full flex-nowrap items-center gap-2 lg:w-auto">
        <span className="contents" id="documentation-navigation-toggle-target" />
        <GlButton
          key={`theme-toggle-${spriteIconKey}`}
          category="tertiary"
          icon={isDark ? "moon" : "sun"}
          onClick={toggleTheme}
          title={isDark ? messages.navbar.switchToLight : messages.navbar.switchToDark}/>
        <DocsSearchTrigger locale={locale} />
        <GlListbox
          value={locale}
          onValueChange={(value) => {
            if(isLocale(value) && value !== locale) void navigate(localeSwitchPath);
          }}>
          <GlListboxTrigger
            aria-label={formatTemplate(messages.navbar.languageLabel, { language: localeLabels[locale] })}
            key={`language-trigger-${spriteIconKey}`}
            icon="earth">
            <span className="max-sm:hidden">
              {localeLabels[locale]}
            </span>
          </GlListboxTrigger>
          <GlListboxContent>
            <GlListboxGroup>
              <GlListboxItem value="en">
                {localeLabels.en}
              </GlListboxItem>
              <GlListboxItem value="zh">
                {localeLabels.zh}
              </GlListboxItem>
            </GlListboxGroup>
          </GlListboxContent>
        </GlListbox>
      </div>
    </header>
  );
}

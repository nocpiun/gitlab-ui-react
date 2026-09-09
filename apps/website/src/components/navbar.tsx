import { useEffect, useState } from "react";
import { GlButton, GlFormInput, GlListbox, GlListboxContent, GlListboxGroup, GlListboxItem, GlListboxTrigger } from "gitlab-ui-react";
import { githubRepoUrl, storybookUrl } from "../global";

const THEME_STORAGE_KEY = "gitlab-ui-react-theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("gl-dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

const links = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/docs",
    label: "Docs",
  },
  {
    href: "/docs/components/button",
    label: "Components",
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

export function Navbar() {
  const [isDark, setIsDark] = useState(() => (
    typeof document !== "undefined" && document.documentElement.classList.contains("gl-dark")
  ));
  /** @todo */
  const [lang, setLang] = useState<"en-us" | "zh-cn">("en-us");

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
    <header className="flex! flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 xl:px-28">
      <nav aria-label="Primary navigation" className="flex flex-wrap *:hover:no-underline!">
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
        <GlButton
          category="tertiary"
          icon={isDark ? "moon" : "sun"}
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}/>
        <GlFormInput
          aria-label="Search documentation"
          className="min-w-0 flex-1! sm:min-w-56 lg:w-64!"
          placeholder="Search documents..."/>
        <GlListbox value={lang} onValueChange={(value) => setLang(value as any)}>
          {/** @todo */}
          <GlListboxTrigger icon="earth">
            English
          </GlListboxTrigger>
          <GlListboxContent>
            <GlListboxGroup>
              <GlListboxItem value="en-us">
                English
              </GlListboxItem>
              <GlListboxItem value="zh-cn">
                简体中文
              </GlListboxItem>
            </GlListboxGroup>
          </GlListboxContent>
        </GlListbox>
      </div>
    </header>
  );
}

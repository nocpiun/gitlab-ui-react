import { useEffect, useState } from "react";
import { GlButton, GlFormInput, GlListbox, GlListboxContent, GlListboxGroup, GlListboxItem, GlListboxTrigger } from "gitlab-ui-react";

const THEME_STORAGE_KEY = "gitlab-ui-react-theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("gl-dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

const links = [
  { href: "/", label: "Home" },
  {
    href: "/docs",
    label: "Docs",
  },
  {
    href: "/docs/components/button",
    label: "Components",
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
    <header className="px-28 py-6 flex! justify-between">
      <div className="flex flex-wrap *:hover:no-underline!">
        {links.map(({ href, label }, i) => (
          <GlButton category="tertiary" href={href} key={i}>
            {label}
          </GlButton>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <GlButton
          category="tertiary"
          icon={isDark ? "moon" : "sun"}
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}/>
        <GlFormInput
          className="w-fit!"
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

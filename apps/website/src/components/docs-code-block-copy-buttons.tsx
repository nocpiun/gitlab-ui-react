import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlButton } from "gitlab-ui-react/button";
import {
  GlTooltip,
  GlTooltipContent,
  GlTooltipTrigger,
} from "gitlab-ui-react/tooltip";
import { type Locale } from "../i18n/config";
import { siteMessages } from "../i18n/messages";

type CopyStatus = "copied" | "failed" | "idle";

type CopyTarget = {
  code: string;
  container: HTMLElement;
};

const COPY_FEEDBACK_DURATION = 1500;

function CodeCopyButton({ code, locale }: { code: string; locale: Locale }) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const label = siteMessages[locale].docs.codeCopy[status];

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleCopy = async () => {
    clearTimeout(resetTimer.current);

    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    resetTimer.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_DURATION);
  };

  return (
    <GlTooltip>
      <GlTooltipTrigger asChild>
        <GlButton
          aria-label={label}
          category="tertiary"
          className="docs-code-copy-button"
          icon={status === "copied" ? "check" : "copy-to-clipboard"}
          onClick={handleCopy}
          size="small" />
      </GlTooltipTrigger>
      <GlTooltipContent boundary="viewport" placement="top">
        {label}
      </GlTooltipContent>
    </GlTooltip>
  );
}

export function DocsCodeBlockCopyButtons({ locale }: { locale: Locale }) {
  const [targets, setTargets] = useState<CopyTarget[]>([]);

  useEffect(() => {
    const nextTargets = [...document.querySelectorAll<HTMLElement>(
      ".docs-content .docs-code-block",
    )].flatMap((container) => {
      const code = container.querySelector(":scope > pre > code")?.textContent;
      return code === null || code === undefined ? [] : [{ code, container }];
    });

    setTargets(nextTargets);
  }, []);

  return targets.map(({ code, container }, index) => (
    createPortal(<CodeCopyButton code={code} locale={locale} />, container, index)
  ));
}

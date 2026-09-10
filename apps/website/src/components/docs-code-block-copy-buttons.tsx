import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  GlButton,
  GlTooltip,
  GlTooltipContent,
  GlTooltipTrigger,
} from "gitlab-ui-react";

type CopyStatus = "copied" | "failed" | "idle";

type CopyTarget = {
  code: string;
  container: HTMLElement;
};

const COPY_FEEDBACK_DURATION = 1500;

const copyLabels: Record<CopyStatus, string> = {
  copied: "Code copied",
  failed: "Copy failed",
  idle: "Copy code",
};

function CodeCopyButton({ code }: { code: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const label = copyLabels[status];

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
      <GlTooltipTrigger>
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

export function DocsCodeBlockCopyButtons() {
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
    createPortal(<CodeCopyButton code={code} />, container, index)
  ));
}

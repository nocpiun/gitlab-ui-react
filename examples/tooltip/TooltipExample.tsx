import { GlButton } from "gitlab-ui-react/button";
import {
  GlTooltip,
  GlTooltipContent,
  GlTooltipTrigger,
} from "gitlab-ui-react/tooltip";

export default function TooltipExample() {
  return (
    <div className="flex min-h-[8rem] items-center justify-center">
      <GlTooltip>
        <GlTooltipTrigger asChild>
          <GlButton aria-label="Copy project ID" icon="copy-to-clipboard" />
        </GlTooltipTrigger>
        <GlTooltipContent>Copy project ID</GlTooltipContent>
      </GlTooltip>
    </div>
  );
}

import { GlButton } from "gitlab-ui-react/button";
import {
  GlTooltip,
  GlTooltipContent,
  GlTooltipTrigger,
} from "gitlab-ui-react/tooltip";

export default function TooltipPlacementsExample() {
  return (
    <div className="flex min-h-[10rem] flex-wrap items-center justify-center gap-6">
      <GlTooltip delay={0}>
        <GlTooltipTrigger asChild><GlButton>Top</GlButton></GlTooltipTrigger>
        <GlTooltipContent placement="top">Top tooltip</GlTooltipContent>
      </GlTooltip>
      <GlTooltip delay={0}>
        <GlTooltipTrigger asChild><GlButton>Right</GlButton></GlTooltipTrigger>
        <GlTooltipContent placement="right">Right tooltip</GlTooltipContent>
      </GlTooltip>
      <GlTooltip delay={0}>
        <GlTooltipTrigger asChild><GlButton>Bottom</GlButton></GlTooltipTrigger>
        <GlTooltipContent placement="bottom">Bottom tooltip</GlTooltipContent>
      </GlTooltip>
      <GlTooltip delay={0}>
        <GlTooltipTrigger asChild><GlButton>Left</GlButton></GlTooltipTrigger>
        <GlTooltipContent placement="left">Left tooltip</GlTooltipContent>
      </GlTooltip>
    </div>
  );
}

import { GlButton } from "gitlab-ui-react/button";
import {
  GlPopover,
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
} from "gitlab-ui-react/popover";

export default function PopoverClickExample() {
  return (
    <div className="flex min-h-[10rem] items-center justify-center">
      <GlPopover triggers={["click"]}>
        <GlPopoverTrigger asChild>
          <GlButton>Show details</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent showCloseButton>
          <GlPopoverTitle>Additional information</GlPopoverTitle>
          <p className="mb-0">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </GlPopoverContent>
      </GlPopover>
    </div>
  );
}

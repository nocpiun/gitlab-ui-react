import {
  GlPopover,
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
} from "gitlab-ui-react/popover";

export default function PopoverExample() {
  return (
    <div className="flex min-h-[10rem] items-center justify-center">
      <GlPopover>
        <GlPopoverTrigger>Hover or focus</GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverTitle>Additional information</GlPopoverTitle>
          <p className="mb-0">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </GlPopoverContent>
      </GlPopover>
    </div>
  );
}

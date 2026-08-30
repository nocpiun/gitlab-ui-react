/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/label/label.vue
 */

import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEventHandler,
} from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
import GlLink from "../link/link";

type LabelElementProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "className" | "onClick" | "style" | "title"
>;

export type GlLabelProps = LabelElementProps & {
  /** Background color in hex, rgb, or rgba format. */
  backgroundColor: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  /** Called when the optional remove button is activated. */
  onClose?: MouseEventHandler<HTMLElement>;
  /** Splits the title at its final `::` and renders the value with contrasting styling. */
  scoped?: boolean;
  /** Shows the label remove button. */
  showCloseButton?: boolean;
  style?: CSSProperties;
  /** URL that turns the label title into a link. */
  target?: string;
  /** Visible label title and accessible link name. */
  title: string;
  /** Prevents activation of the optional remove button. */
  disabled?: boolean;
};

// TODO: Add the upstream description, footer, and tooltipPlacement props after GlTooltip is ported.

type Rgb = [number, number, number];
type LabelTextColor = "dark" | "light";

const labelVariants = cva("gl-label", {
  variants: {
    scoped: {
      false: null,
      true: "gl-label-scoped",
    },
    textColor: {
      dark: "gl-label-text-dark",
      light: "gl-label-text-light",
    },
  },
});

function rgbFromHex(hex: string): Rgb | undefined {
  const cleanHex = hex.replace("#", "");
  const parts = cleanHex.length === 3
    ? cleanHex.split("").map((value) => value + value)
    : cleanHex.match(/[\da-f]{2}/gi);

  if(!parts || parts.length < 3) return undefined;

  const rgb = parts.slice(0, 3).map((value) => Number.parseInt(value, 16));
  return rgb.every(Number.isFinite) ? rgb as Rgb : undefined;
}

function rgbFromString(color: string, prefixLength: number): Rgb | undefined {
  const rgb = color
    .substring(prefixLength, color.length - 1)
    .split(",")
    .slice(0, 3)
    .map((value) => Number.parseInt(value, 10));

  return rgb.length === 3 && rgb.every(Number.isFinite) ? rgb as Rgb : undefined;
}

function toSrgb(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([red, green, blue]: Rgb) {
  return 0.2126 * toSrgb(red) + 0.7152 * toSrgb(green) + 0.0722 * toSrgb(blue);
}

function colorFromBackground(backgroundColor: string, contrastRatio = 2.4): LabelTextColor {
  let color: Rgb | undefined;

  if(backgroundColor.startsWith("#")) {
    color = rgbFromHex(backgroundColor);
  } else if(backgroundColor.startsWith("rgba(")) {
    color = rgbFromString(backgroundColor, 5);
  } else if(backgroundColor.startsWith("rgb(")) {
    color = rgbFromString(backgroundColor, 4);
  }

  if(!color) return "dark";

  const luminance = relativeLuminance(color);
  const lightLuminance = relativeLuminance([255, 255, 255]);
  const darkLuminance = relativeLuminance([24, 23, 29]);
  const contrastLight = (lightLuminance + 0.05) / (luminance + 0.05);
  const contrastDark = (luminance + 0.05) / (darkLuminance + 0.05);

  return contrastLight >= contrastRatio || contrastLight > contrastDark ? "light" : "dark";
}

const GlLabel = forwardRef<HTMLSpanElement, GlLabelProps>(function GlLabel({
  backgroundColor,
  className,
  disabled = false,
  onClick,
  onClose,
  scoped = false,
  showCloseButton = false,
  style,
  target = "",
  title,
  ...elementProps
}, forwardedRef) {
  const splitScopedLabelIndex = title.lastIndexOf("::");
  const scopedKey = scoped ? title.slice(0, splitScopedLabelIndex) : title;
  const scopedValue = title.slice(splitScopedLabelIndex + 2);
  const textColor = colorFromBackground(backgroundColor);
  const classes = labelVariants({ className, scoped, textColor });
  const labelStyle = {
    "--label-background-color": backgroundColor,
    "--label-inset-border": `inset 0 0 0 2px ${backgroundColor}`,
    ...style,
  } as CSSProperties;

  const labelText = (
    <>
      <span className="gl-label-text">{scopedKey}</span>
      {scoped && scopedValue
        ? <span className="gl-label-text-scoped">{scopedValue}</span>
        : null}
    </>
  );
  const labelContent = target ? (
    <GlLink
      className="gl-label-link gl-label-link-underline"
      href={target}
      tabIndex={0}
      variant="unstyled">
      {labelText}
    </GlLink>
  ) : (
    <span className="gl-label-link" tabIndex={0}>{labelText}</span>
  );

  return (
    <span
      {...elementProps}
      ref={forwardedRef}
      className={classes}
      onClick={onClick}
      style={labelStyle}>
      {labelContent}
      {showCloseButton ? (
        <GlButton
          aria-label={`Remove label - ${title}`}
          category="tertiary"
          className="gl-label-close"
          disabled={disabled}
          onClick={onClose}
          size="small"
          variant="reset">
          <GlIcon name="close-xs" size={12} />
        </GlButton>
      ) : null}
    </span>
  );
});

export default GlLabel;

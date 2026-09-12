import type { SVGProps } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import iconsSprite from "@gitlab/svgs/dist/icons.svg?raw";

const iconVariants = cva("gl-icon", {
  variants: {
    size: {
      8: "s8",
      12: "s12",
      14: "s14",
      16: "s16",
      24: "s24",
      32: "s32",
      48: "s48",
      72: "s72",
    },
    variant: {
      current: "gl-fill-current",
      default: "gl-fill-icon-default",
      subtle: "gl-fill-icon-subtle",
      strong: "gl-fill-icon-strong",
      disabled: "gl-fill-icon-disabled",
      link: "gl-fill-icon-link",
      info: "gl-fill-icon-info",
      warning: "gl-fill-icon-warning",
      danger: "gl-fill-icon-danger",
      success: "gl-fill-icon-success",
    },
  },
  defaultVariants: {
    size: 16,
    variant: "current",
  },
});

type IconVariantProps = VariantProps<typeof iconVariants>;

export type GlIconSize = NonNullable<IconVariantProps["size"]>;
export type GlIconVariant = NonNullable<IconVariantProps["variant"]>;

export type GlIconProps = Omit<
  SVGProps<SVGSVGElement>,
  "children" | "dangerouslySetInnerHTML" | "name"
> & {
  /**
   * Accessible icon name used by screen readers and other assistive technologies.
   * Provide this, or `aria-label`, when the icon is not merely decorative.
   */
  ariaLabel?: string;
  /** One of the bundled GitLab icons. */
  name: string;
  /** Icon size in pixels. */
  size?: GlIconSize;
  /** Semantic icon color. Icons inherit the current text color by default. */
  variant?: GlIconVariant;
};

type IconDefinition = {
  content: string;
  viewBox: string;
};

const symbolPattern = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi;
const namePattern = /(?:^|\s)id\s*=\s*(["'])(.*?)\1/i;
const viewBoxPattern = /(?:^|\s)viewBox\s*=\s*(["'])(.*?)\1/i;

function parseIcons(sprite: string) {
  const icons = new Map<string, IconDefinition>();

  for(const match of sprite.matchAll(symbolPattern)) {
    const [, attributes, content] = match;
    const name = namePattern.exec(attributes)?.[2];
    const viewBox = viewBoxPattern.exec(attributes)?.[2];

    if(name && viewBox) {
      icons.set(name, { content, viewBox });
    }
  }

  if(icons.size === 0) {
    throw new Error("[GlIcon] The bundled GitLab icon set is empty or invalid");
  }

  return icons;
}

const icons = parseIcons(iconsSprite);

export default function GlIcon({
  "aria-label": nativeAriaLabel,
  ariaLabel,
  className,
  name,
  size,
  variant,
  viewBox,
  ...svgProps
}: GlIconProps) {
  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;
  const icon = icons.get(name);

  if(!["production", "test"].includes(environment ?? "") && !icon) {
    console.warn(`[GlIcon] Icon '${name}' is not a known icon of @gitlab/svgs`);
  }

  const accessibleLabel = ariaLabel ?? nativeAriaLabel;

  return (
    <svg
      {...svgProps}
      key={name}
      viewBox={viewBox ?? icon?.viewBox}
      className={iconVariants({ className, size, variant })}
      data-testid={`${name}-icon`}
      role="img"
      aria-hidden={accessibleLabel ? undefined : true}
      aria-label={accessibleLabel}
      // The markup comes from the pinned @gitlab/svgs build-time dependency.
      dangerouslySetInnerHTML={icon ? { __html: icon.content } : undefined} />
  );
}

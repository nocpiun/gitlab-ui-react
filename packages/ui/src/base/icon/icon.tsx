import type { SVGProps } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import iconsInfo from "@gitlab/svgs/dist/icons.json";
import iconsPath from "@gitlab/svgs/dist/icons.svg";

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

export type GlIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "name"> & {
  /**
   * Accessible icon name used by screen readers and other assistive technologies.
   * Provide this, or `aria-label`, when the icon is not merely decorative.
   */
  ariaLabel?: string;
  /** One of the icons in the GitLab SVG sprite. */
  name: string;
  /** Icon size in pixels. */
  size?: GlIconSize;
  /** Semantic icon color. Icons inherit the current text color by default. */
  variant?: GlIconVariant;
};

const knownIcons = new Set(iconsInfo.icons);

export default function GlIcon({
  "aria-label": nativeAriaLabel,
  ariaLabel,
  className,
  name,
  size,
  variant,
  ...svgProps
}: GlIconProps) {
  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;

  if(!["production", "test"].includes(environment ?? "") && !knownIcons.has(name)) {
    console.warn(`[GlIcon] Icon '${name}' is not a known icon of @gitlab/svgs`);
  }

  const accessibleLabel = ariaLabel ?? nativeAriaLabel;
  const spriteHref = `${iconsPath}#${name}`;

  return (
    <svg
      {...svgProps}
      key={spriteHref}
      className={iconVariants({ className, size, variant })}
      data-testid={`${name}-icon`}
      role="img"
      aria-hidden={accessibleLabel ? undefined : true}
      aria-label={accessibleLabel}>
      <use href={spriteHref} />
    </svg>
  );
}

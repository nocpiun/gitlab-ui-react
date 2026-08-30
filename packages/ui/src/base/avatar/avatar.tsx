/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/avatar/avatar.vue
 * packages/gitlab-ui/src/components/base/avatar/utils.js
 */

import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactEventHandler,
  type Ref,
} from "react";
import { cva } from "class-variance-authority";
import emojiRegex from "emoji-regex";

const AVATAR_SIZES = [96, 64, 48, 32, 24, 16] as const;
const DEFAULT_AVATAR_SIZE: GlAvatarSize = 32;
const IDENTICON_BACKGROUND_COUNT = 7;
const STARTS_WITH_EMOJI = new RegExp(`^(${emojiRegex().source})`);

export type GlAvatarSize = typeof AVATAR_SIZES[number];
export type GlAvatarShape = "circle" | "rect";
export type GlAvatarResponsiveSize = {
  default?: GlAvatarSize;
  sm?: GlAvatarSize;
  md?: GlAvatarSize;
  lg?: GlAvatarSize;
};

type AvatarImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "children" | "className" | "onError" | "src"
>;

export type GlAvatarProps = AvatarImageProps & {
  /** Alternative text for image avatars. Use an empty string next to descriptive text. */
  alt?: string;
  className?: string;
  /** Stable entity ID used to select one of the seven identicon colors. */
  entityId?: number;
  /** Entity name used to generate the identicon character. */
  entityName?: string;
  /** Replaces an image with its identicon after the image fails to load. */
  fallbackOnError?: boolean;
  /** Called for the native image error event, matching GitLab UI's `load-error` event. */
  onLoadError?: ReactEventHandler<HTMLImageElement>;
  onError?: ReactEventHandler<HTMLImageElement>;
  shape?: GlAvatarShape;
  /** A fixed size or sizes that respond at the `sm`, `md`, and `lg` breakpoints. */
  size?: GlAvatarSize | GlAvatarResponsiveSize;
  src?: string;
};

const avatarVariants = cva("gl-avatar", {
  variants: {
    kind: {
      identicon: "gl-avatar-identicon",
      image: null,
    },
    shape: {
      circle: "gl-avatar-circle",
      rect: null,
    },
  },
  defaultVariants: {
    kind: "image",
    shape: "circle",
  },
});

function getAvatarCharacter(name: string) {
  if(!name) return "";

  return name.match(STARTS_WITH_EMOJI)?.[0] ?? name.charAt(0).toUpperCase();
}

function getAvatarSizeClasses(size: GlAvatarProps["size"]) {
  if(typeof size === "number") return [`gl-avatar-s${size}`];

  const { default: defaultSize, ...responsiveSizes } = size ?? {};
  const classes = [`gl-avatar-s${defaultSize || DEFAULT_AVATAR_SIZE}`];

  for(const [breakpoint, responsiveSize] of Object.entries(responsiveSizes)) {
    classes.push(`gl-${breakpoint}-avatar-s${responsiveSize}`);
  }

  return classes;
}

function validateAvatarSize(size: GlAvatarProps["size"]) {
  const sizes = typeof size === "number" ? [size] : Object.values(size ?? {});

  for(const candidate of sizes) {
    if(!AVATAR_SIZES.includes(candidate as GlAvatarSize)) {
      console.error(`Avatar size should be one of [${AVATAR_SIZES}], received: ${candidate}`);
    }
  }
}

const GlAvatar = forwardRef<HTMLDivElement | HTMLImageElement, GlAvatarProps>(function GlAvatar({
  alt = "avatar",
  className,
  entityId = 0,
  entityName = "",
  fallbackOnError = false,
  onError,
  onLoadError,
  shape = "circle",
  size = DEFAULT_AVATAR_SIZE,
  src = "",
  ...elementProps
}, forwardedRef) {
  const [failedSource, setFailedSource] = useState<string>();
  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;

  if(environment !== "production") validateAvatarSize(size);

  const showImage = Boolean(src) && !(fallbackOnError && failedSource === src);
  const sizeClasses = getAvatarSizeClasses(size);
  const identiconBackground = `gl-avatar-identicon-bg${(entityId % IDENTICON_BACKGROUND_COUNT) + 1}`;

  if(showImage) {
    const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
      setFailedSource(src);
      onError?.(event);
      onLoadError?.(event);
    };

    return (
      <img
        {...elementProps}
        ref={forwardedRef as Ref<HTMLImageElement>}
        alt={alt}
        className={avatarVariants({
          className: [...sizeClasses, className],
          kind: "image",
          shape,
        })}
        onError={handleError}
        src={src} />
    );
  }

  return (
    <div
      {...elementProps as unknown as HTMLAttributes<HTMLDivElement>}
      ref={forwardedRef as Ref<HTMLDivElement>}
      aria-hidden="true"
      className={avatarVariants({
        className: [...sizeClasses, identiconBackground, className],
        kind: "identicon",
        shape,
      })}>
      {getAvatarCharacter(entityName)}
    </div>
  );
});

export default GlAvatar;

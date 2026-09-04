/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/skeleton_loader/skeleton_loader.vue
 *
 * Adaptations:
 * - Vue's default slot maps to `children` containing SVG shapes.
 * - React `useId()` replaces the upstream random ID and remains stable across
 *   server rendering and hydration.
 * - Reduced-motion preference changes are observed after mount instead of
 *   being sampled only once during render.
 * - Common DOM attributes and the root element ref are forwarded to the
 *   actual `div` or `svg` root.
 */

import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useId,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type SVGProps,
} from "react";
import { cva } from "class-variance-authority";

const DEFAULT_LINE_MAX_WIDTH = 235;
const DEFAULT_LINE_WIDTH_PERCENTAGES = [65, 100, 85];
const DEFAULT_LINE_HEIGHT = 10;
const DEFAULT_LINE_SPACING = 4;
const DEFAULT_SVG_WIDTH = 400;
const DEFAULT_SVG_HEIGHT = 130;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type SkeletonLoaderElementProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
>;

export type GlSkeletonLoaderProps = SkeletonLoaderElementProps & {
  /** Relative URL prefixed to SVG fragment references when the page uses a base URL. */
  baseUrl?: string;
  /** SVG shapes used instead of the default line skeleton. */
  children?: ReactNode;
  /** Makes every default skeleton line span the full available width. */
  equalWidthLines?: boolean;
  /** SVG viewBox height. Also fixes the default wrapper height when provided. */
  height?: number | null;
  /** Number of lines rendered by the default skeleton. */
  lines?: number;
  /** Value of the SVG `preserveAspectRatio` attribute. */
  preserveAspectRatio?: string;
  /** Stable prefix for the internal clip path and gradient IDs. */
  uniqueKey?: string;
  /** SVG viewBox width. Also fixes the default wrapper width when provided. */
  width?: number | null;
};

const defaultContainerVariants = cva([
  "gl-skeleton-loader-default-container",
  "gl-max-w-full",
]);

const skeletonVariants = cva("gl-skeleton-loader", {
  variants: {
    defaultLayout: {
      false: null,
      true: "gl-w-full gl-h-full",
    },
  },
});

function getReducedMotionSnapshot() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  if(typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

  if(typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onStoreChange);
    return () => mediaQuery.removeEventListener("change", onStoreChange);
  }

  mediaQuery.addListener(onStoreChange);
  return () => mediaQuery.removeListener(onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

function hasRenderableChildren(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return hasRenderableChildren(child.props.children);
    }

    return child !== "";
  });
}

const GlSkeletonLoader = forwardRef<
  HTMLDivElement | SVGSVGElement,
  GlSkeletonLoaderProps
>(function GlSkeletonLoader({
  baseUrl = "",
  children,
  className,
  equalWidthLines = false,
  height = null,
  lines = 3,
  preserveAspectRatio = "xMidYMid meet",
  style,
  uniqueKey,
  width = null,
  ...elementProps
}, forwardedRef) {
  const generatedKey = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
  const resolvedUniqueKey = uniqueKey ?? generatedKey;
  const hasCustomShapes = hasRenderableChildren(children);
  const svgWidth = width ?? (hasCustomShapes ? DEFAULT_SVG_WIDTH : DEFAULT_LINE_MAX_WIDTH);
  const svgHeight = height ?? (hasCustomShapes
    ? DEFAULT_SVG_HEIGHT
    : lines * DEFAULT_LINE_HEIGHT + (lines - 1) * DEFAULT_LINE_SPACING);
  const clipId = `${resolvedUniqueKey}-idClip`;
  const gradientId = `${resolvedUniqueKey}-idGradient`;
  const reducedMotion = usePrefersReducedMotion();

  const defaultLines = Array.from({ length: lines }, (_, index) => (
    <rect
      key={index}
      height={DEFAULT_LINE_HEIGHT}
      rx={4}
      width={equalWidthLines
        ? "100%"
        : `${DEFAULT_LINE_WIDTH_PERCENTAGES[index % DEFAULT_LINE_WIDTH_PERCENTAGES.length]}%`}
      y={index * (DEFAULT_LINE_HEIGHT + DEFAULT_LINE_SPACING)} />
  ));

  const svgChildren = (
    <>
      <title>Loading</title>
      <rect
        className={reducedMotion
          ? "gl-skeleton-loader-fill-background-color"
          : undefined}
        clipPath={`url(${baseUrl}#${clipId})`}
        fill={reducedMotion ? undefined : `url(${baseUrl}#${gradientId})`}
        height={svgHeight}
        width={svgWidth}
        x={0}
        y={0} />
      <defs>
        <clipPath id={clipId}>
          {hasCustomShapes ? children : defaultLines}
        </clipPath>
        {reducedMotion ? null : (
          <linearGradient id={gradientId}>
            <stop className="background-stop" offset="0%">
              <animate
                attributeName="offset"
                dur="1s"
                repeatCount="indefinite"
                values="-2; 1" />
            </stop>
            <stop className="shimmer-stop" offset="50%">
              <animate
                attributeName="offset"
                dur="1s"
                repeatCount="indefinite"
                values="-1.5; 1.5" />
            </stop>
            <stop className="background-stop" offset="100%">
              <animate
                attributeName="offset"
                dur="1s"
                repeatCount="indefinite"
                values="-1; 2" />
            </stop>
          </linearGradient>
        )}
      </defs>
    </>
  );

  if(hasCustomShapes) {
    return (
      <svg
        {...elementProps as SVGProps<SVGSVGElement>}
        ref={forwardedRef as Ref<SVGSVGElement>}
        className={skeletonVariants({ className, defaultLayout: false })}
        preserveAspectRatio={preserveAspectRatio}
        style={style}
        version="1.1"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {svgChildren}
      </svg>
    );
  }

  return (
    <div
      {...elementProps as HTMLAttributes<HTMLDivElement>}
      ref={forwardedRef as Ref<HTMLDivElement>}
      className={defaultContainerVariants({ className })}
      style={{
        ...style,
        height: height === null ? style?.height : `${height}px`,
        width: width === null ? style?.width : `${width}px`,
      }}>
      <svg
        className={skeletonVariants({ defaultLayout: true })}
        preserveAspectRatio={preserveAspectRatio}
        version="1.1"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {svgChildren}
      </svg>
    </div>
  );
});

export default GlSkeletonLoader;

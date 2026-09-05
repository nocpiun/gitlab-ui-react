/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/tabs/tab/tab.vue
 *
 * GlTab is a declarative child of GlTabs. GlTabs reads its props to render the
 * corresponding Base UI tab trigger and panel in their required DOM regions.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import type { ClassValue } from "cn";

export type GlTabButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "disabled" | "role" | "type"
>;

export type GlTabPanelProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "hidden" | "role"
>;

export type GlTabProps = {
  /** The content rendered in this tab's panel. */
  children?: ReactNode;
  /** Prevents the tab from being selected. */
  disabled?: boolean;
  /** Mounts the panel only while it is active. Overrides GlTabs.lazy. */
  lazy?: boolean;
  /** Additional attributes applied to the tab panel. */
  panelProps?: GlTabPanelProps;
  /** Additional clsx-compatible classes applied to the tab panel. */
  panelClassName?: ClassValue;
  /** Query string value used when GlTabs synchronizes selection with the URL. */
  queryParamValue?: string | null;
  /** Numeric badge displayed after the tab title. Negative values are hidden. */
  tabCount?: number | null;
  /** Screen-reader context for tabCount, for example "15 open issues". */
  tabCountSrText?: string | null;
  /** Additional attributes applied to the tab button. */
  tabProps?: GlTabButtonProps;
  /** The accessible and visible tab title. */
  title: ReactNode;
  /** Additional clsx-compatible classes applied to the tab list item. */
  titleItemClassName?: ClassValue;
  /** Additional clsx-compatible classes applied to the tab button. */
  titleClassName?: ClassValue;
};

/**
 * Declarative tab descriptor. It is consumed by GlTabs and does not render on
 * its own.
 */
export default function GlTab(_: GlTabProps) {
  return null;
}

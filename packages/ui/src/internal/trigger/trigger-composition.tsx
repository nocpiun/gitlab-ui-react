import {
  Fragment,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import GlButton, {
  type GlButtonCategory,
  type GlButtonSize,
  type GlButtonVariant,
} from "../../base/button/button";

export type GlTriggerDefaultProps = {
  /** Renders the trigger content inside a GitLab-styled button. */
  asChild?: false;
  block?: boolean;
  category?: GlButtonCategory;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
  size?: GlButtonSize;
  style?: CSSProperties;
  variant?: GlButtonVariant;
};

export type GlTriggerAsChildProps = {
  /** Composes trigger behavior onto the single child element. */
  asChild: true;
  block?: never;
  category?: never;
  children: ReactElement;
  className?: string;
  disabled?: boolean;
  icon?: never;
  loading?: never;
  size?: never;
  style?: CSSProperties;
  variant?: never;
};

export type GlTriggerButtonOptions = Pick<
  GlTriggerDefaultProps,
  "block" | "category" | "disabled" | "icon" | "loading" | "size" | "variant"
>;

function resolveAsChildElement(componentName: string, children: ReactNode): ReactElement {
  if(!isValidElement(children) || children.type === Fragment) {
    throw new Error(
      `${componentName} with \`asChild\` requires exactly one non-Fragment React element child.`,
    );
  }

  return children;
}

export function resolveTriggerRender(
  componentName: string,
  asChild: boolean,
  children: ReactNode,
  buttonOptions: GlTriggerButtonOptions,
  defaultRender?: ReactElement,
): ReactElement {
  if(asChild) return resolveAsChildElement(componentName, children);

  return defaultRender ?? <GlButton {...buttonOptions} />;
}

export function resolveTriggerContent(
  asChild: boolean,
  children: ReactNode,
  defaultContent: ReactNode = children,
): ReactNode {
  return asChild ? undefined : defaultContent;
}

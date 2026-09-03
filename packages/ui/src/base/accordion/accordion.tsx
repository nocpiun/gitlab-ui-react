/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/accordion/accordion.vue
 * packages/gitlab-ui/src/components/base/accordion/accordion_item.vue
 *
 * Adaptations:
 * - Base UI Accordion supplies the disclosure semantics, keyboard behavior,
 *   stable trigger/panel relationships, and transition state.
 * - Vue's `visible`/`input` model maps to controlled `visible` /
 *   `onVisibleChange`; `defaultVisible` provides the idiomatic uncontrolled
 *   initial state. Unlike Vue's model bootstrap event, the callback is not
 *   invoked merely because the component mounted.
 * - Vue's injected accordion settings map to React context. Each item owns a
 *   Base UI root so item-level controlled state remains possible while the
 *   parent coordinates the optional sibling auto-collapse behavior.
 */

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "cn";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";

export type GlAccordionHeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type GlAccordionProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Closes other items when one item is opened. */
  autoCollapse?: boolean;
  children?: ReactNode;
  /** Default heading level used by child items. */
  headerLevel: GlAccordionHeaderLevel;
};

export type GlAccordionItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "title"
> & {
  children?: ReactNode;
  /** Initial expansion state when the item is uncontrolled. */
  defaultVisible?: boolean;
  /** Additional clsx-compatible classes applied to the heading. */
  headerClass?: ClassValue;
  /** Overrides the heading level inherited from GlAccordion. */
  headerLevel?: GlAccordionHeaderLevel;
  /** Called when the user or auto-collapse behavior requests a state change. */
  onVisibleChange?: (visible: boolean) => void;
  /** Text displayed by the accordion trigger. */
  title: string;
  /** Alternate trigger text displayed while expanded. */
  titleVisible?: string | null;
  /** Stable item value used to coordinate sibling items. */
  value?: string;
  /** Controlled expansion state. */
  visible?: boolean;
};

type AccordionContextValue = {
  activeItemValue: string | null;
  autoCollapse: boolean;
  headerLevel: GlAccordionHeaderLevel;
  onItemOpen(value: string): void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

const accordionVariants = cva("gl-accordion");
const accordionItemVariants = cva("gl-accordion-item");
const accordionHeaderVariants = cva("gl-accordion-item-header");

const GlAccordion = forwardRef<HTMLDivElement, GlAccordionProps>(function GlAccordion({
  autoCollapse = false,
  children,
  className,
  headerLevel,
  ...elementProps
}, forwardedRef) {
  const [activeItemValue, setActiveItemValue] = useState<string | null>(null);
  const contextValue = useMemo<AccordionContextValue>(() => ({
    activeItemValue,
    autoCollapse,
    headerLevel,
    onItemOpen: setActiveItemValue,
  }), [activeItemValue, autoCollapse, headerLevel]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        {...elementProps}
        ref={forwardedRef}
        className={accordionVariants({ className })}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});

export const GlAccordionItem = forwardRef<HTMLDivElement, GlAccordionItemProps>(
  function GlAccordionItem({
    children,
    className,
    defaultVisible = false,
    headerClass,
    headerLevel,
    onVisibleChange,
    title,
    titleVisible = null,
    value,
    visible,
    ...elementProps
  }, forwardedRef) {
    const context = useContext(AccordionContext);
    const generatedId = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
    const itemValue = value ?? `accordion-item-${generatedId}`;
    const panelId = `${itemValue}-panel`;
    const resolvedHeaderLevel = headerLevel ?? context?.headerLevel ?? 3;
    const Heading = `h${resolvedHeaderLevel}` as const;
    const isControlled = visible !== undefined;
    const [uncontrolledVisible, setUncontrolledVisible] = useState(defaultVisible);
    const isVisible = visible ?? uncontrolledVisible;
    const previousVisibleRef = useRef(isVisible);

    useEffect(() => {
      const wasVisible = previousVisibleRef.current;
      const becameVisible = isVisible && !wasVisible;
      previousVisibleRef.current = isVisible;

      // A controlled item can become visible through props. Mark it active
      // before applying the previous active value to sibling-collapse logic.
      if(becameVisible) {
        context?.onItemOpen(itemValue);
        return;
      }

      if(
        !context?.autoCollapse
        || context.activeItemValue === null
        || context.activeItemValue === itemValue
        || !isVisible
      ) return;

      if(!isControlled) setUncontrolledVisible(false);
      onVisibleChange?.(false);
    }, [context, isControlled, isVisible, itemValue, onVisibleChange]);

    const handleValueChange = (nextValue: string[]) => {
      const nextVisible = nextValue.includes(itemValue);
      if(!isControlled) setUncontrolledVisible(nextVisible);
      onVisibleChange?.(nextVisible);
      if(nextVisible) context?.onItemOpen(itemValue);
    };

    return (
      <BaseAccordion.Root
        {...elementProps}
        ref={forwardedRef}
        className={accordionItemVariants({ className })}
        keepMounted
        onValueChange={handleValueChange}
        value={isVisible ? [itemValue] : []}>
        <BaseAccordion.Item value={itemValue}>
          <BaseAccordion.Header
            className={accordionHeaderVariants({
              className: clsx(headerClass) || undefined,
            })}
            render={<Heading />}>
            <BaseAccordion.Trigger
              aria-controls={panelId}
              className="gl-accordion-item-trigger"
              nativeButton
              render={(
                <GlButton
                  buttonTextClasses="gl-flex gl-items-start gl-gap-2"
                  className="gl-max-w-full"
                  variant="link" />
              )}>
              <GlIcon
                className="gl-accordion-item-chevron gl-shrink-0"
                name="chevron-right" />
              <span className="gl-min-w-0 gl-text-wrap gl-break-words gl-text-left">
                {isVisible && titleVisible ? titleVisible : title}
              </span>
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel
            className="gl-accordion-item-panel"
            data-testid={`accordion-item-collapse-${itemValue}`}
            id={panelId}>
            <div className="gl-mt-3 gl-text-base">{children}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      </BaseAccordion.Root>
    );
  },
);

export default GlAccordion;

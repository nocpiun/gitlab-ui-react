import { GlAccordion, GlAccordionItem } from "gitlab-ui-react/accordion";

export default function AccordionAutoCollapseExample() {
  return (
    <GlAccordion autoCollapse headerLevel={3}>
      <GlAccordionItem defaultVisible title="Planning" value="planning">
        Define the scope and expected outcome.
      </GlAccordionItem>
      <GlAccordionItem title="Implementation" value="implementation">
        Build and review the proposed change.
      </GlAccordionItem>
      <GlAccordionItem title="Release" value="release">
        Verify the change before deployment.
      </GlAccordionItem>
    </GlAccordion>
  );
}

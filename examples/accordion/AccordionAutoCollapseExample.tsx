import {
  GlAccordion,
  GlAccordionItem,
} from "gitlab-ui-react/accordion";

export default function AccordionAutoCollapseExample() {
  return (
    <GlAccordion autoCollapse headerLevel={3}>
      <GlAccordionItem defaultVisible title="Plan" value="plan">
        Define the problem and the desired outcome.
      </GlAccordionItem>
      <GlAccordionItem title="Build" value="build">
        Implement the smallest complete solution.
      </GlAccordionItem>
      <GlAccordionItem title="Verify" value="verify">
        Test the behavior and review the result.
      </GlAccordionItem>
    </GlAccordion>
  );
}

import { GlAccordion, GlAccordionItem } from "gitlab-ui-react/accordion";

export default function AccordionExample() {
  return (
    <GlAccordion headerLevel={3}>
      <GlAccordionItem title="Deployment details" value="deployment">
        The deployment completed successfully.
      </GlAccordionItem>
      <GlAccordionItem defaultVisible title="Approval status" value="approval">
        Two approvals are required before merge.
      </GlAccordionItem>
      <GlAccordionItem title="Audit events" value="audit-events">
        Five events were recorded for this change.
      </GlAccordionItem>
    </GlAccordion>
  );
}

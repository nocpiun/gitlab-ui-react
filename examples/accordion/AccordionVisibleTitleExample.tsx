import {
  GlAccordion,
  GlAccordionItem,
} from "gitlab-ui-react/accordion";

export default function AccordionVisibleTitleExample() {
  return (
    <GlAccordion headerLevel={3}>
      <GlAccordionItem
        defaultVisible
        title="Show deployment details"
        titleVisible="Hide deployment details"
        value="deployment-details">
        This deployment was created from the main branch and targets production.
      </GlAccordionItem>
    </GlAccordion>
  );
}

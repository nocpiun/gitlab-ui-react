import {
  GlAccordion,
  GlAccordionItem,
} from "gitlab-ui-react/accordion";

export default function AccordionExample() {
  return (
    <GlAccordion headerLevel={3}>
      <GlAccordionItem title="What is an accordion?" value="definition">
        An accordion shows and hides related supporting content.
      </GlAccordionItem>
      <GlAccordionItem defaultVisible title="When should I use one?" value="usage">
        Use one to shorten a page while keeping secondary information nearby.
      </GlAccordionItem>
      <GlAccordionItem title="Can several items stay open?" value="behavior">
        Yes. Items expand independently unless autoCollapse is enabled.
      </GlAccordionItem>
    </GlAccordion>
  );
}

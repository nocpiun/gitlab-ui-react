import { useState } from "react";
import { GlAccordion, GlAccordionItem } from "gitlab-ui-react/accordion";

export default function AccordionControlledExample() {
  const [visible, setVisible] = useState(true);

  return (
    <GlAccordion headerLevel={3}>
      <GlAccordionItem
        onVisibleChange={setVisible}
        title="Show pipeline details"
        titleVisible="Hide pipeline details"
        value="pipeline-details"
        visible={visible}>
        The pipeline passed all required jobs.
      </GlAccordionItem>
    </GlAccordion>
  );
}

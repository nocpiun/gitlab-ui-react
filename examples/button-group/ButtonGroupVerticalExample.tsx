import { GlButton } from "gitlab-ui-react/button";
import { GlButtonGroup } from "gitlab-ui-react/button-group";

export default function ButtonGroupVerticalExample() {
  return (
    <GlButtonGroup vertical>
      <GlButton>Download</GlButton>
      <GlButton>Browse</GlButton>
      <GlButton variant="danger">Delete</GlButton>
    </GlButtonGroup>
  );
}

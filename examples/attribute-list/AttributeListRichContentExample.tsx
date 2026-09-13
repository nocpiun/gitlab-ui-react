import {
  GlAttributeList,
  GlAttributeListItem,
} from "gitlab-ui-react/attribute-list";
import { GlBadge } from "gitlab-ui-react/badge";
import { GlLink } from "gitlab-ui-react/link";

export default function AttributeListRichContentExample() {
  return (
    <GlAttributeList>
      <GlAttributeListItem icon="code" label="File">
        <code>devfile.yaml</code>
      </GlAttributeListItem>
      <GlAttributeListItem icon="work-item-issue" label="Issue">
        <GlLink href="#issue">#12345</GlLink>
      </GlAttributeListItem>
      <GlAttributeListItem icon="merge-request" label="Merge request">
        <GlBadge href="#merge-request" icon="merge-request" variant="success">
          !12345
        </GlBadge>
      </GlAttributeListItem>
    </GlAttributeList>
  );
}

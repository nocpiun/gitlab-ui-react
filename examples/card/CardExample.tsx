import { GlButton } from "gitlab-ui-react/button";
import {
  GlCard,
  GlCardContent,
  GlCardFooter,
  GlCardHeader,
} from "gitlab-ui-react/card";

export default function CardExample() {
  return (
    <GlCard>
      <GlCardHeader>
        <h3>Example Card</h3>
      </GlCardHeader>
      <GlCardContent>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </GlCardContent>
      <GlCardFooter>
        <GlButton size="small" href="#opanel">View more</GlButton>
      </GlCardFooter>
    </GlCard>
  );
}

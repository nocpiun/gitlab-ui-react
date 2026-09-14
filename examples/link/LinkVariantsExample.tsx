import { GlLink } from "gitlab-ui-react/link";

export default function LinkVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <GlLink href="#default">Default link</GlLink>
      <p className="mb-0">
        Use an <GlLink href="#inline" variant="inline">inline link</GlLink> in a sentence.
      </p>
      <GlLink href="#metadata" variant="meta">Metadata link</GlLink>
      <GlLink href="#NriotHrreion" variant="mention">@NriotHrreion</GlLink>
      <GlLink href="#Norcleeh" variant="mentionCurrent">@Norcleeh</GlLink>
    </div>
  );
}

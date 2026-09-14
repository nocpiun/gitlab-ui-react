import { GlToken } from "gitlab-ui-react/token";

export default function TokenVariantsExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <GlToken>Default</GlToken>
      <GlToken variant="search-type">Author</GlToken>
      <GlToken variant="search-value">Norcleeh</GlToken>
      <GlToken viewOnly>View only</GlToken>
    </div>
  );
}

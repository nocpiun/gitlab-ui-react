import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormDate } from "gitlab-ui-react/form-date";

export default function FormDateLimitsExample() {
  return (
    <GlFormField className="max-w-xs">
      <GlFormFieldLabel htmlFor="release-date">
        Release date
      </GlFormFieldLabel>
      <GlFormDate
        defaultValue="2026-08-20"
        id="release-date"
        min="2026-09-01"
        max="2026-09-30"
        minInvalidFeedback="Choose a date on or after September 1, 2026." />
    </GlFormField>
  );
}

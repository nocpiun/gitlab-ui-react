import { GlFormDate } from "gitlab-ui-react/form-date";

export default function FormDateLimitsExample() {
  return (
    <div className="max-w-xs">
      <label className="mb-2 block font-bold" htmlFor="release-date">
        Release date
      </label>
      <GlFormDate
        defaultValue="2026-08-20"
        id="release-date"
        min="2026-09-01"
        max="2026-09-30"
        minInvalidFeedback="Choose a date on or after September 1, 2026." />
    </div>
  );
}

import { GlFormDate } from "gitlab-ui-react/form-date";

export default function FormDateExample() {
  return (
    <div className="max-w-xs">
      <label className="mb-2 block font-bold" htmlFor="due-date">
        Due date
      </label>
      <GlFormDate id="due-date" />
    </div>
  );
}

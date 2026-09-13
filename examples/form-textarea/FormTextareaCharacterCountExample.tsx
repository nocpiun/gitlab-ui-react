import { useState } from "react";
import { GlFormTextarea } from "gitlab-ui-react/form-textarea";

const limit = 100;

export default function FormTextareaCharacterCountExample() {
  const [value, setValue] = useState("Lorem ipsum dolor sit amet.");
  const remaining = limit - value.length;

  return (
    <div className="max-w-lg">
      <label className="mb-2 block font-bold" htmlFor="summary">
        Summary
      </label>
      <GlFormTextarea
        characterCountLimit={limit}
        characterCountOverLimitText={`${Math.abs(remaining)} characters over limit.`}
        id="summary"
        remainingCharacterCountText={`${Math.max(remaining, 0)} characters remaining.`}
        value={value}
        onValueChange={setValue} />
    </div>
  );
}

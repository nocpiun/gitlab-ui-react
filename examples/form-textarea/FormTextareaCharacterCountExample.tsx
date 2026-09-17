import { useState } from "react";
import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormTextarea } from "gitlab-ui-react/form-textarea";

const limit = 100;

export default function FormTextareaCharacterCountExample() {
  const [value, setValue] = useState("Lorem ipsum dolor sit amet.");
  const remaining = limit - value.length;

  return (
    <GlFormField className="max-w-lg">
      <GlFormFieldLabel htmlFor="summary">
        Summary
      </GlFormFieldLabel>
      <GlFormTextarea
        characterCountLimit={limit}
        characterCountOverLimitText={`${Math.abs(remaining)} characters over limit.`}
        id="summary"
        remainingCharacterCountText={`${Math.max(remaining, 0)} characters remaining.`}
        value={value}
        onValueChange={setValue} />
    </GlFormField>
  );
}

import { useState } from "react";
import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormCharacterCount } from "gitlab-ui-react/form-character-count";
import { GlFormInput } from "gitlab-ui-react/form-input";

const limit = 40;

export default function FormCharacterCountExample() {
  const [value, setValue] = useState("");
  const remaining = limit - value.length;

  return (
    <GlFormField className="max-w-md">
      <GlFormFieldLabel htmlFor="summary">
        Summary
      </GlFormFieldLabel>
      <GlFormInput
        aria-describedby="summary-count"
        id="summary"
        value={value}
        onValueChange={(nextValue) => setValue(String(nextValue))} />
      <GlFormCharacterCount
        countTextId="summary-count"
        limit={limit}
        overLimitText={`${Math.abs(remaining)} characters over limit.`}
        remainingCountText={`${Math.max(remaining, 0)} characters remaining.`}
        value={value} />
    </GlFormField>
  );
}

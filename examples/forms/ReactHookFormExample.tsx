import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { GlButton } from "gitlab-ui-react/button";
import {
  GlFormField,
  GlFormFieldError,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function ReactHookFormExample() {
  const id = useId();
  const form = useForm<{ username: string }>({
    defaultValues: { username: "" },
  });

  return (
    <form
      className="grid max-w-md gap-4"
      noValidate
      onSubmit={form.handleSubmit((values) => console.log(values))}>
      <Controller
        name="username"
        control={form.control}
        rules={{
          validate: (value) => value.trim().length >= 3
            || "Username must be at least 3 characters.",
        }}
        render={({ field, fieldState }) => (
          <GlFormField aria-labelledby={`${id}-label`}>
            <GlFormFieldLabel htmlFor={id} id={`${id}-label`}>
              Username
            </GlFormFieldLabel>
            <GlFormInput
              {...field}
              id={id}
              state={fieldState.invalid ? false : null}
              aria-describedby={fieldState.invalid ? `${id}-error` : undefined} />
            {fieldState.invalid && (
              <GlFormFieldError id={`${id}-error`} role="alert">
                {fieldState.error?.message}
              </GlFormFieldError>
            )}
          </GlFormField>
        )} />
      <div className="flex gap-3">
        <GlButton type="submit" variant="confirm">Submit</GlButton>
        <GlButton type="button" onClick={() => form.reset()}>Reset</GlButton>
      </div>
    </form>
  );
}

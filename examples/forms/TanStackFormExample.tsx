import { useId } from "react";
import { useForm } from "@tanstack/react-form";
import { GlButton } from "gitlab-ui-react/button";
import {
  GlFormField,
  GlFormFieldError,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function TanStackFormExample() {
  const id = useId();
  const form = useForm({
    defaultValues: { username: "" },
    onSubmit: ({ value }) => console.log(value),
  });

  return (
    <form
      className="grid max-w-md gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}>
      <form.Field
        name="username"
        validators={{
          onChange: ({ value }) => value.trim().length < 3
            ? "Username must be at least 3 characters."
            : undefined,
        }}>
        {(field) => {
          const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <GlFormField aria-labelledby={`${id}-label`}>
              <GlFormFieldLabel htmlFor={id} id={`${id}-label`}>
                Username
              </GlFormFieldLabel>
              <GlFormInput
                id={id}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                state={invalid ? false : null}
                aria-describedby={invalid ? `${id}-error` : undefined} />
              {invalid && (
                <GlFormFieldError id={`${id}-error`} role="alert">
                  {field.state.meta.errors.join(" ")}
                </GlFormFieldError>
              )}
            </GlFormField>
          );
        }}
      </form.Field>
      <div className="flex gap-3">
        <GlButton type="submit" variant="confirm">Submit</GlButton>
        <GlButton type="button" onClick={() => form.reset()}>Reset</GlButton>
      </div>
    </form>
  );
}

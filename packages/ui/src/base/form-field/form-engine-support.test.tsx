// @vitest-environment jsdom

import { useState } from "react";
import { useForm as useTanStackForm } from "@tanstack/react-form";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller, useForm as useReactHookForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import GlFormInput from "../form-input/form-input";
import GlFormField, {
  GlFormFieldDescription,
  GlFormFieldError,
  GlFormFieldLabel,
} from "./form-field";

afterEach(cleanup);

type ReactHookFormValues = {
  email: string;
};

function ReactHookFormRegisterFixture() {
  const [submittedValues, setSubmittedValues] = useState<ReactHookFormValues | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useReactHookForm<ReactHookFormValues>({
    defaultValues: { email: "" },
  });
  const errorMessage = errors.email?.message;
  const descriptionId = "react-hook-form-email-description";
  const errorId = "react-hook-form-email-error";

  return (
    <form
      aria-label="React Hook Form example"
      onSubmit={handleSubmit((values) => setSubmittedValues(values))}>
      <GlFormField aria-labelledby="react-hook-form-email-label">
        <GlFormFieldLabel htmlFor="react-hook-form-email" id="react-hook-form-email-label">
          Email
        </GlFormFieldLabel>
        <GlFormInput
          {...register("email", {
            pattern: {
              message: "Enter a valid email address.",
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,
            },
            required: "Email is required.",
          })}
          aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
          ariaInvalid={Boolean(errorMessage)}
          id="react-hook-form-email"
          state={errorMessage ? false : null}
          type="email" />
        <GlFormFieldDescription id={descriptionId}>
          Used for account notifications.
        </GlFormFieldDescription>
        {errorMessage ? (
          <GlFormFieldError aria-live="polite" id={errorId}>
            {errorMessage}
          </GlFormFieldError>
        ) : null}
      </GlFormField>
      <button type="submit">Submit with React Hook Form</button>
      {submittedValues ? (
        <output aria-label="React Hook Form submitted data">
          {JSON.stringify(submittedValues)}
        </output>
      ) : null}
    </form>
  );
}

type ReactHookFormControllerValues = {
  displayName: string;
};

function ReactHookFormControllerFixture() {
  const [submittedValues, setSubmittedValues] = useState<
    ReactHookFormControllerValues | null
  >(null);
  const { control, handleSubmit } = useReactHookForm<ReactHookFormControllerValues>({
    defaultValues: { displayName: "" },
  });

  return (
    <form
      aria-label="React Hook Form Controller example"
      onSubmit={handleSubmit((values) => setSubmittedValues(values))}>
      <Controller
        control={control}
        name="displayName"
        rules={{
          required: "Display name is required.",
        }}
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          const descriptionId = "react-hook-form-controller-display-name-description";
          const errorId = "react-hook-form-controller-display-name-error";

          return (
            <GlFormField aria-labelledby="react-hook-form-controller-display-name-label">
              <GlFormFieldLabel
                htmlFor="react-hook-form-controller-display-name"
                id="react-hook-form-controller-display-name-label">
                Display name
              </GlFormFieldLabel>
              <GlFormInput
                ref={field.ref}
                aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
                ariaInvalid={Boolean(errorMessage)}
                id="react-hook-form-controller-display-name"
                name={field.name}
                onBlur={field.onBlur}
                onValueChange={(value) => field.onChange(String(value))}
                state={errorMessage ? false : null}
                value={field.value} />
              <GlFormFieldDescription id={descriptionId}>
                Shown on your public profile.
              </GlFormFieldDescription>
              {errorMessage ? (
                <GlFormFieldError aria-live="polite" id={errorId}>
                  {errorMessage}
                </GlFormFieldError>
              ) : null}
            </GlFormField>
          );
        }} />
      <button type="submit">Submit with React Hook Form Controller</button>
      {submittedValues ? (
        <output aria-label="React Hook Form Controller submitted data">
          {JSON.stringify(submittedValues)}
        </output>
      ) : null}
    </form>
  );
}

type TanStackFormValues = {
  username: string;
};

function TanStackFormFixture() {
  const [submittedValues, setSubmittedValues] = useState<TanStackFormValues | null>(null);
  const form = useTanStackForm({
    defaultValues: { username: "" },
    onSubmit: ({ value }) => setSubmittedValues(value),
  });

  return (
    <form
      aria-label="TanStack Form example"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
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
          const errorMessage = field.state.meta.errors[0];
          const descriptionId = "tanstack-form-username-description";
          const errorId = "tanstack-form-username-error";

          return (
            <GlFormField aria-labelledby="tanstack-form-username-label">
              <GlFormFieldLabel
                htmlFor="tanstack-form-username"
                id="tanstack-form-username-label">
                Username
              </GlFormFieldLabel>
              <GlFormInput
                aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
                ariaInvalid={Boolean(errorMessage)}
                id="tanstack-form-username"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={(value) => field.handleChange(String(value))}
                state={errorMessage ? false : null}
                value={field.state.value} />
              <GlFormFieldDescription id={descriptionId}>
                This name appears in your profile URL.
              </GlFormFieldDescription>
              {errorMessage ? (
                <GlFormFieldError aria-live="polite" id={errorId}>
                  {errorMessage}
                </GlFormFieldError>
              ) : null}
            </GlFormField>
          );
        }}
      </form.Field>
      <button type="submit">Submit with TanStack Form</button>
      {submittedValues ? (
        <output aria-label="TanStack Form submitted data">
          {JSON.stringify(submittedValues)}
        </output>
      ) : null}
    </form>
  );
}

describe("GlFormField form engine integrations", () => {
  it("works with React Hook Form registration, validation, focus, and submission", async () => {
    const user = userEvent.setup();
    render(<ReactHookFormRegisterFixture />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("name")).toBe("email");
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-email-description",
    );

    await user.click(screen.getByRole("button", { name: "Submit with React Hook Form" }));

    const error = await screen.findByText("Email is required.");
    expect(error.classList.contains("gl-form-field-error")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-email-description react-hook-form-email-error",
    );
    expect(document.activeElement).toBe(input);
    expect(screen.queryByLabelText("React Hook Form submitted data")).toBeNull();

    await user.type(input, "tanuki@example.com");
    await waitFor(() => expect(screen.queryByText("Email is required.")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Submit with React Hook Form" }));

    const output = await screen.findByLabelText("React Hook Form submitted data");
    expect(output.textContent).toBe("{\"email\":\"tanuki@example.com\"}");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-email-description",
    );
  });

  it("works with React Hook Form Controller controlled values and refs", async () => {
    const user = userEvent.setup();
    render(<ReactHookFormControllerFixture />);

    const input = screen.getByRole("textbox", { name: "Display name" });
    expect(input.getAttribute("name")).toBe("displayName");
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-controller-display-name-description",
    );

    await user.click(
      screen.getByRole("button", { name: "Submit with React Hook Form Controller" }),
    );

    const error = await screen.findByText("Display name is required.");
    expect(error.classList.contains("gl-form-field-error")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-controller-display-name-description "
      + "react-hook-form-controller-display-name-error",
    );
    expect(document.activeElement).toBe(input);
    expect(screen.queryByLabelText("React Hook Form Controller submitted data")).toBeNull();

    await user.type(input, "Tanuki");
    await waitFor(() => expect(screen.queryByText("Display name is required.")).toBeNull());
    await user.click(
      screen.getByRole("button", { name: "Submit with React Hook Form Controller" }),
    );

    const output = await screen.findByLabelText("React Hook Form Controller submitted data");
    expect(output.textContent).toBe("{\"displayName\":\"Tanuki\"}");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe(
      "react-hook-form-controller-display-name-description",
    );
  });

  it("works with TanStack Form controlled state, validation, and submission", async () => {
    const user = userEvent.setup();
    render(<TanStackFormFixture />);

    const input = screen.getByRole("textbox", { name: "Username" });
    expect(input.getAttribute("name")).toBe("username");
    expect(input.getAttribute("aria-describedby")).toBe(
      "tanstack-form-username-description",
    );

    await user.click(screen.getByRole("button", { name: "Submit with TanStack Form" }));

    const error = await screen.findByText("Username must be at least 3 characters.");
    expect(error.classList.contains("gl-form-field-error")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "tanstack-form-username-description tanstack-form-username-error",
    );
    expect(screen.queryByLabelText("TanStack Form submitted data")).toBeNull();

    await user.type(input, "tanuki");
    await waitFor(() => (
      expect(screen.queryByText("Username must be at least 3 characters.")).toBeNull()
    ));
    await user.click(screen.getByRole("button", { name: "Submit with TanStack Form" }));

    const output = await screen.findByLabelText("TanStack Form submitted data");
    expect(output.textContent).toBe("{\"username\":\"tanuki\"}");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe(
      "tanstack-form-username-description",
    );
  });
});

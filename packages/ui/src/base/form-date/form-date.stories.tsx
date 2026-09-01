import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor } from "storybook/test";
import GlFormDate from "./form-date";

const meta = {
  title: "UI/Base/Form Date",
  component: GlFormDate,
  args: {
    id: "input-id",
    onBlur: fn(),
    onChange: fn(),
    onFocus: fn(),
    onKeyDown: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas date picker documentation](https://design.gitlab.com/components/date-picker) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByPlaceholderText("yyyy-mm-dd");

    await expect(input).toHaveAttribute("type", "date");
    await expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{2}-\\d{2}");
    await expect(input).toHaveClass("gl-form-input", "form-control");
    await expect(input).not.toHaveAttribute("aria-describedby");

    // The upstream `keydown`/`focus`/`blur` events map to callbacks.
    await userEvent.click(input);
    await expect(args.onFocus).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("1");
    await expect(args.onKeyDown).toHaveBeenCalled();
    await userEvent.tab();
    await expect(args.onBlur).toHaveBeenCalledTimes(1);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText("yyyy-mm-dd")).toBeDisabled();
  },
};

export const DisabledValue: Story = {
  args: {
    disabled: true,
    value: "2020-01-19",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByDisplayValue("2020-01-19");

    await expect(input).toBeDisabled();
  },
};

export const MinMaxDates: Story = {
  args: {
    min: "2020-01-01",
    max: "2020-01-31",
    minInvalidFeedback: "Must be after 2020-01-01.",
    maxInvalidFeedback: "Must be before 2020-01-31.",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText("yyyy-mm-dd");

    await expect(input).toHaveAttribute("min", "2020-01-01");
    await expect(input).toHaveAttribute("max", "2020-01-31");
    await expect(input).not.toHaveAttribute("aria-invalid");
  },
};

export const Readonly: Story = {
  args: {
    readOnly: true,
    value: "2020-01-19",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByDisplayValue("2020-01-19");

    await expect(input).toHaveAttribute("readonly");
    await expect(input).not.toBeDisabled();
  },
};

export const Value: Story = {
  args: {
    value: "2020-01-15",
  },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByDisplayValue("2020-01-15");

    // The screen-reader-only output announces the full date after mount.
    await waitFor(() => expect(canvasElement.querySelector("output")).not.toBeNull());
    const output = canvasElement.querySelector("output")!;
    await expect(output).toHaveTextContent(/\w+/);
    await expect(output).toHaveAttribute("for", input.id);
    await expect(output).toHaveClass("gl-sr-only");
    await expect(input.getAttribute("aria-describedby")).toContain(output.id);
  },
};

export const ChangeEvent: Story = {
  args: {
    value: "2020-01-15",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByDisplayValue("2020-01-15");

    await fireEvent.change(input, { target: { value: "2020-01-20" } });

    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith("2020-01-20");
  },
};

export const InvalidDate: Story = {
  args: {
    min: "2020-01-01",
    max: "2020-01-31",
    minInvalidFeedback: "Must be after 2020-01-01.",
    maxInvalidFeedback: "Must be before 2020-01-31.",
    value: "2020-02-02",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByDisplayValue("2020-02-02");

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveClass("is-invalid");

    const feedback = canvas.getByText("Must be before 2020-01-31.");
    await expect(feedback).toHaveClass("invalid-feedback");
    await expect(input.getAttribute("aria-describedby")).toContain(feedback.id);

    // The shared feedback foundation: visible block with the GitLab spacing.
    await expect(getComputedStyle(feedback).display).toBe("block");
    await expect(getComputedStyle(feedback).marginTop).toBe("4px");
  },
};

export const BelowMin: Story = {
  args: {
    min: "2020-01-01",
    value: "2019-01-01",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByDisplayValue("2019-01-01");

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("Must be after minimum date.")).toHaveClass("invalid-feedback");
  },
};

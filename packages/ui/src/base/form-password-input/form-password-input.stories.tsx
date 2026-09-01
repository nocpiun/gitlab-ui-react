import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlFormPasswordInput from "./form-password-input";

const meta = {
  title: "UI/Base/Form Password Input",
  component: GlFormPasswordInput,
  args: {
    id: "password-input",
    onInput: fn(),
    onVisibilityChange: fn(),
    value: "super-secret-token",
  },
  parameters: {
    docs: {
      description: {
        component: `An input that masks its value, with a button to toggle its visibility.

Attributes that are not props are forwarded to the underlying input, so \`id\`, \`name\`,
\`autocomplete\`, \`required\` and friends behave as they would on a plain \`GlFormInput\`.

Use \`readOnly\` to prevent edits while keeping the value readable, copyable and submitted.
Use \`disabled\` to make the whole control inert.`,
      },
    },
  },
} satisfies Meta<typeof GlFormPasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole("button", { name: "Reveal password" });

    // Masked by default
    await expect(canvas.getByDisplayValue("super-secret-token")).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-label", "Reveal password");

    // Reveal on click, emitting visibility-change
    await userEvent.click(toggle);
    await expect(canvas.getByDisplayValue("super-secret-token")).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-label", "Hide password");
    await expect(args.onVisibilityChange).toHaveBeenLastCalledWith(true);

    // Hide again
    await userEvent.click(toggle);
    await expect(canvas.getByDisplayValue("super-secret-token")).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-label", "Reveal password");
    await expect(args.onVisibilityChange).toHaveBeenLastCalledWith(false);

    // Typing forwards the input event (upstream's v-model pass-through)
    await userEvent.type(canvas.getByDisplayValue("super-secret-token"), "x");
    await expect(args.onInput).toHaveBeenLastCalledWith("super-secret-tokenx");

    // The toggle is vertically centered inside the input's inline end
    const inputElement = canvas.getByDisplayValue(/super-secret-token/);
    const inputRect = inputElement.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const inputCenter = (inputRect.top + inputRect.bottom) / 2;
    const toggleCenter = (toggleRect.top + toggleRect.bottom) / 2;
    await expect(Math.abs(toggleCenter - inputCenter)).toBeLessThan(1);
    await expect(toggleRect.right).toBeLessThanOrEqual(inputRect.right);
    await expect(toggleRect.right).toBeGreaterThan(inputRect.right - 40);
  },
};

export const Revealed: Story = {
  args: {
    initialVisibility: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue("super-secret-token")).toHaveAttribute("type", "text");
    await expect(canvas.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  },
};

export const Readonly: Story = {
  args: {
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The value cannot be edited, but it can still be revealed and copied, and it is submitted with the form. Use this for a generated secret the user needs to read.",
      },
    },
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByDisplayValue("super-secret-token");
    const toggle = canvas.getByRole("button", { name: "Reveal password" });

    // The input is read-only, the toggle stays usable: revealing is a read
    await expect(input).toHaveAttribute("readonly");
    await expect(toggle).toBeEnabled();

    await userEvent.click(toggle);
    await expect(input).toHaveAttribute("type", "text");
    await expect(args.onVisibilityChange).toHaveBeenLastCalledWith(true);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The input is natively disabled and the toggle is inert: activation is suppressed and the value cannot be revealed. Following this repo's GlButton policy, the toggle is announced via `aria-disabled` and stays focusable instead of using a native `disabled` attribute.",
      },
    },
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByDisplayValue("super-secret-token");
    const toggle = canvas.getByRole("button", { name: "Reveal password" });

    await expect(input).toBeDisabled();
    await expect(toggle).toHaveAttribute("aria-disabled", "true");

    // The suppressed click neither reveals the value nor emits an event
    await userEvent.click(toggle);
    await expect(input).toHaveAttribute("type", "password");
    await expect(args.onVisibilityChange).not.toHaveBeenCalled();
  },
};

// The `width` prop is inherited from GlFormInput and maps to max-width
// classes: xs 5rem, sm 10rem, md 15rem, lg 20rem, xl 35rem.
const widthCases = [
  { width: "xs", maxWidth: "80px" },
  { width: "sm", maxWidth: "160px" },
  { width: "md", maxWidth: "240px" },
  { width: "lg", maxWidth: "320px" },
  { width: "xl", maxWidth: "560px" },
] as const;

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The `width` prop constrains the whole control: the max-width class lands on the wrapper, which is also the toggle's positioning anchor, so the toggle keeps overlaying the constrained input.",
      },
    },
  },
  render: (args) => (
    <div>
      {widthCases.map(({ width }) => (
        <div className="gl-mb-4" key={width}>
          <label htmlFor={`password-input-${width}`}>{width}</label>
          <GlFormPasswordInput
            {...args}
            id={`password-input-${width}`}
            width={width} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const inputs = canvas.getAllByDisplayValue("super-secret-token");
    const toggles = canvas.getAllByRole("button", { name: "Reveal password" });

    for(const [index, { width, maxWidth }] of widthCases.entries()) {
      const input = inputs[index];
      const wrapper = input.closest(".gl-form-password-input")!;
      const inputRect = input.getBoundingClientRect();
      const toggleRect = toggles[index].getBoundingClientRect();

      // The width class lands on the wrapper and constrains the whole control
      await expect(wrapper).toHaveClass(`gl-form-input-${width}`);
      await expect(inputRect.width).toBe(parseFloat(maxWidth));

      // The toggle keeps overlaying the constrained input's inline end
      const inputCenter = (inputRect.top + inputRect.bottom) / 2;
      const toggleCenter = (toggleRect.top + toggleRect.bottom) / 2;
      await expect(Math.abs(toggleCenter - inputCenter)).toBeLessThan(1);
      await expect(toggleRect.right).toBeLessThanOrEqual(inputRect.right);
      await expect(toggleRect.right).toBeGreaterThan(inputRect.right - 40);
    }
  },
};

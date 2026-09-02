import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, fireEvent, waitFor } from "storybook/test";

import GlFormCharacterCount from "./form-character-count";
import GlFormInput from "../form-input/form-input";

const inputId = "form-input-with-character-count";

function characterText(count: number, suffix: string) {
  return `${count} character${count === 1 ? "" : "s"} ${suffix}.`;
}

function CharacterCountExample(args: ComponentProps<typeof GlFormCharacterCount>) {
  const [value, setValue] = useState(args.value ?? "");
  const remainingCount = args.limit - value.length;

  return (
    <div>
      <label htmlFor={inputId}>Form input with character count</label>
      <GlFormInput
        id={inputId}
        aria-describedby={args.countTextId}
        value={value}
        onInput={(newValue) => setValue(String(newValue))} />
      <GlFormCharacterCount
        {...args}
        value={value}
        remainingCountText={characterText(Math.max(remainingCount, 0), "remaining")}
        overLimitText={characterText(Math.max(-remainingCount, 0), "over limit")} />
    </div>
  );
}

const meta = {
  title: "UI/Base/Form Character Count",
  component: GlFormCharacterCount,
  args: {
    countTextId: "character-count-text",
    limit: 10,
    overLimitText: "0 characters over limit.",
    remainingCountText: "10 characters remaining.",
    value: "",
  },
  argTypes: {
    overLimitText: {
      control: false,
    },
    remainingCountText: {
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas character count documentation](https://design.gitlab.com/components/character-count/) for usage guidance. The Vue scoped slots are passed as the `remainingCountText` and `overLimitText` props in React.",
      },
    },
  },
  render: (args) => <CharacterCountExample {...args} />,
} satisfies Meta<typeof GlFormCharacterCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Form input with character count" });
    const liveRegion = canvas.getByTestId("count-text-sr-only");

    await expect(canvas.getByText("10 characters remaining.", { selector: "small" }))
      .toHaveClass("gl-text-subtle");
    await expect(liveRegion).toHaveTextContent("10 characters remaining.");

    fireEvent.input(input, { target: { value: "12345678901" } });

    await expect(canvas.getByText("1 character over limit.", { selector: "small" }))
      .toHaveClass("gl-text-danger");
    await expect(liveRegion).toHaveTextContent("10 characters remaining.");
    await waitFor(
      () => expect(liveRegion).toHaveTextContent("1 character over limit."),
      { timeout: 2000 },
    );
  },
};

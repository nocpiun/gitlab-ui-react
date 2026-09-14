import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlFormInput from "../form-input/form-input";
import GlListbox, {
  GlListboxContent,
  GlListboxItem,
  GlListboxTrigger,
} from "../listbox/listbox";
import GlFormInputGroup, {
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "./form-input-group";

const meta = {
  title: "UI/Base/Form Input Group",
  component: GlFormInputGroup,
  argTypes: {
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: "Composition-first React port of Pajamas Form Input Group. Addons, controls, and state are supplied by the consumer and rendered in the order provided.",
      },
    },
  },
} satisfies Meta<typeof GlFormInputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrependText: Story = {
  render: () => (
    <GlFormInputGroup aria-label="Username field">
      <GlFormInputGroupAddon position="prepend">
        <GlInputGroupText>Username</GlInputGroupText>
      </GlFormInputGroupAddon>
      <GlFormInput aria-label="Username" />
    </GlFormInputGroup>
  ),
};

export const AppendButton: Story = {
  render: () => (
    <GlFormInputGroup aria-label="Search field">
      <GlFormInput aria-label="Search" placeholder="Search projects" />
      <GlFormInputGroupAddon position="append">
        <GlButton>Search</GlButton>
      </GlFormInputGroupAddon>
    </GlFormInputGroup>
  ),
};

export const BothAddons: Story = {
  render: () => (
    <GlFormInputGroup aria-label="Repository URL field">
      <GlFormInputGroupAddon position="prepend">
        <GlInputGroupText>https://</GlInputGroupText>
      </GlFormInputGroupAddon>
      <GlFormInput aria-label="Repository path" defaultValue="gitlab.com/gitlab-org/gitlab" />
      <GlFormInputGroupAddon position="append">
        <GlButton>Copy</GlButton>
      </GlFormInputGroupAddon>
    </GlFormInputGroup>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Repository URL field" });
    const text = canvas.getByText("https://");
    const input = canvas.getByRole("textbox", { name: "Repository path" });
    const button = canvas.getByRole("button", { name: "Copy" });

    await expect(group.children).toHaveLength(3);
    await expect(group.children[0]).toContainElement(text);
    await expect(group.children[1]).toBe(input);
    await expect(group.children[2]).toContainElement(button);
    await expect(getComputedStyle(text).borderTopRightRadius).toBe("0px");
    await expect(getComputedStyle(input).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(button).borderTopLeftRadius).toBe("0px");
  },
};

export const RangeInput: Story = {
  render: () => (
    <GlFormInputGroup aria-label="Progress field">
      <GlFormInputGroupAddon position="prepend">
        <GlInputGroupText>0</GlInputGroupText>
      </GlFormInputGroupAddon>
      <GlFormInput aria-label="Progress" defaultValue={50} min={0} max={100} type="range" />
      <GlFormInputGroupAddon position="append">
        <GlInputGroupText>100</GlInputGroupText>
      </GlFormInputGroupAddon>
    </GlFormInputGroup>
  ),
  play: async ({ canvas }) => {
    const range = canvas.getByRole("slider", { name: "Progress" });

    await expect(range).toHaveClass("gl-form-input", "custom-range");
    await expect(getComputedStyle(range).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(range).borderTopRightRadius).toBe("0px");
  },
};

const options = [
  { name: "Embed", value: "https://embed.example" },
  { name: "Share", value: "https://share.example" },
] as const;

function PredefinedOptionsExample() {
  const [selectedValue, setSelectedValue] = useState<string>(options[0].value);
  const selectedOption = options.find(({ value }) => value === selectedValue) ?? options[0];

  return (
    <GlFormInputGroup aria-label="URL type field">
      <GlFormInputGroupAddon position="prepend">
        <GlListbox
          value={selectedValue}
          onValueChange={(value) => {
            if(value !== null) setSelectedValue(String(value));
          }}>
          <GlListboxTrigger>{selectedOption.name}</GlListboxTrigger>
          <GlListboxContent aria-label="URL type">
            {options.map((option) => (
              <GlListboxItem key={option.value} value={option.value}>
                {option.name}
              </GlListboxItem>
            ))}
          </GlListboxContent>
        </GlListbox>
      </GlFormInputGroupAddon>

      <GlFormInput
        aria-label="Selected URL"
        readOnly
        value={selectedOption.value}
        onClick={(event) => event.currentTarget.select()} />
    </GlFormInputGroup>
  );
}

export const PredefinedOptionsWithListbox: Story = {
  render: () => <PredefinedOptionsExample />,
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole("button", { name: "Embed" });
    const input = canvas.getByRole("textbox", {
      name: "Selected URL",
    }) as HTMLInputElement;

    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await expect(input).toHaveValue("https://embed.example");
    await expect(getComputedStyle(trigger).borderTopRightRadius).toBe("0px");

    await userEvent.click(trigger);
    const page = within(canvasElement.ownerDocument.body);
    const listbox = await page.findByRole("listbox", { name: "URL type" });
    const shareOption = within(listbox).getByRole("option", { name: "Share" });
    await expect(shareOption).toHaveAttribute("aria-selected", "false");
    await userEvent.click(shareOption);

    await waitFor(() => expect(trigger).toHaveTextContent("Share"));
    await expect(input).toHaveValue("https://share.example");
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.click(input);
    await expect(input.selectionStart).toBe(0);
    await expect(input.selectionEnd).toBe(input.value.length);
  },
};

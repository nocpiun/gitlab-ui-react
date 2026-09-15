import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlFormField, {
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "../form-field/form-field";
import GlFormInput from "../form-input/form-input";
import GlFormSelect, { GlFormSelectItem } from "../form-select/form-select";
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

export const SelectControl: Story = {
  render: () => (
    <GlFormInputGroup aria-label="Visibility field">
      <GlFormInputGroupAddon position="prepend">
        <GlInputGroupText>Visibility</GlInputGroupText>
      </GlFormInputGroupAddon>
      <GlFormSelect aria-label="Visibility" defaultValue="private">
        <GlFormSelectItem value="private">Private</GlFormSelectItem>
        <GlFormSelectItem value="public">Public</GlFormSelectItem>
      </GlFormSelect>
      <GlFormInputGroupAddon position="append">
        <GlButton>Apply</GlButton>
      </GlFormInputGroupAddon>
    </GlFormInputGroup>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Visibility field" });
    const select = canvas.getByRole("combobox", { name: "Visibility" });
    const wrapper = select.parentElement;

    if(!(wrapper instanceof HTMLElement)) {
      throw new Error("GlFormSelect must render inside its structural wrapper");
    }

    await expect(wrapper).toHaveClass("gl-form-select-wrapper");
    await expect(group.children[1]).toBe(wrapper);
    await expect(getComputedStyle(wrapper).flexGrow).toBe("1");
    await expect(getComputedStyle(wrapper).minWidth).toBe("0px");
    await expect(getComputedStyle(select).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(select).borderTopRightRadius).toBe("0px");

    select.focus();
    await expect(select).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(wrapper).zIndex).toBe("3"));
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

const rangeValidationStates = [
  { label: "Default", state: null },
  { label: "Valid", state: true },
  { label: "Invalid", state: false },
] as const;

export const RangeValidationStates: Story = {
  render: () => (
    <GlFormFieldGroup style={{ maxWidth: "32rem" }}>
      {rangeValidationStates.map(({ label, state }) => {
        const id = `grouped-range-${label.toLowerCase()}`;
        const labelId = `${id}-label`;

        return (
          <GlFormField key={label} aria-labelledby={labelId}>
            <GlFormFieldLabel id={labelId} htmlFor={id}>{label}</GlFormFieldLabel>
            <GlFormInputGroup aria-labelledby={labelId}>
              <GlFormInputGroupAddon position="prepend">
                <GlInputGroupText>0</GlInputGroupText>
              </GlFormInputGroupAddon>
              <GlFormInput
                id={id}
                defaultValue={50}
                max={100}
                min={0}
                state={state}
                type="range" />
              <GlFormInputGroupAddon position="append">
                <GlInputGroupText>100</GlInputGroupText>
              </GlFormInputGroupAddon>
            </GlFormInputGroup>
          </GlFormField>
        );
      })}
    </GlFormFieldGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compares grouped range validation styling. The interaction leaves the invalid range focused so its outer border and focus ring can be inspected.",
      },
    },
  },
  play: async ({ canvas }) => {
    const defaultRange = canvas.getByRole("slider", { name: "Default" });
    const validRange = canvas.getByRole("slider", { name: "Valid" });
    const invalidRange = canvas.getByRole("slider", { name: "Invalid" });

    await expect(defaultRange).not.toHaveClass("is-valid", "is-invalid");
    await expect(validRange).toHaveClass("is-valid");
    await expect(invalidRange).toHaveClass("is-invalid");
    await expect(invalidRange).toHaveAttribute("aria-invalid", "true");
    await expect(getComputedStyle(validRange).borderTopColor).toBe("rgb(47, 117, 73)");
    await expect(getComputedStyle(invalidRange).borderTopColor).toBe("rgb(192, 47, 18)");

    validRange.focus();
    await waitFor(() => expect(getComputedStyle(validRange).boxShadow).toContain(
      "rgba(47, 117, 73, 0.25)",
    ));

    invalidRange.focus();
    await expect(invalidRange).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(invalidRange).boxShadow).toContain(
      "rgba(192, 47, 18, 0.25)",
    ));
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

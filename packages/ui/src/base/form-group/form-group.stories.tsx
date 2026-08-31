import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import GlLink from "../link/link";
import GlFormGroup from "./form-group";

const meta = {
  title: "UI/Base/FormGroup",
  component: GlFormGroup,
  args: {
    children: <input className="form-control" id="group-1" />,
    description: "form group description (used as help text).",
    disabled: false,
    id: "group-1_group",
    label: "Label Name",
    labelDescription: "",
    labelFor: "group-1",
    optional: false,
    optionalText: "(optional)",
  },
  argTypes: {
    children: {
      control: false,
    },
    labelClass: {
      control: false,
    },
    labelSize: {
      control: "select",
      options: ["", "sm", "lg"],
    },
    state: {
      control: "select",
      options: [null, true, false],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas form group documentation](https://design.gitlab.com/components/form-group) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /Label Name/ });
    const description = canvas.getByText("form group description (used as help text).");

    await expect(canvas.getByText("Label Name").closest("label")).toHaveAttribute("for", "group-1");
    await expect(input).toHaveAttribute("aria-describedby", description.id);
    await expect(description).toHaveClass("form-text", "text-muted");
  },
};

export const Disabled: Story = {
  args: {
    children: <input className="form-control" disabled id="group-1" type="text" value="Disabled" />,
    description: "This feature is disabled.",
  },
};

export const WithTextarea: Story = {
  args: {
    children: <textarea className="form-control" id="group-1" placeholder="Enter something" />,
    description: undefined,
    optional: true,
  },
};

export const WithLabelDescription: Story = {
  args: {
    labelDescription: "form group label description (used as description).",
    optional: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("label-description"))
      .toHaveTextContent("form group label description (used as description).");
    await expect(canvas.getByTestId("optional-label")).toHaveTextContent("(optional)");
  },
};

export const WithLabelSlot: Story = {
  args: {
    description: undefined,
    label: (
      <>
        Label name
        <div className="label-description">
          form group label description with a <GlLink href="#">link</GlLink> (used as description).
        </div>
      </>
    ),
  },
  play: async ({ canvas }) => {
    const label = canvas.getByText("Label name").closest("label");

    await expect(label).toHaveAttribute("for", "group-1");
    await expect(within(label as HTMLElement).getByRole("link")).toHaveAttribute("href", "#");
  },
};

export const WithDescriptionSlot: Story = {
  args: {
    description: (
      <>
        form group description with a <GlLink href="#">link</GlLink> (used as help text).
      </>
    ),
    optional: true,
  },
  play: async ({ canvas }) => {
    const description = canvas.getByText(/form group description with a/);

    await expect(description).toHaveClass("form-text", "text-muted");
    await expect(within(description).getByRole("link")).toHaveAttribute("href", "#");
  },
};

export const Fieldset: Story = {
  args: {
    labelFor: undefined,
    optional: true,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: /Label Name/ });
    const input = within(group).getByRole("textbox");

    // Without `labelFor` the group is a fieldset with a legend; clicking the
    // legend focuses the single enabled control, emulating label behavior.
    await expect(group.tagName).toBe("FIELDSET");
    await expect(within(group).getByText("Label Name").tagName).toBe("LEGEND");

    await userEvent.click(within(group).getByText("Label Name"));
    await expect(input).toHaveFocus();
  },
};

export const FieldsetDisabled: Story = {
  args: {
    disabled: true,
    labelFor: undefined,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: /Label Name/ });

    await expect(group).toHaveAttribute("disabled");
    await expect(within(group).getByRole("textbox")).toBeDisabled();
  },
};

export const WithValidations: Story = {
  args: {
    children: <input className="form-control" id="group-1" />,
    description: "Enter a first and last name.",
    invalidFeedback: "This field is required.",
    label: "Name",
    state: false,
  },
  play: async ({ canvas }) => {
    // A group labeled via `label[for]` has no accessible name of its own;
    // the label names the control instead.
    const group = canvas.getByRole("group");
    const input = within(group).getByRole("textbox");
    const feedback = within(group).getByText("This field is required.");

    await expect(group).toHaveClass("is-invalid");
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(feedback).toHaveClass("invalid-feedback", "!gl-block");
    await expect(feedback).toHaveAttribute("aria-live", "assertive");

    // The description and the visible invalid feedback describe the control.
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    await expect(describedBy).toContain(feedback.id);
    await expect(describedBy).toContain(within(group).getByText(/Enter a first/).id);
  },
};

export const Valid: Story = {
  args: {
    children: <input className="form-control" id="group-1" value="Sidney Jones" />,
    state: true,
    validFeedback: "This field is valid.",
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group");
    const feedback = within(group).getByText("This field is valid.");

    await expect(group).toHaveClass("is-valid");
    await expect(group).not.toHaveAttribute("aria-invalid");
    await expect(feedback).toHaveClass("valid-feedback", "!gl-block");
    await expect(within(group).getByRole("textbox").getAttribute("aria-describedby"))
      .toContain(feedback.id);
  },
};

export const LabelSrOnly: Story = {
  args: {
    labelSrOnly: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /Label Name/ });
    const label = canvas.getByText("Label Name").closest("label");

    await expect(label).toHaveClass("gl-sr-only");
    await expect(label).toHaveAttribute("for", input.id);
  },
};

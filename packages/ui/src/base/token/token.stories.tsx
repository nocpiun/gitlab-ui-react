import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlAvatar from "../avatar/avatar";
import GlLoadingIcon from "../loading-icon/loading-icon";
import GlToken from "./token";

const meta = {
  title: "UI/Base/Token",
  component: GlToken,
  args: {
    children: "Token",
    onRemove: fn(),
    removeLabel: "Remove",
    variant: "default",
    viewOnly: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "search-type", "search-value"],
    },
  },
  parameters: {
    docs: {
      description: {
        component: "React port of the Pajamas token used for compact selected values.",
      },
    },
  },
} satisfies Meta<typeof GlToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const remove = canvas.getByRole("button", { name: "Remove" });

    await expect(canvas.getByText("Token").closest(".gl-token")).toHaveClass("gl-token");
    await userEvent.click(remove);
    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="gl-flex gl-gap-4">
      <GlToken {...args} variant="default">Default</GlToken>
      <GlToken {...args} variant="search-type">Search type</GlToken>
      <GlToken {...args} variant="search-value">Search value</GlToken>
    </div>
  ),
};

export const RichContent: Story = {
  render: (args) => (
    <div className="gl-flex gl-gap-4">
      <GlToken {...args} removeLabel="Remove GitLab">
        <GlAvatar alt="" entityId={1} entityName="GitLab" size={16} />
        GitLab
      </GlToken>
      <GlToken {...args} removeLabel="Cancel search">
        <GlLoadingIcon inline size="sm" />
        Searching
      </GlToken>
    </div>
  ),
};

export const ViewOnly: Story = {
  args: {
    viewOnly: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    await expect(canvas.getByText("Token").closest(".gl-token"))
      .toHaveClass("gl-token-view-only");
  },
};

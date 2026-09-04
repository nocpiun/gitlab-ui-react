import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import GlAttributeList, {
  GlAttributeListItem,
  type GlAttributeListProps,
} from "./attribute-list";
import GlAvatarLabeled from "../avatar-labeled/avatar-labeled";
import GlBadge from "../badge/badge";
import GlLink from "../link/link";

const defaultItems = [
  { icon: "code", label: "File", value: "devfile.yaml" },
  { icon: "user", label: "Author", value: "User Alpha" },
  { icon: "merge", label: "Merged by", value: "User Beta" },
  { icon: "clock", label: "Approved by", value: "User Gamma" },
  {
    icon: "text-description",
    label: "Description",
    value: "This change adds linting and specification tests for the documented behavior.",
  },
  {
    icon: "commit",
    label: "Commit SHA",
    value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  { icon: "work-item-issue", label: "Issue", value: "#12345" },
  { icon: "calendar", label: "Created", value: "1 month ago" },
  { icon: "status-health", label: "Health", value: "OK" },
] as const;

function ExampleAttributeList(props: GlAttributeListProps) {
  return (
    <GlAttributeList {...props}>
      {defaultItems.map((item) => (
        <GlAttributeListItem
          key={item.label}
          icon={item.icon}
          label={item.label}>
          {item.value}
        </GlAttributeListItem>
      ))}
    </GlAttributeList>
  );
}

const meta = {
  title: "UI/Base/Attribute List",
  component: GlAttributeList,
  args: {
    layout: "horizontal",
  },
  argTypes: {
    children: {
      control: false,
    },
    descriptionClassName: {
      control: false,
    },
    labelClassName: {
      control: false,
    },
    layout: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A compositional React port of GitLab UI's Attribute List. See the [Pajamas Attribute List documentation](https://design.gitlab.com/components/attribute-list) for usage guidance.",
      },
    },
  },
  render: (args) => <ExampleAttributeList {...args} />,
} satisfies Meta<typeof GlAttributeList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const list = canvasElement.querySelector("dl");
    const terms = canvasElement.querySelectorAll("dt");
    const descriptions = canvasElement.querySelectorAll("dd");

    await expect(list).toHaveClass(
      "gl-attribute-list",
      "gl-attribute-list-horizontal-items",
    );
    await expect(list?.parentElement).toHaveClass("gl-attribute-list-container");
    await expect(terms).toHaveLength(defaultItems.length);
    await expect(descriptions).toHaveLength(defaultItems.length);
    await expect(canvas.getByText("File")).toBeVisible();
    await expect(canvas.getByText("devfile.yaml")).toBeVisible();
  },
};

export const VerticalLayout: Story = {
  args: {
    layout: "vertical",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("dl")).toHaveClass(
      "gl-attribute-list-vertical-items",
    );
  },
};

export const NarrowContainer: Story = {
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <ExampleAttributeList {...args} />
    </div>
  ),
};

export const CustomClasses: Story = {
  args: {
    labelClassName: "gl-font-bold",
    descriptionClassName: "gl-text-subtle gl-truncate",
  },
};

export const RichContent: Story = {
  render: (args) => (
    <GlAttributeList {...args}>
      <GlAttributeListItem icon="code" label="File">
        <code>devfile.yaml</code>
      </GlAttributeListItem>
      <GlAttributeListItem icon="work-item-issue" label="Issue">
        <GlLink href="#issue">#12345</GlLink>
      </GlAttributeListItem>
      <GlAttributeListItem icon="merge-request" label="Merge request">
        <GlBadge href="#merge-request" icon="merge-request" variant="success">
          !12345
        </GlBadge>
      </GlAttributeListItem>
      <GlAttributeListItem icon="user" label="Author">
        <GlAvatarLabeled
          entityName="User Alpha"
          label="User Alpha"
          size={16} />
      </GlAttributeListItem>
      <GlAttributeListItem
        icon="commit"
        label={<strong>Commit SHA</strong>}>
        <div className="gl-truncate">
          e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        </div>
      </GlAttributeListItem>
    </GlAttributeList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "#12345" })).toBeVisible();
    await expect(canvas.getByText("!12345").closest(".gl-badge")).toHaveClass(
      "badge-success",
    );
    await expect(canvas.getByText("User Alpha")).toBeVisible();
  },
};

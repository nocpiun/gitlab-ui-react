import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlAccordion, { GlAccordionItem } from "./accordion";
import GlButton from "../button/button";

const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const meta = {
  title: "UI/Base/Accordion",
  component: GlAccordion,
  args: {
    autoCollapse: false,
    headerLevel: 3,
  },
  argTypes: {
    headerLevel: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas accordion documentation](https://design.gitlab.com/components/accordion) for usage and implementation guidance.",
      },
    },
  },
  render: (args) => (
    <GlAccordion {...args}>
      <GlAccordionItem title="Item 1" value="item-1">
        {loremIpsum}
      </GlAccordionItem>
      <GlAccordionItem defaultVisible title="Item 2" value="item-2">
        {loremIpsum}
      </GlAccordionItem>
      <GlAccordionItem title="Item 3" value="item-3">
        {loremIpsum}
      </GlAccordionItem>
    </GlAccordion>
  ),
} satisfies Meta<typeof GlAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const item1 = canvas.getByRole("button", { name: "Item 1" });
    const item2 = canvas.getByRole("button", { name: "Item 2" });

    await expect(item1).toHaveAttribute("aria-expanded", "false");
    await expect(item2).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(item1);
    await expect(item1).toHaveAttribute("aria-expanded", "true");
    await expect(item2).toHaveAttribute("aria-expanded", "true");
    await expect(item1).toHaveFocus();
  },
};

export const AutoCollapse: Story = {
  args: {
    autoCollapse: true,
  },
  play: async ({ canvas }) => {
    const item1 = canvas.getByRole("button", { name: "Item 1" });
    const item2 = canvas.getByRole("button", { name: "Item 2" });
    const item3 = canvas.getByRole("button", { name: "Item 3" });

    await userEvent.click(item1);
    await expect(item1).toHaveAttribute("aria-expanded", "true");
    await expect(item2).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(item3);
    await expect(item1).toHaveAttribute("aria-expanded", "false");
    await expect(item3).toHaveAttribute("aria-expanded", "true");
  },
};

type ControlledItem = "item-1" | "item-2" | null;

function ControlledAutoCollapseExample(args: ComponentProps<typeof GlAccordion>) {
  const [visibleItem, setVisibleItem] = useState<ControlledItem>(null);
  const handleVisibleChange = (item: Exclude<ControlledItem, null>) => (
    nextVisible: boolean,
  ) => {
    setVisibleItem((currentItem) => {
      if(nextVisible) return item;
      return currentItem === item ? null : currentItem;
    });
  };

  return (
    <>
      <div className="gl-mb-5 gl-flex gl-gap-2">
        <GlButton onClick={() => setVisibleItem("item-1")}>Show Item 1</GlButton>
        <GlButton onClick={() => setVisibleItem("item-2")}>Show Item 2</GlButton>
      </div>
      <GlAccordion {...args} autoCollapse>
        <GlAccordionItem
          onVisibleChange={handleVisibleChange("item-1")}
          title="Item 1"
          value="item-1"
          visible={visibleItem === "item-1"}>
          {loremIpsum}
        </GlAccordionItem>
        <GlAccordionItem
          onVisibleChange={handleVisibleChange("item-2")}
          title="Item 2"
          value="item-2"
          visible={visibleItem === "item-2"}>
          {loremIpsum}
        </GlAccordionItem>
      </GlAccordion>
    </>
  );
}

export const ControlledAutoCollapse: Story = {
  render: (args) => <ControlledAutoCollapseExample {...args} />,
  play: async ({ canvas }) => {
    const item1 = canvas.getByRole("button", { name: "Item 1" });
    const item2 = canvas.getByRole("button", { name: "Item 2" });

    await userEvent.click(canvas.getByRole("button", { name: "Show Item 1" }));
    await expect(item1).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("button", { name: "Show Item 2" }));
    await expect(item1).toHaveAttribute("aria-expanded", "false");
    await expect(item2).toHaveAttribute("aria-expanded", "true");
  },
};

export const VisibleTitle: Story = {
  render: (args) => (
    <GlAccordion {...args}>
      <GlAccordionItem
        defaultVisible
        onVisibleChange={fn()}
        title="Show details"
        titleVisible="Hide details"
        value="visible-title">
        {loremIpsum}
      </GlAccordionItem>
    </GlAccordion>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Hide details" });

    await userEvent.click(trigger);
    await expect(canvas.getByRole("button", { name: "Show details" }))
      .toHaveAttribute("aria-expanded", "false");
  },
};

export const LongTitle: Story = {
  render: (args) => (
    <GlAccordion {...args}>
      <GlAccordionItem
        defaultVisible
        title="src/components/base/accordion/very_long_file_name_that_should_wrap_instead_of_overflowing.tsx"
        value="long-title">
        {loremIpsum}
      </GlAccordionItem>
    </GlAccordion>
  ),
};

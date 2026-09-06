import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type MouseEvent } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlButton from "../button/button";
import GlPath, {
  GlPathItem,
  GlPathItemMetric,
  GlPathItemTitle,
  type GlPathProps,
} from "./path";

type Stage = {
  disabled?: boolean;
  icon?: string;
  metric?: string;
  title: string;
  value: string;
};

const stages: readonly Stage[] = [
  { icon: "home", metric: "1d", title: "First", value: "first" },
  { metric: "2d", title: "Second", value: "second" },
  { metric: "3d", title: "Third", value: "third" },
  { metric: "4d", title: "Fourth", value: "fourth" },
  { metric: "5d", title: "Fifth", value: "fifth" },
  { metric: "6d", title: "Sixth", value: "sixth" },
  { metric: "7d", title: "Seventh", value: "seventh" },
  { disabled: true, metric: "8d", title: "Eighth", value: "eighth" },
  { metric: "9d", title: "Ninth", value: "ninth" },
  { metric: "10d", title: "Tenth", value: "tenth" },
];

const selectionChanged = fn();
const preventedClick = fn((event: MouseEvent<HTMLButtonElement>) => event.preventDefault());

function renderStages(items: readonly Stage[] = stages) {
  return items.map((stage) => (
    <GlPathItem
      key={stage.value}
      disabled={stage.disabled}
      icon={stage.icon}
      value={stage.value}>
      <GlPathItemTitle>{stage.title}</GlPathItemTitle>
      {stage.metric ? <GlPathItemMetric>{stage.metric}</GlPathItemMetric> : null}
    </GlPathItem>
  ));
}

const meta = {
  title: "UI/Base/Path",
  component: GlPath,
  args: {
    backgroundColor: "rgba(0,0,0,0)",
    onValueChange: selectionChanged,
    scrollLeftLabel: "Scroll left",
    scrollRightLabel: "Scroll right",
  },
  argTypes: {
    backgroundColor: { control: "color" },
    children: { control: false },
    defaultValue: { control: false },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Composition-first React port of the [Pajamas Path](https://design.gitlab.com/components/path).",
      },
    },
  },
  render: (args) => <GlPath {...args}>{renderStages()}</GlPath>,
} satisfies Meta<typeof GlPath>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    selectionChanged.mockClear();
    const first = canvas.getByRole("button", { name: "First 1d" });
    const fourth = canvas.getByRole("button", { name: "Fourth 4d" });
    const eighth = canvas.getByRole("button", { name: "Eighth 8d" });

    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(fourth).toHaveAttribute("aria-current", "false");
    await expect(first).not.toHaveAttribute("tabindex");
    await expect(fourth).not.toHaveAttribute("tabindex");

    await userEvent.click(fourth);
    await expect(args.onValueChange).toHaveBeenLastCalledWith("fourth");
    await expect(fourth).toHaveAttribute("aria-current", "true");

    await userEvent.click(fourth);
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);

    await userEvent.click(eighth);
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    await expect(eighth).toBeDisabled();

    fourth.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(fourth).toHaveFocus();
    await expect(fourth).toHaveAttribute("aria-current", "true");
  },
};

function ControlledPathExample({ onValueChange, ...pathProps }: GlPathProps) {
  const [selectedValue, setSelectedValue] = useState("second");

  return (
    <GlPath
      {...pathProps}
      onValueChange={(nextValue) => {
        setSelectedValue(nextValue);
        onValueChange?.(nextValue);
      }}
      value={selectedValue}>
      {renderStages(stages.slice(0, 4))}
    </GlPath>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledPathExample {...args} />,
  play: async ({ args, canvas }) => {
    selectionChanged.mockClear();
    const first = canvas.getByRole("button", { name: "First 1d" });
    const second = canvas.getByRole("button", { name: "Second 2d" });

    await expect(second).toHaveAttribute("aria-current", "true");
    await userEvent.click(first);
    await expect(args.onValueChange).toHaveBeenLastCalledWith("first");
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(second).toHaveAttribute("aria-current", "false");
  },
};

export const PreventedSelection: Story = {
  render: (args) => (
    <GlPath {...args}>
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
      </GlPathItem>
      <GlPathItem onClick={preventedClick} value="second">
        <GlPathItemTitle>Second</GlPathItemTitle>
      </GlPathItem>
    </GlPath>
  ),
  play: async ({ args, canvas }) => {
    selectionChanged.mockClear();
    preventedClick.mockClear();
    const first = canvas.getByRole("button", { name: "First" });
    const second = canvas.getByRole("button", { name: "Second" });

    await userEvent.click(second);
    await expect(preventedClick).toHaveBeenCalledOnce();
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(second).toHaveAttribute("aria-current", "false");
  },
};

function DynamicPathExample({ onValueChange, ...pathProps }: GlPathProps) {
  const [items, setItems] = useState<readonly Stage[]>(stages.slice(0, 3));

  return (
    <>
      <div className="gl-mb-5 gl-flex gl-gap-2">
        <GlButton onClick={() => setItems((current) => [...current].reverse())}>
          Reverse stages
        </GlButton>
        <GlButton onClick={() => setItems((current) => (
          current.filter((stage) => stage.value !== "second")
        ))}>
          Remove selected stage
        </GlButton>
      </div>
      <GlPath {...pathProps} defaultValue="second" onValueChange={onValueChange}>
        {renderStages(items)}
      </GlPath>
    </>
  );
}

export const DynamicItems: Story = {
  render: (args) => <DynamicPathExample {...args} />,
  play: async ({ args, canvas }) => {
    selectionChanged.mockClear();
    const selectedStage = canvas.getByRole("button", { name: "Second 2d" });

    await expect(selectedStage).toHaveAttribute("aria-current", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Reverse stages" }));
    await expect(selectedStage).toHaveAttribute("aria-current", "true");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "Remove selected stage" }));
    const fallbackStage = canvas.getByRole("button", { name: "Third 3d" });
    await waitFor(() => expect(fallbackStage).toHaveAttribute("aria-current", "true"));
    await expect(args.onValueChange).toHaveBeenCalledOnce();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("third");
  },
};

export const CustomBackground: Story = {
  args: {
    backgroundColor: "#f0f0f0",
  },
  render: (args) => (
    <div className="gl-p-5" style={{ backgroundColor: args.backgroundColor }}>
      <GlPath {...args}>{renderStages(stages.slice(0, 4))}</GlPath>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("gl-path-nav")).toHaveStyle({
      "--path-bg-color": "#f0f0f0",
    });
  },
};

export const Overflow: Story = {
  render: (args) => (
    <div style={{ width: "18rem" }}>
      <GlPath {...args}>{renderStages()}</GlPath>
    </div>
  ),
  play: async ({ canvas }) => {
    const scrollRight = await waitFor(() => {
      const button = canvas.getByRole("button", { name: "Scroll right" });
      expect(button).toBeVisible();
      return button;
    });

    await userEvent.click(scrollRight);
    await waitFor(() => expect(
      canvas.getByRole("button", { name: "Scroll left" }),
    ).toBeVisible());
  },
};

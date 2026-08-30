import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { expect, fn, userEvent } from "storybook/test";

import GlButton from "../button/button";
import GlButtonGroup from "./button-group";

const stackStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const meta = {
  title: "UI/Base/Button Group",
  component: GlButtonGroup,
  args: {
    vertical: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas button group documentation](https://design.gitlab.com/components/button-group/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const ThreeButtons = () => (
  <>
    <GlButton>Button 1</GlButton>
    <GlButton>Button 2</GlButton>
    <GlButton>Button 3</GlButton>
  </>
);

export const Default: Story = {
  args: {
    onClick: fn(),
  },
  render: (args) => <GlButtonGroup {...args}><ThreeButtons /></GlButtonGroup>,
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole("group");

    await expect(group).toHaveClass("gl-button-group", "btn-group");
    await expect(canvas.getAllByRole("button")).toHaveLength(3);
    await userEvent.click(canvas.getByRole("button", { name: "Button 1" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Vertical: Story = {
  args: {
    vertical: true,
  },
  render: (args) => <GlButtonGroup {...args}><ThreeButtons /></GlButtonGroup>,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group")).toHaveClass(
      "gl-button-group-vertical",
      "btn-group-vertical",
    );
  },
};

function InteractiveSelectedExample({ vertical = false }: { vertical?: boolean }) {
  const [selectedOption, setSelectedOption] = useState(1);

  return (
    <GlButtonGroup vertical={vertical}>
      {[1, 2, 3].map((option) => (
        <GlButton
          key={option}
          aria-pressed={selectedOption === option}
          onClick={() => setSelectedOption(option)}
          selected={selectedOption === option}>
          Option {option}
        </GlButton>
      ))}
    </GlButtonGroup>
  );
}

export const InteractiveSelected: Story = {
  render: (args) => <InteractiveSelectedExample vertical={args.vertical} />,
  play: async ({ canvas }) => {
    const first = canvas.getByRole("button", { name: "Option 1" });
    const second = canvas.getByRole("button", { name: "Option 2" });

    await expect(first).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(second);
    await expect(first).toHaveAttribute("aria-pressed", "false");
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(second).toHaveClass("selected");
  },
};

function ForwardedRefExample() {
  const groupRef = useRef<HTMLDivElement>(null);
  const [refTagName, setRefTagName] = useState("");

  useEffect(() => {
    setRefTagName(groupRef.current?.tagName ?? "");
  }, []);

  return (
    <>
      <GlButtonGroup ref={groupRef}><ThreeButtons /></GlButtonGroup>
      <output data-testid="forwarded-ref-target">{refTagName}</output>
    </>
  );
}

export const ForwardedRef: Story = {
  render: () => <ForwardedRefExample />,
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("forwarded-ref-target")).toHaveTextContent("DIV");
  },
};

export const VariantsAndStates: Story = {
  render: (args) => (
    <div style={stackStyle}>
      <GlButtonGroup {...args}>
        <GlButton>Default</GlButton>
        <GlButton selected aria-pressed="true">Selected</GlButton>
        <GlButton disabled>Disabled</GlButton>
      </GlButtonGroup>
      <GlButtonGroup {...args}>
        <GlButton variant="confirm">Confirm</GlButton>
        <GlButton category="secondary" variant="confirm">Confirm secondary</GlButton>
        <GlButton disabled variant="confirm">Disabled</GlButton>
      </GlButtonGroup>
      <GlButtonGroup {...args}>
        <GlButton variant="danger">Danger</GlButton>
        <GlButton category="secondary" variant="danger">Danger secondary</GlButton>
        <GlButton disabled variant="danger">Disabled</GlButton>
      </GlButtonGroup>
      <GlButtonGroup {...args}>
        <GlButton aria-label="Left" icon="arrow-left" />
        <GlButton aria-label="Up" icon="arrow-up" selected aria-pressed="true" />
        <GlButton aria-label="Right" icon="arrow-right" />
      </GlButtonGroup>
    </div>
  ),
};

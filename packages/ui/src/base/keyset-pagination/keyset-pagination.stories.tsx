import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlKeysetPagination from "./keyset-pagination";

const previous = fn();
const next = fn();

const meta = {
  title: "UI/Base/KeysetPagination",
  component: GlKeysetPagination,
  args: {
    hasNextPage: true,
    hasPreviousPage: false,
    onNext: next,
    onPrev: previous,
  },
  argTypes: {
    nextButtonContent: { control: false },
    previousButtonContent: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Cursor-based variant of the [Pajamas pagination](https://design.gitlab.com/components/pagination) component.",
      },
    },
  },
} satisfies Meta<typeof GlKeysetPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    next.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(args.onNext).toHaveBeenLastCalledWith(null);
  },
};

export const CursorEvents: Story = {
  args: {
    endCursor: "END_CURSOR",
    hasNextPage: true,
    hasPreviousPage: true,
    startCursor: "START_CURSOR",
  },
  play: async ({ args, canvas }) => {
    previous.mockClear();
    next.mockClear();

    await userEvent.click(canvas.getByRole("button", { name: "Previous" }));
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));

    await expect(args.onPrev).toHaveBeenLastCalledWith("START_CURSOR");
    await expect(args.onNext).toHaveBeenLastCalledWith("END_CURSOR");
  },
};

export const LinkBased: Story = {
  args: {
    hasNextPage: true,
    hasPreviousPage: true,
    nextButtonLink: "/results?after=END_CURSOR",
    prevButtonLink: "/results?before=START_CURSOR",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Previous" }))
      .toHaveAttribute("href", "/results?before=START_CURSOR");
    await expect(canvas.getByRole("link", { name: "Next" }))
      .toHaveAttribute("href", "/results?after=END_CURSOR");
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    hasNextPage: true,
    hasPreviousPage: true,
  },
  play: async ({ args, canvas }) => {
    previous.mockClear();
    next.mockClear();
    const previousButton = canvas.getByRole("button", { name: "Previous" });
    const nextButton = canvas.getByRole("button", { name: "Next" });

    await expect(previousButton).toHaveAttribute("aria-disabled", "true");
    await expect(nextButton).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(previousButton);
    await userEvent.click(nextButton);
    await expect(args.onPrev).not.toHaveBeenCalled();
    await expect(args.onNext).not.toHaveBeenCalled();
  },
};

export const CustomContent: Story = {
  args: {
    hasNextPage: true,
    hasPreviousPage: true,
    nextButtonContent: <span>Load newer results</span>,
    previousButtonContent: <span>Load older results</span>,
  },
};

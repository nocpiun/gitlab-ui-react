import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlButton from "../button/button";
import GlBanner, {
  GlBannerActions,
  GlBannerDescription,
  GlBannerTitle,
  type GlBannerVariant,
} from "./banner";

const variants = ["promotion", "introduction"] satisfies GlBannerVariant[];
const onPrimaryAction = fn();

const description = (
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
);

const meta = {
  title: "UI/Base/Banner",
  component: GlBanner,
  args: {
    dismissLabel: "Dismiss",
    onClose: fn(),
    variant: "promotion",
  },
  argTypes: {
    children: { control: false },
    variant: {
      control: "select",
      options: variants,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Banner is currently restricted for new usage upstream. See the [Pajamas banner documentation](https://design.gitlab.com/components/banner) for guidance. Illustration support is intentionally omitted from this React port.",
      },
    },
  },
  render: (args) => (
    <GlBanner {...args}>
      <GlBannerTitle>Lorem ipsum dolor sit amet</GlBannerTitle>
      <GlBannerDescription>{description}</GlBannerDescription>
      <GlBannerActions>
        <GlButton category="primary" onClick={onPrimaryAction} variant="confirm">
          Banner action
        </GlButton>
      </GlBannerActions>
    </GlBanner>
  ),
} satisfies Meta<typeof GlBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    onPrimaryAction.mockClear();

    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Lorem ipsum dolor sit amet",
    );
    await expect(canvas.getByText(/consectetur adipiscing elit/u)).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Banner action" }));
    await expect(onPrimaryAction).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole("button", { name: args.dismissLabel }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const Variants: Story = {
  argTypes: {
    variant: { control: false },
  },
  render: (args) => (
    <div className="gl-flex gl-flex-col gl-gap-5">
      {variants.map((variant) => (
        <GlBanner
          {...args}
          key={variant}
          variant={variant}>
          <GlBannerTitle>
            {variant === "promotion" ? "Promotion" : "Introduction"} banner
          </GlBannerTitle>
          <GlBannerDescription>{description}</GlBannerDescription>
          <GlBannerActions>
            <GlButton category="primary" variant="confirm">Banner action</GlButton>
          </GlBannerActions>
        </GlBanner>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const promotion = canvas.getByRole("heading", { name: "Promotion banner" })
      .closest(".gl-banner");
    const introduction = canvas.getByRole("heading", { name: "Introduction banner" })
      .closest(".gl-banner");

    await expect(promotion).not.toHaveClass("gl-banner-introduction");
    await expect(introduction).toHaveClass("gl-banner-introduction");
  },
};

export const WithActions: Story = {
  render: (args) => (
    <GlBanner {...args}>
      <GlBannerTitle>Banner with actions</GlBannerTitle>
      <GlBannerDescription>{description}</GlBannerDescription>
      <GlBannerActions>
        <GlButton category="primary" variant="confirm">Primary action</GlButton>
        <GlButton className="gl-ml-4" variant="link">Ask again later</GlButton>
      </GlBannerActions>
    </GlBanner>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Primary action" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Ask again later" })).toBeInTheDocument();
  },
};

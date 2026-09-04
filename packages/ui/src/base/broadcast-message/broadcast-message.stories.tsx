import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import iconsInfo from "@gitlab/svgs/dist/icons.json";
import { expect, fn, userEvent, within } from "storybook/test";
import GlBroadcastMessage, {
  type GlBroadcastMessageTheme,
  type GlBroadcastMessageType,
} from "./broadcast-message";

const themes = [
  "indigo",
  "light-indigo",
  "blue",
  "light-blue",
  "green",
  "light-green",
  "red",
  "light-red",
  "dark",
  "light",
] satisfies GlBroadcastMessageTheme[];

const types = ["banner", "notification"] satisfies GlBroadcastMessageType[];

const exampleText = (
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. <a href="#lorem-ipsum">Duis aute irure dolor</a> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
);

const increasedSpacing = {
  "--gl-broadcast-message-padding-x": "0.5rem",
} as CSSProperties;

const meta = {
  title: "UI/Base/Broadcast Message",
  component: GlBroadcastMessage,
  args: {
    children: exampleText,
    dismissible: true,
    dismissLabel: "Dismiss",
    iconName: "bullhorn",
    onDismiss: fn(),
    theme: "indigo",
    type: "banner",
  },
  argTypes: {
    iconName: {
      control: "select",
      options: iconsInfo.icons,
    },
    theme: {
      control: "select",
      options: themes,
    },
    type: {
      control: "select",
      options: types,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas broadcast message documentation](https://design.gitlab.com/components/broadcast-message) for usage and implementation guidance.",
      },
    },
  },
} satisfies Meta<typeof GlBroadcastMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const message = canvas.getByText("Admin message").closest(".gl-broadcast-message");

    await expect(message).toHaveClass("indigo", "banner");
    await expect(canvas.getByTestId("bullhorn-icon")).toHaveAttribute("aria-hidden", "true");

    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

export const Notification: Story = {
  args: {
    dismissible: false,
    type: "notification",
  },
  play: async ({ canvas }) => {
    const message = canvas.getByText("Admin message").closest(".gl-broadcast-message");

    await expect(message).toHaveClass("notification");
    await expect(canvas.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  },
};

export const Themes: Story = {
  argTypes: {
    theme: { control: false },
  },
  render: (args) => (
    <div>
      {themes.map((theme) => (
        <GlBroadcastMessage {...args} key={theme} theme={theme}>
          <span className="gl-capitalize">{theme}</span> broadcast message
        </GlBroadcastMessage>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for(const theme of themes) {
      const text = canvas.getByText(theme);
      await expect(text.closest(".gl-broadcast-message")).toHaveClass(theme);
    }
  },
};

export const IncreasedSpacing: Story = {
  render: (args) => (
    <div style={increasedSpacing}>
      <GlBroadcastMessage {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const message = canvas.getByText("Admin message").closest(".gl-broadcast-message");
    const container = message?.parentElement;

    await expect(container).toHaveStyle({ "--gl-broadcast-message-padding-x": "0.5rem" });
    await expect(
      within(message as HTMLElement).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();
  },
};

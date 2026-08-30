import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps, type CSSProperties } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlAvatar, {
  type GlAvatarShape,
  type GlAvatarSize,
} from "./avatar";

const avatarSizes = [96, 64, 48, 32, 24, 16] satisfies GlAvatarSize[];
const avatarShapes = ["circle", "rect"] satisfies GlAvatarShape[];

const rowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--gl-spacing-scale-4)",
};

const showcaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--gl-spacing-scale-5)",
};

const meta = {
  title: "UI/Base/Avatar",
  component: GlAvatar,
  args: {
    alt: "GitLab user avatar",
    entityId: 123,
    entityName: "GitLab User",
    fallbackOnError: false,
    shape: "circle",
    size: 64,
    src: "/img/avatar.jpg",
  },
  argTypes: {
    shape: {
      control: "select",
      options: avatarShapes,
    },
    size: {
      control: "select",
      options: avatarSizes,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas avatar documentation](https://design.gitlab.com/components/avatar/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "GitLab user avatar" });

    await expect(avatar).toHaveAttribute("src", "/img/avatar.jpg");
    await expect(avatar).toHaveClass("gl-avatar-circle", "gl-avatar-s64");
  },
};

export const ResponsiveImage: Story = {
  args: {
    size: { default: 24, sm: 32, md: 48, lg: 96 },
  },
  argTypes: {
    size: {
      control: "object",
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img")).toHaveClass(
      "gl-avatar-s24",
      "gl-sm-avatar-s32",
      "gl-md-avatar-s48",
      "gl-lg-avatar-s96",
    );
  },
};

export const ProjectFallback: Story = {
  args: {
    alt: "",
    shape: "rect",
    src: "",
  },
  play: async ({ canvas }) => {
    const avatar = canvas.getByText("G", { selector: ".gl-avatar-identicon" });

    await expect(avatar).toHaveAttribute("aria-hidden", "true");
    await expect(avatar).toHaveClass("gl-avatar-identicon-bg5");
  },
};

export const EmojiProjectName: Story = {
  args: {
    alt: "",
    entityName: "🦊Tanuki",
    shape: "rect",
    src: "",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("🦊")).toBeVisible();
  },
};

export const FallbackOnAvatarLoadFailure: Story = {
  args: {
    alt: "Some Project",
    fallbackOnError: true,
    onLoadError: fn(),
    shape: "rect",
    src: "/img/avatar-does-not-exist.jpg",
  },
  play: async ({ args, canvas }) => {
    await expect(
      await canvas.findByText("G", {}, { timeout: 3000 }),
    ).toHaveClass("gl-avatar-identicon");
    await expect(args.onLoadError).toHaveBeenCalledOnce();
  },
};

function SourceRecoveryExample(args: ComponentProps<typeof GlAvatar>) {
  const [src, setSrc] = useState("/img/avatar-does-not-exist.jpg");

  return (
    <div style={showcaseStyle}>
      <GlAvatar {...args} fallbackOnError src={src} />
      <button type="button" onClick={() => setSrc("/img/avatar.jpg")}>
        Use valid image
      </button>
    </div>
  );
}

export const SourceRecovery: Story = {
  args: {
    alt: "Recovered avatar",
    shape: "rect",
  },
  render: (args) => <SourceRecoveryExample {...args} />,
  play: async ({ canvas }) => {
    await canvas.findByText("G", {}, { timeout: 3000 });
    await userEvent.click(canvas.getByRole("button", { name: "Use valid image" }));
    await expect(
      await canvas.findByRole("img", { name: "Recovered avatar" }),
    ).toHaveAttribute("src", "/img/avatar.jpg");
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={showcaseStyle}>
      {avatarShapes.map((shape) => (
        <div key={shape} style={rowStyle}>
          {avatarSizes.map((size) => (
            <GlAvatar
              key={`${shape}-${size}`}
              alt={`${shape} ${size}px avatar`}
              shape={shape}
              size={size}
              src="/img/avatar.jpg" />
          ))}
        </div>
      ))}
      {avatarShapes.map((shape) => (
        <div key={`${shape}-fallback`} style={rowStyle}>
          {avatarSizes.map((size) => (
            <GlAvatar
              key={`${shape}-${size}-fallback`}
              entityName="A"
              shape={shape}
              size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("img")).toHaveLength(avatarSizes.length * 2);
    await expect(canvas.getAllByText("A")).toHaveLength(avatarSizes.length * 2);
  },
};

export const AllIdenticons: Story = {
  render: (args) => (
    <div style={rowStyle}>
      {[0, 1, 2, 3, 4, 5, 6].map((entityId) => (
        <GlAvatar
          {...args}
          key={entityId}
          entityId={entityId}
          entityName={entityId.toString()}
          shape="rect"
          src="" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const identicons = canvasElement.querySelectorAll(".gl-avatar-identicon");

    await expect(identicons).toHaveLength(7);
    for(const [index, identicon] of identicons.entries()) {
      await expect(identicon).toHaveClass(`gl-avatar-identicon-bg${index + 1}`);
    }
  },
};

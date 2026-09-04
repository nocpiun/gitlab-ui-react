import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlSkeletonLoader from "./skeleton-loader";

const customShapeWrapperStyle: CSSProperties = {
  width: 250,
};

const meta = {
  title: "UI/Base/Skeleton Loader",
  component: GlSkeletonLoader,
  args: {
    baseUrl: "",
    equalWidthLines: false,
    height: null,
    lines: 3,
    preserveAspectRatio: "xMidYMid meet",
    width: null,
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas skeleton loader documentation](https://design.gitlab.com/components/skeleton-loader/) for usage and implementation guidance.",
      },
    },
  },
} satisfies Meta<typeof GlSkeletonLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector(
      ".gl-skeleton-loader-default-container",
    );
    const svg = root?.querySelector("svg");
    const lines = svg?.querySelectorAll("clipPath rect");

    await expect(root).toBeInTheDocument();
    await expect(svg).toHaveAttribute("viewBox", "0 0 235 38");
    await expect(svg?.querySelector("title")).toHaveTextContent("Loading");
    await expect(lines).toHaveLength(3);
  },
};

export const WithCustomShapes: Story = {
  args: {
    height: 102,
    width: 327,
  },
  decorators: [
    (Story) => <div style={customShapeWrapperStyle}><Story /></div>,
  ],
  render: (args) => (
    <GlSkeletonLoader {...args}>
      <rect height="16" rx="4" width="276" />
      <rect height="16" rx="4" width="237" y="18" />
      <rect height="16" rx="8" width="118" y="42" />
      <rect height="16" rx="8" width="130" x="122" y="42" />
      <rect height="16" rx="8" width="106" y="62" />
      <rect height="16" rx="8" width="56" x="110" y="62" />
      <rect height="16" rx="8" width="71" x="256" y="42" />
      <rect height="16" rx="4" width="38" y="86" />
    </GlSkeletonLoader>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("svg.gl-skeleton-loader");

    await expect(root).toHaveClass("gl-skeleton-loader");
    await expect(root).toHaveAttribute("viewBox", "0 0 327 102");
    await expect(root?.querySelectorAll("clipPath rect")).toHaveLength(8);
    await expect(root?.parentElement).not.toHaveClass(
      "gl-skeleton-loader-default-container",
    );
  },
};

export const CSSBased: Story = {
  render: () => (
    <div>
      <div
        className="gl-animate-skeleton-loader gl-h-4 gl-rounded-default gl-my-3 !gl-max-w-20"
        data-testid="css-skeleton-line" />
      <div
        className="gl-animate-skeleton-loader gl-h-4 gl-rounded-default gl-my-3 !gl-max-w-30"
        data-testid="css-skeleton-line" />
      <div
        className="gl-animate-skeleton-loader gl-h-4 gl-rounded-default gl-my-3 !gl-max-w-26"
        data-testid="css-skeleton-line" />
    </div>
  ),
  play: async ({ canvas }) => {
    const lines = canvas.getAllByTestId("css-skeleton-line");

    await expect(lines).toHaveLength(3);
    for(const line of lines) {
      await expect(line).toHaveClass("gl-animate-skeleton-loader");
    }
  },
};

export const ReducedMotion: Story = {
  beforeEach: () => {
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = (query) => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    });

    return () => {
      window.matchMedia = originalMatchMedia;
    };
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    const fill = svg?.querySelector(":scope > rect");

    await expect(svg?.querySelector("linearGradient")).not.toBeInTheDocument();
    await expect(svg?.querySelector("animate")).not.toBeInTheDocument();
    await expect(fill).toHaveClass("gl-skeleton-loader-fill-background-color");
    await expect(fill).not.toHaveAttribute("fill");
  },
};

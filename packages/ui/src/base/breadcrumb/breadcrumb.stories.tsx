import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";
import GlBreadcrumb, {
  GlBreadcrumbItem,
  type GlBreadcrumbProps,
} from "./breadcrumb";

const avatarDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
  + "viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%237759c2'/%3E"
  + "%3Cpath d='M6 17 12 5l6 12Z' fill='white'/%3E%3C/svg%3E";

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  to: string;
};

const routerNavigated = fn();

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  onClick,
  to,
  ...anchorProps
}, forwardedRef) {
  return (
    <a
      {...anchorProps}
      ref={forwardedRef}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if(event.defaultPrevented) return;
        event.preventDefault();
        routerNavigated(to);
      }} />
  );
});

function renderDefaultItems() {
  return (
    <>
      <GlBreadcrumbItem avatarPath={avatarDataUrl} href="#group">GitLab.org</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#project">GitLab</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#issues">Issues</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#current">#1234</GlBreadcrumbItem>
    </>
  );
}

function BreadcrumbExample(props: GlBreadcrumbProps) {
  return (
    <GlBreadcrumb {...props}>
      {renderDefaultItems()}
    </GlBreadcrumb>
  );
}

const meta = {
  title: "UI/Base/Breadcrumb",
  component: GlBreadcrumb,
  args: {
    autoResize: false,
    showClipboardButton: false,
    showMoreLabel: "Show more breadcrumbs",
    size: "sm",
  },
  argTypes: {
    children: { control: false },
    pathToCopy: { control: "text" },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Composition-first React port of the [Pajamas Breadcrumb](https://design.gitlab.com/components/breadcrumb).",
      },
    },
  },
  render: (args) => <BreadcrumbExample {...args} />,
} satisfies Meta<typeof GlBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" });
    const links = canvas.getAllByRole("link");

    await expect(nav.querySelector("ol")).toHaveClass("gl-breadcrumb-list", "breadcrumb");
    await expect(links).toHaveLength(4);
    await expect(links.at(-1)).toHaveAttribute("aria-current", "page");
    await expect(canvasElement.querySelectorAll("[aria-current='page']")).toHaveLength(1);
    await expect(canvasElement.querySelector(".gl-avatar")).toHaveAttribute("aria-hidden", "true");
  },
};

export const Collapsed: Story = {
  args: {
    autoResize: true,
  },
  render: (args) => (
    <div style={{ width: 260 }}>
      <GlBreadcrumb {...args}>
        <GlBreadcrumbItem render={<RouterLink to="#group" />}>GitLab.org</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#project">GitLab project with a long name</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#issues">Merge requests</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#current">!1234</GlBreadcrumbItem>
      </GlBreadcrumb>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    routerNavigated.mockClear();
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(nav).not.toHaveStyle({ opacity: "0" }));

    const trigger = canvas.getByRole("button", { name: "Show more breadcrumbs" });
    await userEvent.click(trigger);

    const page = within(canvasElement.ownerDocument.body);
    const firstOverflowingItem = await page.findByRole("menuitem", { name: "GitLab.org" });
    await expect(firstOverflowingItem).toHaveAttribute("href", "#group");
    await userEvent.click(firstOverflowingItem);
    await expect(routerNavigated).toHaveBeenCalledWith("#group");
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-expanded", "true"));
  },
};

export const WithClipboardButton: Story = {
  args: {
    clipboardTooltipText: "Copy project path",
    pathToCopy: "GitLab.org/GitLab/Issues/#1234",
    showClipboardButton: true,
  },
  play: async ({ canvas }) => {
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    const writeText = fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    try {
      const copyButton = canvas.getByRole("button", { name: "Copy project path" });
      await userEvent.click(copyButton);
      await expect(writeText).toHaveBeenCalledWith("GitLab.org/GitLab/Issues/#1234");
      await waitFor(() => expect(copyButton).toHaveAttribute("aria-label", "Copied"));

      writeText.mockRejectedValueOnce(new Error("Clipboard unavailable"));
      await userEvent.click(copyButton);
      await waitFor(() => expect(copyButton).toHaveAttribute("aria-label", "Copy failed"));
      await waitFor(
        () => expect(copyButton).toHaveAttribute("aria-label", "Copy project path"),
        { timeout: 1500 },
      );
    } finally {
      if(clipboardDescriptor) {
        Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
      } else {
        Reflect.deleteProperty(navigator, "clipboard");
      }
    }
  },
};

export const MediumSize: Story = {
  args: {
    size: "md",
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".gl-breadcrumb-item-md")).toHaveLength(4);
    await expect(canvasElement.querySelector(".gl-avatar-s24")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "#1234" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const RouterComposition: Story = {
  render: (args) => (
    <GlBreadcrumb {...args}>
      <GlBreadcrumbItem href="#group">GitLab.org</GlBreadcrumbItem>
      <GlBreadcrumbItem render={<RouterLink data-router-link="" to="/gitlab/issues" />}>
        Issues
      </GlBreadcrumbItem>
    </GlBreadcrumb>
  ),
  play: async ({ canvas }) => {
    routerNavigated.mockClear();
    const routerLink = canvas.getByRole("link", { name: "Issues" });

    await expect(routerLink).toHaveAttribute("data-router-link", "");
    await expect(routerLink).toHaveAttribute("href", "/gitlab/issues");
    await userEvent.click(routerLink);
    await expect(routerNavigated).toHaveBeenCalledWith("/gitlab/issues");
  },
};

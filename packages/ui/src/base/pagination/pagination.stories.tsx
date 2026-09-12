import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlPagination, { type GlPaginationProps } from "./pagination";

const valueChanged = fn();
const previous = fn();
const next = fn();

function ControlledPagination({
  onValueChange,
  value = 1,
  ...paginationProps
}: GlPaginationProps) {
  const [currentPage, setCurrentPage] = useState(value);

  useEffect(() => setCurrentPage(value), [value]);

  return (
    <GlPagination
      {...paginationProps}
      onValueChange={(page) => {
        setCurrentPage(page);
        onValueChange?.(page);
      }}
      value={currentPage} />
  );
}

const meta = {
  title: "UI/Base/Pagination",
  component: GlPagination,
  args: {
    align: "left",
    onNext: next,
    onPrevious: previous,
    onValueChange: valueChanged,
    perPage: 10,
    totalItems: 200,
    value: 3,
  },
  argTypes: {
    ellipsisLeft: { control: false },
    ellipsisRight: { control: false },
    labelPage: { control: false },
    limits: { control: "object" },
    linkGen: { control: false },
    renderNext: { control: false },
    renderPageNumber: { control: false },
    renderPrevious: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "React port of the [Pajamas pagination](https://design.gitlab.com/components/pagination) component.",
      },
    },
  },
  render: (args) => <ControlledPagination {...args} />,
} satisfies Meta<typeof GlPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    valueChanged.mockClear();
    previous.mockClear();
    next.mockClear();

    const nextControl = canvas.getByRole("link", { name: "Go to next page" });
    await userEvent.click(nextControl);

    await expect(args.onValueChange).toHaveBeenLastCalledWith(4);
    await expect(args.onNext).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("link", { name: "Go to page 4" }))
      .toHaveAttribute("aria-current", "page");

    await userEvent.click(canvas.getByRole("link", { name: "Go to previous page" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(3);
    await expect(args.onPrevious).toHaveBeenCalledOnce();
  },
};

export const LinkBased: Story = {
  args: {
    linkGen: (page) => `/page/${page}`,
  },
  play: async ({ args, canvas }) => {
    valueChanged.mockClear();
    next.mockClear();
    const nextControl = canvas.getByRole("link", { name: "Go to next page" });
    nextControl.addEventListener("click", (event) => event.preventDefault(), { once: true });

    await expect(nextControl).toHaveAttribute("href", "/page/4");
    await userEvent.click(nextControl);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(args.onNext).toHaveBeenCalledOnce();
  },
};

export const ResponsiveCollapse: Story = {
  args: {
    perPage: 5,
    totalItems: 75,
    value: 8,
  },
  play: async ({ canvas }) => {
    const originalWidth = window.innerWidth;
    const setWidth = (width: number) => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      window.dispatchEvent(new Event("resize"));
    };

    try {
      setWidth(576);
      await waitFor(() => {
        expect(canvas.queryByRole("link", { name: "Go to page 4" })).not.toBeInTheDocument();
        expect(canvas.getByRole("link", { name: "Go to page 8" })).toBeInTheDocument();
      });

      setWidth(1024);
      await waitFor(() => {
        expect(canvas.getByRole("link", { name: "Go to page 4" })).toBeInTheDocument();
        expect(canvas.getByRole("link", { name: "Go to page 12" })).toBeInTheDocument();
      });
    } finally {
      setWidth(originalWidth);
    }
  },
};

export const Compact: Story = {
  args: {
    nextPage: 2,
    perPage: 20,
    totalItems: 0,
    value: 1,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "Go to previous page" }))
      .not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Go to next page" }))
      .toBeInTheDocument();
  },
};

export const AlignmentMatrix: Story = {
  render: (args) => (
    <div className="gl-flex gl-flex-col gl-gap-5">
      {(["left", "center", "right", "fill"] as const).map((align) => (
        <div key={align}>
          <div className="gl-mb-2">{align}</div>
          <GlPagination
            {...args}
            align={align}
            labelNav={`Pagination aligned ${align}`} />
        </div>
      ))}
    </div>
  ),
};

export const CustomContent: Story = {
  args: {
    ellipsisLeft: <span aria-hidden="true">←</span>,
    ellipsisRight: <span aria-hidden="true">→</span>,
    renderNext: () => <span>Forward</span>,
    renderPageNumber: ({ page }) => <span>Page {page}</span>,
    renderPrevious: () => <span>Back</span>,
    totalItems: 300,
    value: 15,
  },
};

function RefExample(props: GlPaginationProps) {
  const [tagName, setTagName] = useState("none");
  const paginationRef = useCallback((element: HTMLElement | null) => {
    setTagName(element?.tagName ?? "none");
  }, []);

  return (
    <>
      <div>Ref target: {tagName}</div>
      <GlPagination {...props} ref={paginationRef} />
    </>
  );
}

export const ForwardedRef: Story = {
  render: (args) => <RefExample {...args} />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Ref target: NAV")).toBeInTheDocument());
  },
};

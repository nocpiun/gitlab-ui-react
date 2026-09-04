import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlTable, {
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableFooter,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
  type GlTableProps,
} from "./table";

const rows = [
  { pipeline: "Build", status: "Passed", duration: "3m 14s" },
  { pipeline: "Test", status: "Running", duration: "8m 02s" },
  { pipeline: "Deploy", status: "Pending", duration: "—" },
];

function ExampleTable(props: GlTableProps) {
  return (
    <GlTable {...props}>
      <GlTableCaption>Current pipeline stages</GlTableCaption>
      <GlTableHeader>
        <GlTableRow>
          <GlTableHead>Pipeline</GlTableHead>
          <GlTableHead>Status</GlTableHead>
          <GlTableHead className="gl-text-right">Duration</GlTableHead>
        </GlTableRow>
      </GlTableHeader>
      <GlTableBody>
        {rows.map((row) => (
          <GlTableRow key={row.pipeline}>
            <GlTableHead scope="row" stackedHeading="Pipeline">
              {row.pipeline}
            </GlTableHead>
            <GlTableCell stackedHeading="Status">{row.status}</GlTableCell>
            <GlTableCell className="gl-text-right" stackedHeading="Duration">
              {row.duration}
            </GlTableCell>
          </GlTableRow>
        ))}
      </GlTableBody>
      <GlTableFooter>
        <GlTableRow>
          <GlTableCell colSpan={2}>Total stages</GlTableCell>
          <GlTableCell className="gl-text-right">3</GlTableCell>
        </GlTableRow>
      </GlTableFooter>
    </GlTable>
  );
}

const meta = {
  title: "UI/Base/Table",
  component: GlTable,
  args: {
    bordered: false,
    borderless: false,
    captionTop: false,
    fixed: false,
    hover: false,
    noBorderCollapse: false,
    outlined: false,
    small: false,
    stacked: false,
    stickyHeader: false,
    striped: false,
  },
  argTypes: {
    stacked: {
      control: "select",
      options: [false, true, "sm", "md", "lg", "xl"],
    },
    stickyHeader: {
      control: "boolean",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A compositional React port of GitLab UI's lightweight table. See the [Pajamas table documentation](https://design.gitlab.com/components/table) for usage guidance.",
      },
    },
  },
  render: (args) => <ExampleTable {...args} />,
} satisfies Meta<typeof GlTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Current pipeline stages" });

    await expect(table).toHaveClass("gl-table");
    await expect(table.querySelector("caption")?.parentElement).toBe(table);
    await expect(canvas.getByRole("columnheader", { name: "Pipeline" }))
      .toHaveAttribute("scope", "col");
    await expect(canvas.getByRole("rowheader", { name: /Build/u }))
      .toHaveAttribute("scope", "row");
  },
};

export const BorderVariants: Story = {
  render: () => (
    <div
      className="gl-grid gl-gap-5"
      style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      <section>
        <h3 className="gl-heading-scale-300">Bordered</h3>
        <ExampleTable bordered />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Borderless</h3>
        <ExampleTable borderless />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Borderless takes precedence</h3>
        <ExampleTable bordered borderless />
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    const tables = canvas.getAllByRole("table");

    await expect(tables[0]).toHaveClass("table-bordered");
    await expect(tables[1]).toHaveClass("table-borderless");
    await expect(tables[2]).toHaveClass("table-bordered", "table-borderless");
  },
};

export const LightweightStyles: Story = {
  render: () => (
    <div className="gl-grid gl-gap-5">
      <section>
        <h3 className="gl-heading-scale-300">Hover and striped</h3>
        <ExampleTable hover striped />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Small and outlined</h3>
        <ExampleTable small outlined />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Fixed layout</h3>
        <ExampleTable fixed />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Caption on top</h3>
        <ExampleTable captionTop />
      </section>
      <section>
        <h3 className="gl-heading-scale-300">Separate borders</h3>
        <ExampleTable bordered noBorderCollapse />
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    const tables = canvas.getAllByRole("table");

    await expect(tables[0]).toHaveClass("table-hover", "table-striped");
    await expect(tables[1]).toHaveClass("table-sm", "gl-border");
    await expect(tables[2]).toHaveClass("b-table-fixed");
    await expect(tables[3]).toHaveClass("b-table-caption-top");
    await expect(tables[4]).toHaveClass(
      "table-bordered",
      "b-table-no-border-collapse",
    );
  },
};

export const StickyHeader: Story = {
  render: () => (
    <GlTable stickyHeader="14rem">
      <GlTableCaption>Scrollable pipeline history</GlTableCaption>
      <GlTableHeader>
        <GlTableRow>
          <GlTableHead>Pipeline</GlTableHead>
          <GlTableHead>Status</GlTableHead>
        </GlTableRow>
      </GlTableHeader>
      <GlTableBody>
        {Array.from({ length: 12 }, (_, index) => (
          <GlTableRow key={index}>
            <GlTableHead scope="row">Pipeline {index + 1}</GlTableHead>
            <GlTableCell>{index % 2 === 0 ? "Passed" : "Running"}</GlTableCell>
          </GlTableRow>
        ))}
      </GlTableBody>
    </GlTable>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Scrollable pipeline history" });

    await expect(table).toHaveClass("gl-table--sticky-header");
    await expect(table.parentElement).toHaveClass("b-table-sticky-header");
    await expect(table.parentElement).toHaveAttribute("style", "max-height: 14rem;");
  },
};

export const Stacked: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <ExampleTable stacked />
    </div>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Current pipeline stages" });
    const header = table.querySelector("thead");
    const cell = table.querySelector("tbody td");

    await expect(table).toHaveClass("b-table-stacked");
    await expect(getComputedStyle(table).display).toBe("block");
    await expect(getComputedStyle(header as HTMLElement).display).toBe("none");
    await expect(getComputedStyle(cell as HTMLElement).display).toBe("block");
    await expect(cell).toHaveAttribute("data-label", "Status");
  },
};

export const BreakpointStacked: Story = {
  args: {
    stacked: "md",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};
